import { Response } from "express";
import { Prisma } from "@prisma/client";

// Prisma returns Decimal fields as Decimal instances, which JSON.stringify
// would otherwise turn into strings. The contract requires money/percentage
// fields to be JSON numbers rounded to 2 decimals, so every response is
// walked and Decimals are converted before serialization.
function toPlain(value: unknown): unknown {
  if (value instanceof Prisma.Decimal) {
    return Math.round(value.toNumber() * 100) / 100;
  }
  if (Array.isArray(value)) {
    return value.map(toPlain);
  }
  if (value instanceof Date) {
    return value;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = toPlain(val);
    }
    return out;
  }
  return value;
}

export function sendData(res: Response, data: unknown, meta?: Record<string, unknown>) {
  res.json(meta ? { data: toPlain(data), meta } : { data: toPlain(data) });
}

export function sendError(
  res: Response,
  httpStatus: number,
  code: string,
  message: string,
  fields?: Record<string, string>
) {
  res.status(httpStatus).json({ error: fields ? { code, message, fields } : { code, message } });
}
