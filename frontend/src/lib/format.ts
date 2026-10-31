const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number | string | null | undefined): string {
  return money.format(Number(value ?? 0));
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function toDateInput(value?: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export function daysOverdue(dueDate: string): number {
  const ms = Date.now() - new Date(dueDate).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function dateToIsoStart(date: string): string | undefined {
  return date ? new Date(`${date}T00:00:00.000Z`).toISOString() : undefined;
}

export function dateToIsoEnd(date: string): string | undefined {
  return date ? new Date(`${date}T23:59:59.999Z`).toISOString() : undefined;
}

export function errorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: { message?: string; fields?: Record<string, string> } } } };
  const fields = e?.response?.data?.error?.fields;
  const first = fields ? Object.values(fields)[0] : undefined;
  return first ?? e?.response?.data?.error?.message ?? fallback;
}

const moneyWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatMoneyWhole(value: number | string | null | undefined): string {
  return moneyWhole.format(Number(value ?? 0));
}
