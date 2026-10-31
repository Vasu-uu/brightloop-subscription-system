import { Router } from "express";
import { requireAuth, requireRole } from "../../shared/auth";
import { asyncHandler } from "../../shared/errorHandler";
import { sendData } from "../../shared/response";
import { parsePagination } from "../../shared/pagination";
import { AppError } from "../../shared/AppError";
import { prisma } from "../../shared/prisma";
import { discountSchema, updateDiscountSchema } from "./discounts.validation";

export const discountsRouter = Router();
discountsRouter.use(requireAuth, requireRole("ADMIN", "STAFF"));

const detailInclude = { products: true, subscriptions: true } as const;

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "VALIDATION_ERROR", "Invalid id");
  return id;
}

discountsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const where = search ? { name: { contains: search } } : {};
    const [rows, total] = await Promise.all([
      prisma.discount.findMany({
        where,
        include: detailInclude,
        orderBy: { [pagination.sort]: pagination.order },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.discount.count({ where }),
    ]);
    sendData(res, rows, { page: pagination.page, pageSize: pagination.pageSize, total, totalPages: Math.ceil(total / pagination.pageSize) });
  })
);

discountsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const discount = await prisma.discount.findUnique({ where: { id: parseId(req.params.id) }, include: detailInclude });
    if (!discount) throw new AppError(404, "NOT_FOUND", "Discount not found");
    sendData(res, discount);
  })
);

discountsRouter.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const input = discountSchema.parse(req.body);
    const { productIds, subscriptionIds, ...rest } = input;
    const discount = await prisma.discount.create({
      data: {
        ...rest,
        products: productIds ? { connect: productIds.map((id) => ({ id })) } : undefined,
        subscriptions: subscriptionIds ? { connect: subscriptionIds.map((id) => ({ id })) } : undefined,
      },
      include: detailInclude,
    });
    sendData(res, discount);
  })
);

discountsRouter.put(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "NOT_FOUND", "Discount not found");
    const input = updateDiscountSchema.parse(req.body);
    const { productIds, subscriptionIds, ...rest } = input;
    const discount = await prisma.discount.update({
      where: { id },
      data: {
        ...rest,
        products: productIds ? { set: productIds.map((pid) => ({ id: pid })) } : undefined,
        subscriptions: subscriptionIds ? { set: subscriptionIds.map((sid) => ({ id: sid })) } : undefined,
      },
      include: detailInclude,
    });
    sendData(res, discount);
  })
);

discountsRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "NOT_FOUND", "Discount not found");
    await prisma.discount.delete({ where: { id } });
    sendData(res, { id });
  })
);
