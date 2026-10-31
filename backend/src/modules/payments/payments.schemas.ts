import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const createPaymentSchema = z.object({
  invoiceId: z.coerce.number().int().positive(),
  method: z.nativeEnum(PaymentMethod),
  amount: z.coerce.number().positive().finite(),
  paymentDate: z.coerce.date(),
  note: z.string().max(1000).optional(),
});
export const paymentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  customerId: z.coerce.number().int().positive().optional(),
  sort: z.enum(["createdAt", "paymentDate", "amount"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
