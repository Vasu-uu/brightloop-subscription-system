import { z } from "zod";

export const runBillingSchema = z.object({
  asOfDate: z.coerce.date().optional(),
});
