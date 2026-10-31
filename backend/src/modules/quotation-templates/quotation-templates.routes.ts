import { Router } from "express";
import { requireAuth, requireRole } from "../../shared/auth";
import { asyncHandler } from "../../shared/errorHandler";
import * as controller from "./quotation-templates.controller";

export const quotationTemplatesRouter = Router();

quotationTemplatesRouter.use(requireAuth, requireRole("ADMIN", "STAFF"));

quotationTemplatesRouter.get("/", asyncHandler(controller.list));
quotationTemplatesRouter.post("/", asyncHandler(controller.create));
quotationTemplatesRouter.get("/:id", asyncHandler(controller.getOne));
quotationTemplatesRouter.put("/:id", asyncHandler(controller.update));
quotationTemplatesRouter.delete("/:id", asyncHandler(controller.remove));
