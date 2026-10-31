import { Router } from "express";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireRole } from "../../shared/auth";
import { sendData, sendError } from "../../shared";
import { dashboardInvoicesQuerySchema } from "./dashboard.schemas";

const router = Router();
router.use(requireAuth, requireRole(Role.ADMIN, Role.STAFF));

router.get("/summary", async (_req, res, next) => {
  try {
    const today = new Date();
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const [active, revenue, overdueStats, revenueThisMonth] = await Promise.all([
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.$queryRaw<Array<{ overdueCount: bigint; overdueAmount: Prisma.Decimal }>>`
        SELECT CAST(COUNT(*) AS UNSIGNED) AS overdueCount,
               COALESCE(SUM(total - amountPaid), 0) AS overdueAmount
        FROM Invoice
        WHERE status = 'CONFIRMED' AND amountPaid < total AND dueDate < ${today}
      `,
      prisma.payment.aggregate({ where: { paymentDate: { gte: monthStart, lte: today } }, _sum: { amount: true } }),
    ]);
    const owed = await prisma.$queryRaw<Array<{ totalOutstanding: Prisma.Decimal | null }>>`
      SELECT COALESCE(SUM(total - amountPaid), 0) AS totalOutstanding
      FROM Invoice
      WHERE status = 'CONFIRMED' AND amountPaid < total
    `;
    const overdueAmount = Number(overdueStats[0]?.overdueAmount ?? 0);
    const overdueCount = Number(overdueStats[0]?.overdueCount ?? 0);
    return sendData(res, {
      activeSubscriptions: active,
      totalRevenue: Number(revenue._sum.amount ?? 0),
      totalOutstanding: Number(owed[0]?.totalOutstanding ?? 0),
      overdueCount,
      overdueAmount: Number(overdueAmount.toFixed(2)),
      revenueThisMonth: Number(revenueThisMonth._sum.amount ?? 0),
    });
  } catch (error) { next(error); }
});

router.get("/revenue-by-month", async (req, res, next) => {
  try {
    const months = Math.min(24, Math.max(1, Number(req.query.months ?? 12)));
    const rows = await prisma.$queryRaw<Array<{ month: string; revenue: Prisma.Decimal }>>`
      SELECT DATE_FORMAT(paymentDate, '%Y-%m') AS month,
             COALESCE(SUM(amount), 0) AS revenue
      FROM Payment
      WHERE paymentDate >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ${months - 1} MONTH)
      GROUP BY DATE_FORMAT(paymentDate, '%Y-%m')
      ORDER BY DATE_FORMAT(paymentDate, '%Y-%m') ASC
    `;
    return sendData(res, rows.map(row => ({ month: row.month, revenue: Number(row.revenue) })));
  } catch (error) { next(error); }
});

router.get("/invoices", async (req, res, next) => {
  try {
    const parsed = dashboardInvoicesQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid invoice filters.");
    const { payment, page, pageSize, from, to, search } = parsed.data;
    const today = new Date();
    const dateFilter = from || to ? { issueDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {};
    const where: Prisma.InvoiceWhereInput = {
      ...dateFilter,
      ...(payment === "paid" ? { status: "PAID" } : payment === "outstanding" ? { status: "CONFIRMED" } : { status: "CONFIRMED", dueDate: { lt: today } }),
      ...(search ? { OR: [{ number: { contains: search } }, { customer: { name: { contains: search } } }] } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.invoice.findMany({ where, include: { customer: true, subscription: { include: { plan: true } } }, orderBy: { dueDate: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.invoice.count({ where }),
    ]);
    return sendData(res, data, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) { next(error); }
});
export default router;
