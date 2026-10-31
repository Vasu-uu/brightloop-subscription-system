import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../shared/auth";
import { asyncHandler } from "../../shared/errorHandler";
import { sendData } from "../../shared/response";
import { parsePagination } from "../../shared/pagination";
import { AppError } from "../../shared/AppError";
import { prisma } from "../../shared/prisma";

const taxSchema = z.object({
  name: z.string().min(1),
  ratePercent: z.number().min(0).max(100),
});
const updateTaxSchema = taxSchema.partial().extend({ isActive: z.boolean().optional() });

export const taxesRouter = Router();
taxesRouter.use(requireAuth, requireRole("ADMIN", "STAFF"));

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "VALIDATION_ERROR", "Invalid id");
  return id;
}

taxesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const where = search ? { name: { contains: search } } : {};
    // The Tax model has no createdAt field (see contract 1.3), unlike every
    // other model, so the generic pagination default needs overriding here.
    const sort = pagination.sort === "createdAt" ? "id" : pagination.sort;
    const [rows, total] = await Promise.all([
      prisma.tax.findMany({ where, orderBy: { [sort]: pagination.order }, skip: pagination.skip, take: pagination.take }),
      prisma.tax.count({ where }),
    ]);
    sendData(res, rows, { page: pagination.page, pageSize: pagination.pageSize, total, totalPages: Math.ceil(total / pagination.pageSize) });
  })
);

taxesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const tax = await prisma.tax.findUnique({ where: { id: parseId(req.params.id) } });
    if (!tax) throw new AppError(404, "NOT_FOUND", "Tax not found");
    sendData(res, tax);
  })
);

taxesRouter.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    sendData(res, await prisma.tax.create({ data: taxSchema.parse(req.body) }));
  })
);

taxesRouter.put(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const existing = await prisma.tax.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "NOT_FOUND", "Tax not found");
    sendData(res, await prisma.tax.update({ where: { id }, data: updateTaxSchema.parse(req.body) }));
  })
);

taxesRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const existing = await prisma.tax.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "NOT_FOUND", "Tax not found");
    const inUse = await prisma.product.findFirst({ where: { taxId: id } });
    if (inUse) throw new AppError(409, "CONFLICT", "Tax is in use by existing products");
    await prisma.tax.delete({ where: { id } });
    sendData(res, { id });
  })
);
