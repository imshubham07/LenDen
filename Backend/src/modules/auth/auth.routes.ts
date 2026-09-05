import bcrypt from "bcryptjs";
import { randomUUID, randomBytes, createHash, createHmac } from "crypto";
import { Router, type Response } from "express";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";
import { requireUser } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { signupSchema, loginSchema, recoveryCodeSchema, resetPasswordSchema } from "./auth.schemas";

export const authRouter = Router();
const publicUser = { id: true, name: true, mobile: true } as const;

async function createSession(res: Response, user: { id: string; name: string; mobile: string }, status = 200) {
  const credentials = await prisma.user.findUnique({ where: { id: user.id } });
  if (!credentials) throw new Error("Account not found");
  const credentialVersion = createHmac("sha256", env.JWT_SECRET).update(credentials.passwordHash).digest("hex");
  const sessionId = randomUUID();
  const token = jwt.sign({ userId: user.id, sessionId, credentialVersion }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
  await redis.set(`user-session:${sessionId}`, user.id, "EX", 60 * 60 * 24 * 7);
  res.cookie("token", token, {
    httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
  return res.status(status).json({ token, user });
}

authRouter.post("/signup", asyncHandler(async (req, res) => {
  const body = signupSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(body.password, 12);
  let user;
  try {
    user = await prisma.user.create({
      data: { name: body.name, mobile: body.mobile, passwordHash }, select: publicUser
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ message: "An account with this mobile number already exists. Please log in." });
    }
    throw error;
  }
  return createSession(res, user, 201);
}));

authRouter.post("/login", asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { mobile: body.mobile } });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid mobile or password" });
  }
  return createSession(res, { id: user.id, name: user.name, mobile: user.mobile });
}));

authRouter.post("/logout", requireUser, asyncHandler(async (req, res) => {
  await redis.del(`user-session:${req.sessionId}`);
  res.clearCookie("token");
  return res.json({ message: "Logged out" });
}));

authRouter.get("/me", requireUser, (req, res) => res.json({ user: req.user }));

// High-entropy recovery codes are stored only as hashes and consumed atomically.
authRouter.post("/recovery-code", requireUser, asyncHandler(async (req, res) => {
  const body = recoveryCodeSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return res.status(401).json({ message: "Incorrect password" });
  }
  const code = randomBytes(16).toString("hex").toUpperCase();
  const saved = await prisma.user.updateMany({ where: { id: user.id, passwordHash: user.passwordHash }, data: {
    recoveryCodeHash: createHash("sha256").update(code).digest("hex")
  } });
  if (saved.count !== 1) return res.status(401).json({ message: "Password changed. Please log in again." });
  res.setHeader("Cache-Control", "no-store");
  return res.json({ recoveryCode: code.match(/.{4}/g)!.join("-") });
}));

authRouter.post("/reset-password", asyncHandler(async (req, res) => {
  const body = resetPasswordSchema.parse(req.body);
  const key = `password-reset-limit:${createHash("sha256").update(body.mobile).digest("hex")}:${Math.floor(Date.now() / 900000)}`;
  const attempts = await redis.incr(key);
  if (attempts === 1) await redis.expire(key, 1800);
  if (attempts > 5) return res.status(429).json({ message: "Too many attempts. Please try again in 15 minutes." });
  const recoveryCodeHash = createHash("sha256").update(body.recoveryCode).digest("hex");
  const user = await prisma.user.findUnique({ where: { mobile: body.mobile } });
  if (!user || user.recoveryCodeHash !== recoveryCodeHash) {
    return res.status(400).json({ message: "Invalid mobile number or recovery code" });
  }
  const passwordHash = await bcrypt.hash(body.newPassword, 12);
  const result = await prisma.user.updateMany({
    where: { id: user.id, recoveryCodeHash, passwordHash: user.passwordHash },
    data: { passwordHash, recoveryCodeHash: null }
  });
  if (result.count !== 1) return res.status(400).json({ message: "Recovery code was already used. Please log in or contact support." });
  res.clearCookie("token");
  return res.json({ message: "Password reset. Log in with your new password and generate a new recovery code." });
}));
