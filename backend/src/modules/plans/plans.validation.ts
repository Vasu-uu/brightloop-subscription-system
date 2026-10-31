import { z } from "zod";

export const planSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  billingPeriod: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  minQuantity: z.number().int().positive().default(1),
  availableFrom: z.coerce.date(),
  availableTo: z.coerce.date().nullable().optional(),
  autoClose: z.boolean().default(false),
  allowEarlyClose: z.boolean().default(false),
  allowPause: z.boolean().default(false),
  allowRenew: z.boolean().default(false),
});

export const updatePlanSchema = planSchema.partial().extend({
  isActive: z.boolean().optional(),
});
