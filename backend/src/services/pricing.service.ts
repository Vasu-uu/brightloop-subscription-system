import { prisma } from "../shared/prisma";

export type LineInput = {
  productId: number;
  variantId?: number | null;
  quantity: number;
  unitPrice: number;
  taxId?: number | null;
};

export type LineOutput = LineInput & { taxPercent: number; amount: number; taxAmount: number };

export async function calculateLineTotals(
  lines: LineInput[]
): Promise<{ lines: LineOutput[]; subtotal: number; taxTotal: number; total: number }> {
  const taxIds = [...new Set(lines.map((l) => l.taxId).filter((id): id is number => id != null))];
  const taxes = taxIds.length ? await prisma.tax.findMany({ where: { id: { in: taxIds } } }) : [];
  const taxById = new Map(taxes.map((t) => [t.id, Number(t.ratePercent)]));

  const outLines: LineOutput[] = lines.map((line) => {
    const amount = round2(line.quantity * line.unitPrice);
    const taxPercent = line.taxId != null ? taxById.get(line.taxId) ?? 0 : 0;
    const taxAmount = round2((amount * taxPercent) / 100);
    return { ...line, taxPercent, amount, taxAmount };
  });

  const subtotal = round2(outLines.reduce((sum, l) => sum + l.amount, 0));
  const taxTotal = round2(outLines.reduce((sum, l) => sum + l.taxAmount, 0));
  const total = round2(subtotal + taxTotal);

  return { lines: outLines, subtotal, taxTotal, total };
}

export async function getApplicableDiscounts(
  subscriptionId: number,
  asOf: Date
): Promise<{ discountId: number; name: string; amount: number }[]> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { lines: true },
  });
  if (!subscription) return [];

  const candidates = await prisma.discount.findMany({
    where: {
      isActive: true,
      startDate: { lte: asOf },
      OR: [{ endDate: null }, { endDate: { gte: asOf } }],
    },
    include: { products: { select: { id: true } }, subscriptions: { select: { id: true } } },
  });

  const results: { discountId: number; name: string; amount: number }[] = [];

  for (const discount of candidates) {
    if (discount.usageLimit != null && discount.usedCount >= discount.usageLimit) continue;

    // An empty `subscriptions` list means the discount targets ALL subscriptions.
    if (discount.subscriptions.length > 0 && !discount.subscriptions.some((s) => s.id === subscriptionId)) {
      continue;
    }

    let eligibleLines = subscription.lines;
    if (discount.appliesTo === "PRODUCT") {
      const productIds = new Set(discount.products.map((p) => p.id));
      eligibleLines = subscription.lines.filter((l) => productIds.has(l.productId));
      if (eligibleLines.length === 0) continue;
    }

    const eligibleQuantity = eligibleLines.reduce((sum, l) => sum + l.quantity, 0);
    const eligibleSubtotal = round2(eligibleLines.reduce((sum, l) => sum + Number(l.amount), 0));

    if (discount.minQuantity != null && eligibleQuantity < discount.minQuantity) continue;
    if (discount.minPurchase != null && eligibleSubtotal < Number(discount.minPurchase)) continue;

    const amount =
      discount.type === "PERCENTAGE"
        ? round2((eligibleSubtotal * Number(discount.value)) / 100)
        : Math.min(Number(discount.value), eligibleSubtotal);

    if (amount <= 0) continue;

    results.push({ discountId: discount.id, name: discount.name, amount: round2(amount) });
  }

  return results;
}

export async function markDiscountsUsed(discountIds: number[]): Promise<void> {
  if (discountIds.length === 0) return;
  await prisma.discount.updateMany({
    where: { id: { in: discountIds } },
    data: { usedCount: { increment: 1 } },
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
