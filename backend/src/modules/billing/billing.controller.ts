import { Request, Response } from "express";
import { sendData } from "../../shared/response";
import { billingStatus, runBillingExclusive } from "../../services/scheduler.service";
import { runBillingSchema } from "./billing.validation";

export async function run(req: Request, res: Response): Promise<void> {
  const { asOfDate } = runBillingSchema.parse(req.body);
  const result = await runBillingExclusive(asOfDate ?? new Date(), "manual");
  sendData(res, result);
}

export async function status(_req: Request, res: Response): Promise<void> {
  sendData(res, billingStatus());
}
