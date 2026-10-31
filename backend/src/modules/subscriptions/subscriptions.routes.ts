import { Router } from "express";
import { requireAuth, requireRole } from "../../shared/auth";
import { asyncHandler } from "../../shared/errorHandler";
import * as controller from "./subscriptions.controller";

export const subscriptionsRouter = Router();

subscriptionsRouter.use(requireAuth, requireRole("ADMIN", "STAFF"));

subscriptionsRouter.post("/from-template", asyncHandler(controller.createFromTemplate));
subscriptionsRouter.get("/", asyncHandler(controller.list));
subscriptionsRouter.post("/", asyncHandler(controller.create));
subscriptionsRouter.get("/:id", asyncHandler(controller.getOne));
subscriptionsRouter.put("/:id", asyncHandler(controller.update));
subscriptionsRouter.post("/:id/transition", asyncHandler(controller.transition));
subscriptionsRouter.post("/:id/pause", asyncHandler(controller.pause));
subscriptionsRouter.post("/:id/resume", asyncHandler(controller.resume));
subscriptionsRouter.post("/:id/renew", asyncHandler(controller.renew));
