import { z } from "zod";

export const discountSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(["FIXED", "PERCENTAGE"]),
    value: z.number().positive(),
    appliesTo: z.enum(["PRODUCT", "SUBSCRIPTION"]),
    minPurchase: z.number().nonnegative().nullable().optional(),
    minQuantity: z.number().int().positive().nullable().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    productIds: z.array(z.number().int().positive()).optional(),
    subscriptionIds: z.array(z.number().int().positive()).optional(),
  })
  .refine((d) => d.type !== "PERCENTAGE" || d.value <= 100, {
    message: "Percentage discounts cannot exceed 100",
    path: ["value"],
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: "endDate cannot be before startDate",
    path: ["endDate"],
  });

export const updateDiscountSchema = z
  .object({
    name: z.string().min(1).optional(),
    type: z.enum(["FIXED", "PERCENTAGE"]).optional(),
    value: z.number().positive().optional(),
    appliesTo: z.enum(["PRODUCT", "SUBSCRIPTION"]).optional(),
    minPurchase: z.number().nonnegative().nullable().optional(),
    minQuantity: z.number().int().positive().nullable().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional(),
    productIds: z.array(z.number().int().positive()).optional(),
    subscriptionIds: z.array(z.number().int().positive()).optional(),
  })
  .refine((d) => d.type !== "PERCENTAGE" || d.value == null || d.value <= 100, {
    message: "Percentage discounts cannot exceed 100",
    path: ["value"],
  });
