import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { redis } from "../lib/redis";
import { prisma } from "../lib/prisma";

type JwtPayload = {
  adminId: string;
  sessionId: string;
};

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        name: string;
        mobile: string;
      };
      sessionId?: string;
    }
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token ?? req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const sessionKey = `admin-session:${payload.sessionId}`;
    const storedAdminId = await redis.get(sessionKey);

    if (storedAdminId !== payload.adminId) {
      return res.status(401).json({ message: "Session expired" });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { id: true, name: true, mobile: true }
    });

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = admin;
    req.sessionId = payload.sessionId;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
