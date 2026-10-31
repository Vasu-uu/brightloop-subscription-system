import cron from "node-cron";
import { AppError } from "../shared/AppError";
import { runBilling } from "./invoice.service";

export type BillingRunRecord = {
  at: string;
  trigger: "scheduled" | "manual";
  created: number;
  skipped: number;
  error?: string;
};

const DEFAULT_SCHEDULE = "0 2 * * *";
let schedule: string | null = null;
let running = false;
let lastRun: BillingRunRecord | null = null;

export function billingStatus() {
  return { enabled: schedule !== null, schedule, running, lastRun };
}

// One billing run at a time: a slow scheduled run must not overlap a manual one
// (or the next tick), or the two would race for the same invoice numbers.
export async function runBillingExclusive(asOf: Date, trigger: "scheduled" | "manual") {
  if (running) throw new AppError(409, "CONFLICT", "A billing run is already in progress. Try again in a moment.");
  running = true;
  try {
    const result = await runBilling(asOf);
    lastRun = { at: new Date().toISOString(), trigger, created: result.created, skipped: result.skipped };
    return result;
  } catch (err) {
    lastRun = { at: new Date().toISOString(), trigger, created: 0, skipped: 0, error: (err as Error).message };
    throw err;
  } finally {
    running = false;
  }
}

export function startBillingScheduler() {
  const expression = process.env.BILLING_SCHEDULE ?? DEFAULT_SCHEDULE;
  if (expression.toLowerCase() === "off") {
    console.log("[billing] automatic billing is disabled (BILLING_SCHEDULE=off)");
    return;
  }
  if (!cron.validate(expression)) {
    console.error(`[billing] invalid BILLING_SCHEDULE "${expression}", automatic billing not started`);
    return;
  }
  schedule = expression;
  cron.schedule(expression, () => {
    runBillingExclusive(new Date(), "scheduled")
      .then((r) => console.log(`[billing] scheduled run finished: ${r.created} created, ${r.skipped} skipped`))
      .catch((err) => console.error("[billing] scheduled run failed:", err.message));
  });
  console.log(`[billing] automatic billing scheduled (cron "${expression}", server time)`);
}
