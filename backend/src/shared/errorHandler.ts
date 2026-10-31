import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "./AppError";
import { sendError } from "./response";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.httpStatus, err.code, err.message, err.fields);
  }
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      fields[issue.path.join(".") || "root"] = issue.message;
    }
    return sendError(res, 400, "VALIDATION_ERROR", "Validation failed", fields);
  }
  console.error(err);
  return sendError(res, 500, "INTERNAL_ERROR", "Something went wrong");
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
