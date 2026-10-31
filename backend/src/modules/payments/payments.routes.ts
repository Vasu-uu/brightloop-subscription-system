import { Router } from "express";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireRole } from "../../shared/auth";
import { sendData, sendError, parsePagination } from "../../shared";
import { AppError } from "../../shared/AppError";
import { recordPayment } from "../../services/payment.service";
import { createPaymentSchema, paymentListQuerySchema } from "./payments.schemas";

const router = Router();
router.use(requireAuth, requireRole(Role.ADMIN, Role.STAFF));

router.post("/payments", async (req, res, next) => {
  try {
    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid payment.", parsed.error.flatten().fieldErrors as Record<string, string>);
    const payment = await recordPayment(parsed.data);
    return sendData(res, payment);
  } catch (error) { next(error); }
});

router.get("/payments", async (req, res, next) => {
  try {
    const parsed = paymentListQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid query parameters.");
    const { page, pageSize, from, to, customerId, sort, order } = parsed.data;
    const where: Prisma.PaymentWhereInput = {
      ...(from || to ? { paymentDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
      ...(customerId ? { invoice: { customerId } } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.payment.findMany({ where, include: { invoice: { select: { id: true, number: true, customerId: true, total: true, amountPaid: true, status: true } } }, orderBy: { [sort]: order }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.payment.count({ where }),
    ]);
    return sendData(res, data, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) { next(error); }
});

router.get("/invoices/:id/payments", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "VALIDATION_ERROR", "Invalid invoice id.");
    const invoice = await prisma.invoice.findUnique({ where: { id }, select: { id: true } });
    if (!invoice) throw new AppError(404, "NOT_FOUND", "Invoice not found.");
    const payments = await prisma.payment.findMany({ where: { invoiceId: id }, orderBy: { paymentDate: "desc" } });
    return sendData(res, payments);
  } catch (error) { next(error); }
});

export default router;
