import { Router } from "express";
import { requireAuth, requireRole } from "../../shared/auth";
import { asyncHandler } from "../../shared/errorHandler";
import { sendData } from "../../shared/response";
import { parsePagination } from "../../shared/pagination";
import { AppError } from "../../shared/AppError";
import { prisma } from "../../shared/prisma";
import { planSchema, updatePlanSchema } from "./plans.validation";

export const plansRouter = Router();
plansRouter.use(requireAuth, requireRole("ADMIN", "STAFF"));

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "VALIDATION_ERROR", "Invalid id");
  return id;
}

plansRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const where = search ? { name: { contains: search } } : {};
    const [rows, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        orderBy: { [pagination.sort]: pagination.order },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.plan.count({ where }),
    ]);
    sendData(res, rows, { page: pagination.page, pageSize: pagination.pageSize, total, totalPages: Math.ceil(total / pagination.pageSize) });
  })
);

plansRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const plan = await prisma.plan.findUnique({ where: { id: parseId(req.params.id) } });
    if (!plan) throw new AppError(404, "NOT_FOUND", "Plan not found");
    sendData(res, plan);
  })
);

plansRouter.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const input = planSchema.parse(req.body);
    sendData(res, await prisma.plan.create({ data: input }));
  })
);

plansRouter.put(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const input = updatePlanSchema.parse(req.body);
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "NOT_FOUND", "Plan not found");
    sendData(res, await prisma.plan.update({ where: { id }, data: input }));
  })
);

plansRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "NOT_FOUND", "Plan not found");
    const inUse = await prisma.subscription.findFirst({ where: { planId: id } });
    if (inUse) throw new AppError(409, "CONFLICT", "Plan is in use by existing subscriptions");
    await prisma.plan.delete({ where: { id } });
    sendData(res, { id });
  })
);
