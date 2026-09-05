import { createHmac } from "crypto";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { redis } from "../lib/redis";
import { prisma } from "../lib/prisma";

type JwtPayload = {
  userId: string;
  sessionId: string;
  credentialVersion: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        mobile: string;
      };
      sessionId?: string;
    }
  }
}

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token ?? req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (!payload || typeof payload.userId !== "string" || typeof payload.sessionId !== "string") {
      return res.status(401).json({ message: "Invalid token" });
    }
    const sessionKey = `user-session:${payload.sessionId}`;
    const storedUserId = await redis.get(sessionKey);

    if (storedUserId !== payload.userId) {
      return res.status(401).json({ message: "Session expired" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, mobile: true, passwordHash: true }
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const version = createHmac("sha256", env.JWT_SECRET).update(user.passwordHash).digest("hex");
    if (payload.credentialVersion !== version) {
      return res.status(401).json({ message: "Password changed. Please log in again." });
    }
    req.user = { id: user.id, name: user.name, mobile: user.mobile };
    req.sessionId = payload.sessionId;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
