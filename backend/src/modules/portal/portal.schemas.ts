import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
export const portalPaySchema = z.object({ method: z.nativeEnum(PaymentMethod) });
export const portalListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
