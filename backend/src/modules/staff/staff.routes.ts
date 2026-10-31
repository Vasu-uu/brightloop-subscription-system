import { Router } from "express";
import bcrypt from "bcrypt";
import { requireAuth, requireRole } from "../../shared/auth";
import { asyncHandler } from "../../shared/errorHandler";
import { sendData } from "../../shared/response";
import { parsePagination } from "../../shared/pagination";
import { AppError } from "../../shared/AppError";
import { prisma } from "../../shared/prisma";
import { createStaffSchema } from "./staff.validation";

export const staffRouter = Router();
staffRouter.use(requireAuth, requireRole("ADMIN"));

staffRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const where = { role: "STAFF" as const, ...(search ? { name: { contains: search } } : {}) };
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

staffRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createStaffSchema.parse(req.body);
    const email = input.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, "CONFLICT", "Email is already registered", { email: "Email is already registered" });
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: input.name, phone: input.phone, role: "STAFF" },
    });
    const { passwordHash: _passwordHash, ...rest } = user;
    sendData(res, rest);
  })
);
