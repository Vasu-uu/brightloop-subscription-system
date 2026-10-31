import { Router } from "express";
import { requireAuth } from "../../shared/auth";
import { asyncHandler } from "../../shared/errorHandler";
import * as controller from "./auth.controller";

export const authRouter = Router();

authRouter.post("/signup", asyncHandler(controller.signup));
authRouter.post("/login", asyncHandler(controller.login));
authRouter.post("/forgot-password", asyncHandler(controller.forgotPassword));
authRouter.post("/reset-password", asyncHandler(controller.resetPassword));
authRouter.get("/me", requireAuth, asyncHandler(controller.me));
