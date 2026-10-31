import { Router } from "express";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireRole } from "../../shared/auth";
import { sendData, sendError } from "../../shared";
import { recordPayment } from "../../services/payment.service";
import { createPaymentSchema, paymentListQuerySchema } from "./payments.schemas";

// Mounted at /api/v1/payments.
export const paymentsRouter = Router();
paymentsRouter.use(requireAuth, requireRole(Role.ADMIN, Role.STAFF));

paymentsRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid payment.", parsed.error.flatten().fieldErrors as Record<string, string>);
    const payment = await recordPayment(parsed.data);
    return sendData(res, payment);
  } catch (error) { next(error); }
});

paymentsRouter.get("/", async (req, res, next) => {
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
