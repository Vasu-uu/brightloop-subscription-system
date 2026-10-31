import { Router } from "express";
import { requireAuth, requireRole } from "../../shared/auth";
import { asyncHandler } from "../../shared/errorHandler";
import { sendData } from "../../shared/response";
import { parsePagination } from "../../shared/pagination";
import { prisma } from "../../shared/prisma";

export const customersRouter = Router();
customersRouter.use(requireAuth, requireRole("ADMIN", "STAFF"));

customersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const where = { role: "CUSTOMER" as const, ...(search ? { name: { contains: search } } : {}) };
    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [pagination.sort]: pagination.order },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.user.count({ where }),
    ]);
    sendData(
      res,
      rows.map(({ passwordHash: _passwordHash, ...rest }) => rest),
      { page: pagination.page, pageSize: pagination.pageSize, total, totalPages: Math.ceil(total / pagination.pageSize) }
    );
  })
);
