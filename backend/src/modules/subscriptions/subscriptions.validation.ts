import { z } from "zod";

const isoDate = z.coerce.date();

export const lineInputSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().positive(),
});

export const createSubscriptionSchema = z
  .object({
  customerId: z.number().int().positive(),
  planId: z.number().int().positive(),
  startDate: isoDate,
  expiryDate: isoDate,
  paymentTermDays: z.number().int().min(0).default(0),
  lines: z.array(lineInputSchema).min(1, "At least one line is required"),
  })
  .refine((d) => d.expiryDate > d.startDate, {
    message: "Expiry date must be after the start date",
    path: ["expiryDate"],
  });

export const updateSubscriptionSchema = createSubscriptionSchema;

export const fromTemplateSchema = z.object({
  templateId: z.number().int().positive(),
  customerId: z.number().int().positive(),
  startDate: isoDate,
});

export const transitionSchema = z.object({
  to: z.enum(["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"]),
});
