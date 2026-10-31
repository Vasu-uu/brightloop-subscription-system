import { z } from "zod";
export const dashboardInvoicesQuerySchema = z.object({
  payment: z.enum(["paid", "outstanding", "overdue"]),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().max(200).optional(),
});
