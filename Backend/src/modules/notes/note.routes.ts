import { Router } from "express";
import { cacheKeys, clearCacheKeys, getCachedJson, setCachedJson } from "../../lib/cache";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { createNoteSchema } from "./note.schemas";

export const noteRouter = Router();

noteRouter.use(requireUser);

noteRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const cacheKey = cacheKeys.notes(req.user!.id);
    const cached = await getCachedJson(cacheKey);
    if (cached) return res.json(cached);

    const notes = await prisma.note.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" }
    });

    const payload = { notes };
    await setCachedJson(cacheKey, payload);
    return res.json(payload);
  })
);

noteRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createNoteSchema.parse(req.body);
    const note = await prisma.note.create({
      data: { userId: req.user!.id, text: body.text }
    });

    await clearCacheKeys(cacheKeys.notes(req.user!.id));
    return res.status(201).json({ note });
  })
);
