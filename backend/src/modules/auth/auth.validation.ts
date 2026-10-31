import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(9, "Password must be more than 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

export const signupSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(1),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});
