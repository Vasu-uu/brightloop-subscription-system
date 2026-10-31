import { Invoice, Plan, Prisma } from "@prisma/client";
import { prisma } from "../shared/prisma";
import { AppError } from "../shared/AppError";
import { calculateLineTotals, getApplicableDiscounts, markDiscountsUsed, LineInput } from "./pricing.service";
import { addBillingPeriod } from "../modules/subscriptions/subscriptions.service";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function nextInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
  // See nextSubscriptionNumber: indexed last-row lookup instead of a
  // MAX(...) scan, which gets expensive (and locks the whole table) as the
  // Invoice table grows into the thousands.
  const rows = await tx.$queryRaw<{ number: string }[]>(
    Prisma.sql`SELECT number FROM Invoice ORDER BY id DESC LIMIT 1 FOR UPDATE`
  );
  const next = (rows[0] ? parseInt(rows[0].number.slice(4), 10) : 0) + 1;
  return `INV-${String(next).padStart(5, "0")}`;
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

const subscriptionWithLinesInclude = {
  lines: { include: { product: true, variant: true } },
} satisfies Prisma.SubscriptionInclude;

type SubscriptionWithLines = Prisma.SubscriptionGetPayload<{ include: typeof subscriptionWithLinesInclude }>;

// Batch billing (runBilling) loads subscriptions and plans once per batch of
// 200 and passes them in here, instead of every single invoice re-querying
// its own subscription+lines+plan — at a few thousand invoices per run that
// was the dominant cost. Callers outside runBilling omit this and the
// function fetches as before.
export async function createInvoiceFromSubscription(
  subscriptionId: number,
  periodStart: Date,
  preloaded?: { subscription: SubscriptionWithLines; plan: Plan }
): Promise<Invoice> {
  const subscription =
    preloaded?.subscription ??
    (await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: subscriptionWithLinesInclude,
    }));
  if (!subscription) {
    throw new AppError(404, "NOT_FOUND", "Subscription not found");
  }

  const plan = preloaded?.plan ?? (await prisma.plan.findUnique({ where: { id: subscription.planId } }));
  if (!plan) {
    throw new AppError(404, "NOT_FOUND", "Plan not found");
  }

  const periodEnd = addBillingPeriod(periodStart, plan.billingPeriod);
  const issueDate = new Date();
  const dueDate = addDays(issueDate, subscription.paymentTermDays);

  // calculateLineTotals / getApplicableDiscounts use the plain `prisma`
  // client (their contract signature has no tx parameter), so they must run
  // BEFORE the transaction below opens. Mixing calls on the plain client
  // with calls on an open interactive transaction's `tx` client is a known
  // Prisma hazard: it reliably stalls until the transaction's 5s timeout
  // fires, even though each call is fast in isolation. Keeping the
  // transaction to just the numbering lock + insert + subscription update
  // avoids that and also minimizes how long the FOR UPDATE lock is held.
  const lineInputs: LineInput[] = subscription.lines.map((line) => ({
    productId: line.productId,
    variantId: line.variantId,
    quantity: line.quantity,
    unitPrice: Number(line.unitPrice),
    taxId: line.taxId,
  }));
  const { lines: pricedLines, subtotal, taxTotal } = await calculateLineTotals(lineInputs);

  const discounts = await getApplicableDiscounts(subscriptionId, periodStart);
  const discountTotal = round2(discounts.reduce((sum, d) => sum + d.amount, 0));
  const total = round2(subtotal - discountTotal + taxTotal);

  const lineCreateData = pricedLines.map((line) => {
    const subLine = subscription.lines.find(
      (sl) => sl.productId === line.productId && sl.variantId === (line.variantId ?? null)
    );
    const description = subLine
      ? `${subLine.product.name}${subLine.variant ? ` (${subLine.variant.attribute}: ${subLine.variant.value})` : ""}`
      : "Line item";
    return {
      productId: line.productId,
      description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      taxPercent: line.taxPercent,
      taxAmount: line.taxAmount,
      amount: line.amount,
    };
  });

  let invoice: Invoice;
  let wasCreated = true;
  try {
    invoice = await prisma.$transaction(async (tx) => {
      const number = await nextInvoiceNumber(tx);
      const created = await tx.invoice.create({
        data: {
          number,
          subscriptionId,
          customerId: subscription.customerId,
          status: "DRAFT",
          issueDate,
          dueDate,
          periodStart,
          periodEnd,
          subtotal,
          discountTotal,
          taxTotal,
          total,
          lines: { create: lineCreateData },
          discounts: { create: discounts.map((d) => ({ discountId: d.discountId, amount: d.amount })) },
        },
        // No include: callers here only need the scalar fields (id,
        // periodEnd); this avoids several extra joins per invoice on the
        // hot billing path.
      });
      await tx.subscription.update({ where: { id: subscriptionId }, data: { nextBillingDate: periodEnd } });
      return created;
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      const existing = await prisma.invoice.findUnique({
        where: { subscriptionId_periodStart: { subscriptionId, periodStart } },
      });
      if (existing) {
        wasCreated = false;
        invoice = existing;
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

  // Treated as skipped, not an error, per contract 1.7 — only mark usage on
  // a genuine creation, never on the idempotent fallback above.
  if (wasCreated && discounts.length) {
    await markDiscountsUsed(discounts.map((d) => d.discountId));
  }

  return invoice;
}

const BILLING_BATCH_SIZE = 200;

export async function runBilling(
  asOf: Date
): Promise<{ created: number; skipped: number; invoiceIds: number[] }> {
  // Auto-close subscriptions whose plan.autoClose is true, once expiryDate has passed.
  await prisma.subscription.updateMany({
    where: { status: "ACTIVE", expiryDate: { lt: asOf }, plan: { autoClose: true } },
    data: { status: "CLOSED" },
  });

  let created = 0;
  let skipped = 0;
  const invoiceIds: number[] = [];

  // A subscription is only eligible when nextBillingDate is also on or
  // before its OWN expiryDate (contract 1.7), a field-to-field comparison
  // Prisma can't express in `where`. The inner loop below enforces that in
  // JS instead — but a subscription whose expiryDate has already passed
  // (plan.autoClose false, so it's still ACTIVE) would then never advance
  // past the outer filter, re-querying the same batch forever. Snapshotting
  // the eligible IDs once up front guarantees the outer loop terminates
  // regardless of whether any given subscription's nextBillingDate moves.
  const eligible = await prisma.subscription.findMany({
    where: { status: "ACTIVE", isPaused: false, nextBillingDate: { lte: asOf } },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  for (let i = 0; i < eligible.length; i += BILLING_BATCH_SIZE) {
    const idsChunk = eligible.slice(i, i + BILLING_BATCH_SIZE).map((row) => row.id);
    const batch = await prisma.subscription.findMany({
      where: { id: { in: idsChunk } },
      include: { ...subscriptionWithLinesInclude, plan: true },
    });

    for (const subscription of batch) {
      let periodStart = subscription.nextBillingDate;
      while (periodStart && periodStart <= asOf && periodStart <= subscription.expiryDate) {
        const existing = await prisma.invoice.findUnique({
          where: { subscriptionId_periodStart: { subscriptionId: subscription.id, periodStart } },
        });
        if (existing) {
          skipped++;
          periodStart = existing.periodEnd;
          continue;
        }
        const invoice = await createInvoiceFromSubscription(subscription.id, periodStart, {
          subscription,
          plan: subscription.plan,
        });
        created++;
        invoiceIds.push(invoice.id);
        periodStart = invoice.periodEnd;
      }
    }
  }

  return { created, skipped, invoiceIds };
}
