import { Response } from "express";

export function sendData(res: Response, data: unknown, meta?: Record<string, unknown>) {
  res.json(meta ? { data, meta } : { data });
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
