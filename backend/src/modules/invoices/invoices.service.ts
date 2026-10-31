import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import { AppError } from "../../shared/AppError";
import { ParsedPagination } from "../../shared/pagination";

export const detailInclude = {
  customer: true,
  subscription: true,
  lines: { include: { product: true } },
  discounts: { include: { discount: true } },
  payments: true,
} as const;

export async function listInvoices(
  pagination: ParsedPagination,
  filters: { status?: string; customerId?: number; search?: string; from?: Date; to?: Date }
) {
  const where: Prisma.InvoiceWhereInput = {};
  if (filters.status) where.status = filters.status as Prisma.EnumInvoiceStatusFilter["equals"];
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.search) where.number = { contains: filters.search };
  if (filters.from || filters.to) {
    where.issueDate = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  const [rows, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { customer: true, subscription: true },
      orderBy: { [pagination.sort]: pagination.order },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.invoice.count({ where }),
  ]);

  return { rows, total };
}

export async function getInvoice(id: number) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: detailInclude });
  if (!invoice) {
    throw new AppError(404, "NOT_FOUND", "Invoice not found");
  }
  return invoice;
}

export async function confirmInvoice(id: number) {
  const invoice = await getInvoice(id);
  if (invoice.status !== "DRAFT") {
    throw new AppError(400, "VALIDATION_ERROR", "Only a DRAFT invoice can be confirmed");
  }
  return prisma.invoice.update({ where: { id }, data: { status: "CONFIRMED" }, include: detailInclude });
}

export async function cancelInvoice(id: number) {
  const invoice = await getInvoice(id);
  if (invoice.status !== "DRAFT" && invoice.status !== "CONFIRMED") {
    throw new AppError(400, "VALIDATION_ERROR", "Only a DRAFT or CONFIRMED invoice can be cancelled");
  }
  if (Number(invoice.amountPaid) !== 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Cannot cancel an invoice that has payments recorded");
  }
  return prisma.invoice.update({ where: { id }, data: { status: "CANCELLED" }, include: detailInclude });
}

export async function listInvoicePayments(id: number) {
  await getInvoice(id);
  return prisma.payment.findMany({ where: { invoiceId: id }, orderBy: { paymentDate: "desc" } });
}

export async function sendInvoice(id: number) {
  const invoice = await getInvoice(id);
  // No SMTP configured in this environment: log instead of sending, per contract 1.1.
  console.log(`[email] Invoice ${invoice.number} sent to ${invoice.customer.email}`);
  return prisma.invoice.update({ where: { id }, data: { sentAt: new Date() }, include: detailInclude });
}
