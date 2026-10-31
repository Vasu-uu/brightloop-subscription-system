// TEMPORARY STUB — owned by P1 per contract 1.6 (backend/src/services/pricing.service.ts).
// Delete this file once P1's real pricing.service.ts is merged to main, and update imports
// in quotation-templates/subscriptions/invoices modules to point at it instead.
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
  const taxes = taxIds.length
    ? await prisma.tax.findMany({ where: { id: { in: taxIds } } })
    : [];
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
  _subscriptionId: number,
  _asOf: Date
): Promise<{ discountId: number; name: string; amount: number }[]> {
  return [];
}

export async function markDiscountsUsed(_discountIds: number[]): Promise<void> {
  return;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
