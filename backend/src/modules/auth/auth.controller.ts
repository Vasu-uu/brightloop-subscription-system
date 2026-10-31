import { Request, Response } from "express";
import { sendData } from "../../shared/response";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "./auth.validation";
import * as service from "./auth.service";

export async function signup(req: Request, res: Response): Promise<void> {
  const input = signupSchema.parse(req.body);
  const result = await service.signup(input);
  sendData(res, result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);
  const result = await service.login(email, password);
  sendData(res, result);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await service.me(req.user!.userId);
  sendData(res, user);
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = forgotPasswordSchema.parse(req.body);
  await service.forgotPassword(email);
  sendData(res, { message: "If that email is registered, a reset link has been sent." });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = resetPasswordSchema.parse(req.body);
  await service.resetPassword(token, password);
  sendData(res, { message: "Password updated." });
}
