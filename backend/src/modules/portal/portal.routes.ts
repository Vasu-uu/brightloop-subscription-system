import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../shared/auth";
import { sendData, sendError } from "../../shared";
import { AppError } from "../../shared/AppError";
import { recordPayment, getInvoiceBalance } from "../../services/payment.service";
import { portalPaySchema, portalListQuerySchema } from "./portal.schemas";

const router = Router();
router.use(requireAuth, requireRole(Role.CUSTOMER));

router.get("/subscriptions", async (req, res, next) => {
  try {
    const q = portalListQuerySchema.parse(req.query);
    const where = { customerId: req.user!.userId };
    const [data, total] = await prisma.$transaction([
      prisma.subscription.findMany({ where, include: { plan: true, lines: { include: { product: true, variant: true, tax: true } } }, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      prisma.subscription.count({ where }),
    ]);
    return sendData(res, data, { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) });
  } catch (error) { next(error); }
});
router.get("/subscriptions/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = await prisma.subscription.findFirst({ where: { id, customerId: req.user!.userId }, include: { plan: true, lines: { include: { product: true, variant: true, tax: true } }, invoices: true } });
    if (!data) throw new AppError(404, "NOT_FOUND", "Subscription not found.");
    return sendData(res, data);
  } catch (error) { next(error); }
});
router.get("/invoices", async (req, res, next) => {
  try {
    const q = portalListQuerySchema.parse(req.query);
    const where = { customerId: req.user!.userId };
    const [data, total] = await prisma.$transaction([
      prisma.invoice.findMany({ where, include: { customer: true, subscription: { include: { plan: true } }, lines: true, discounts: true, payments: true }, orderBy: { issueDate: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      prisma.invoice.count({ where }),
    ]);
    return sendData(res, data, { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) });
  } catch (error) { next(error); }
});
router.get("/invoices/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = await prisma.invoice.findFirst({ where: { id, customerId: req.user!.userId }, include: { customer: true, subscription: { include: { plan: true } }, lines: true, discounts: true, payments: true } });
    if (!data) throw new AppError(404, "NOT_FOUND", "Invoice not found.");
    return sendData(res, data);
  } catch (error) { next(error); }
});
router.post("/invoices/:id/pay", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const parsed = portalPaySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid payment method.");
    const invoice = await prisma.invoice.findFirst({ where: { id, customerId: req.user!.userId }, select: { id: true, total: true, amountPaid: true, status: true } });
    if (!invoice) throw new AppError(404, "NOT_FOUND", "Invoice not found.");
    const amount = getInvoiceBalance({ total: Number(invoice.total), amountPaid: Number(invoice.amountPaid) });
    const payment = await recordPayment({ invoiceId: id, method: parsed.data.method, amount, paymentDate: new Date(), note: "Customer portal payment (simulated gateway)" });
    return sendData(res, payment);
  } catch (error) { next(error); }
});
export default router;
