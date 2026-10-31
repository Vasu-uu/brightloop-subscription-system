import { z } from "zod";

export const variantSchema = z.object({
  attribute: z.string().min(1),
  value: z.string().min(1),
  extraPrice: z.number().default(0),
});

export const productSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["SERVICE", "GOODS"]),
  salesPrice: z.number().nonnegative(),
  costPrice: z.number().nonnegative(),
  notes: z.string().optional(),
  taxId: z.number().int().positive().nullable().optional(),
  variants: z.array(variantSchema).optional(),
});

export const updateProductSchema = productSchema.partial().extend({
  isActive: z.boolean().optional(),
});
