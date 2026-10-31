import { Router } from "express";
import { requireAuth, requireRole } from "../../shared/auth";
import { asyncHandler } from "../../shared/errorHandler";
import * as controller from "./invoices.controller";

export const invoicesRouter = Router();

invoicesRouter.use(requireAuth, requireRole("ADMIN", "STAFF"));

invoicesRouter.get("/", asyncHandler(controller.list));
invoicesRouter.get("/:id", asyncHandler(controller.getOne));
invoicesRouter.post("/:id/confirm", asyncHandler(controller.confirm));
invoicesRouter.post("/:id/cancel", asyncHandler(controller.cancel));
invoicesRouter.post("/:id/send", asyncHandler(controller.send));
invoicesRouter.get("/:id/pdf", asyncHandler(controller.pdf));
