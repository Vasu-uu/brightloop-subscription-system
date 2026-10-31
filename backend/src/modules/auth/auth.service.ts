import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import { AppError } from "../../shared/AppError";
import { sendMail } from "../../services/mail.service";

function signToken(userId: number, role: User["role"]) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
}

function sanitize(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function signup(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  company?: string;
  address?: string;
}) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "CONFLICT", "Email is already registered", { email: "Email is already registered" });
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name,
      phone: input.phone,
      company: input.company,
      address: input.address,
      role: "CUSTOMER",
    },
  });
  return { token: signToken(user.id, user.role), user: sanitize(user) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid email or password");
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid email or password");
  }
  return { token: signToken(user.id, user.role), user: sanitize(user) };
}

export async function me(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  return sanitize(user);
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Always respond with the same success message regardless of whether the
  // account exists, so this function never reveals which emails are registered.
  if (!user) return;
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
  const link = `${process.env.APP_URL}/reset-password?token=${rawToken}`;
  // A failed send must not change the response (it would reveal the account exists).
  await sendMail({
    to: user.email,
    subject: "Reset your Brightloop password",
    text: `Hi ${user.name},

Use this link to choose a new password. It expires in 1 hour and works once:
${link}

If you did not ask for this, you can ignore this email.`,
  }).catch((err) => console.error("[email] reset mail failed:", err.message));
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { id: "desc" },
  });
  if (!record) {
    throw new AppError(400, "VALIDATION_ERROR", "Reset link is invalid or has expired");
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
}
