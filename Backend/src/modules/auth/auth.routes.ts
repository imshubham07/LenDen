import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";
import { requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { createAdminSchema, loginSchema } from "./auth.schemas";

export const authRouter = Router();
const jwtExpiresIn = env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"];

authRouter.post(
  "/admin/setup",
  asyncHandler(async (req, res) => {
    const body = createAdminSchema.parse(req.body);
    const adminCount = await prisma.admin.count();

    if (adminCount > 0) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const admin = await prisma.admin.create({
      data: { name: body.name, mobile: body.mobile, passwordHash },
      select: { id: true, name: true, mobile: true, createdAt: true }
    });

    return res.status(201).json({ admin });
  })
);

authRouter.post(
  "/admin/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const admin = await prisma.admin.findUnique({ where: { mobile: body.mobile } });

    if (!admin || !(await bcrypt.compare(body.password, admin.passwordHash))) {
      return res.status(401).json({ message: "Invalid mobile or password" });
    }

    const sessionId = randomUUID();
    await redis.set(`admin-session:${sessionId}`, admin.id, "EX", 60 * 60 * 24 * 7);

    const token = jwt.sign({ adminId: admin.id, sessionId }, env.JWT_SECRET, {
      expiresIn: jwtExpiresIn
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    return res.json({
      token,
      admin: { id: admin.id, name: admin.name, mobile: admin.mobile }
    });
  })
);

authRouter.post(
  "/admin/logout",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (req.sessionId) {
      await redis.del(`admin-session:${req.sessionId}`);
    }

    res.clearCookie("token");
    return res.json({ message: "Logged out" });
  })
);

authRouter.get("/admin/me", requireAdmin, (req, res) => {
  return res.json({ admin: req.admin });
});
