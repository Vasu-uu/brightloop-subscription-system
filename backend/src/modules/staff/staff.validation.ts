import { z } from "zod";
import { passwordSchema } from "../auth/auth.validation";

export const createStaffSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(1),
  phone: z.string().optional(),
});
