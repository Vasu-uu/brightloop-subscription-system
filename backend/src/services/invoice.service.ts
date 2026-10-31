import { Invoice, Prisma } from "@prisma/client";
import { prisma } from "../shared/prisma";
import { AppError } from "../shared/AppError";
import { calculateLineTotals, getApplicableDiscounts, markDiscountsUsed, LineInput } from "./pricing.service.stub";
import { addBillingPeriod } from "../modules/subscriptions/subscriptions.service";

const invoiceDetailInclude = {
  customer: true,
  subscription: true,
  lines: { include: { product: true } },
  discounts: { include: { discount: true } },
  payments: true,
} as const;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function nextInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
  const rows = await tx.$queryRaw<{ maxNum: number | bigint | null }[]>(
    Prisma.sql`SELECT MAX(CAST(SUBSTRING(number, 5) AS UNSIGNED)) as maxNum FROM Invoice FOR UPDATE`
  );
  const next = Number(rows[0]?.maxNum ?? 0) + 1;
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

export async function createInvoiceFromSubscription(subscriptionId: number, periodStart: Date): Promise<Invoice> {
  return prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.findUnique({
      where: { id: subscriptionId },
      include: { lines: { include: { product: true, variant: true } } },
    });
    if (!subscription) {
      throw new AppError(404, "NOT_FOUND", "Subscription not found");
    }

    const plan = await tx.plan.findUnique({ where: { id: subscription.planId } });
    if (!plan) {
      throw new AppError(404, "NOT_FOUND", "Plan not found");
    }

    const periodEnd = addBillingPeriod(periodStart, plan.billingPeriod);
    const issueDate = new Date();
    const dueDate = addDays(issueDate, subscription.paymentTermDays);

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

    const number = await nextInvoiceNumber(tx);

    let invoice: Invoice;
    try {
      invoice = await tx.invoice.create({
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
          lines: {
            create: pricedLines.map((line) => {
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
            }),
          },
          discounts: {
            create: discounts.map((d) => ({ discountId: d.discountId, amount: d.amount })),
          },
        },
        include: invoiceDetailInclude,
      });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        const existing = await tx.invoice.findUnique({
          where: { subscriptionId_periodStart: { subscriptionId, periodStart } },
          include: invoiceDetailInclude,
        });
        if (existing) return existing;
      }
      throw err;
    }

    if (discounts.length) {
      await markDiscountsUsed(discounts.map((d) => d.discountId));
    }

    await tx.subscription.update({ where: { id: subscriptionId }, data: { nextBillingDate: periodEnd } });

    return invoice;
  });
}

export async function runBilling(
  asOf: Date
): Promise<{ created: number; skipped: number; invoiceIds: number[] }> {
  throw new Error("not implemented");
}
