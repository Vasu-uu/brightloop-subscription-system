import { z } from "zod";

export const lineInputSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().positive().default(1),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  planId: z.number().int().positive(),
  validityDays: z.number().int().positive(),
  lines: z.array(lineInputSchema).min(1, "At least one line is required"),
});

export const updateTemplateSchema = createTemplateSchema.extend({
  isActive: z.boolean().optional(),
});
