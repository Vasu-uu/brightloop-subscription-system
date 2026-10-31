import { Router } from "express";
import { requireAuth, requireRole } from "../../shared/auth";
import { asyncHandler } from "../../shared/errorHandler";
import * as controller from "./billing.controller";

export const billingRouter = Router();

billingRouter.use(requireAuth, requireRole("ADMIN", "STAFF"));

billingRouter.post("/run", asyncHandler(controller.run));
