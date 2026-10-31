import { Request, Response } from "express";
import { sendData } from "../../shared/response";
import { runBilling } from "../../services/invoice.service";
import { runBillingSchema } from "./billing.validation";

export async function run(req: Request, res: Response): Promise<void> {
  const { asOfDate } = runBillingSchema.parse(req.body);
  const result = await runBilling(asOfDate ?? new Date());
  sendData(res, result);
}
