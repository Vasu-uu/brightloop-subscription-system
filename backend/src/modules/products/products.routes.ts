import { Router } from "express";
import { requireAuth, requireRole } from "../../shared/auth";
import { asyncHandler } from "../../shared/errorHandler";
import * as controller from "./products.controller";

export const productsRouter = Router();
productsRouter.use(requireAuth, requireRole("ADMIN", "STAFF"));

productsRouter.get("/", asyncHandler(controller.list));
productsRouter.get("/:id", asyncHandler(controller.getOne));
productsRouter.post("/", requireRole("ADMIN"), asyncHandler(controller.create));
productsRouter.put("/:id", requireRole("ADMIN"), asyncHandler(controller.update));
productsRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(controller.remove));
productsRouter.post("/:id/variants", requireRole("ADMIN"), asyncHandler(controller.addVariant));
productsRouter.put("/:id/variants/:vid", requireRole("ADMIN"), asyncHandler(controller.updateVariant));
productsRouter.delete("/:id/variants/:vid", requireRole("ADMIN"), asyncHandler(controller.removeVariant));
