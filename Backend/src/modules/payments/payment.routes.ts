import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { createPaymentSchema } from "./payment.schemas";

export const paymentRouter = Router();

paymentRouter.use(requireUser);

paymentRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createPaymentSchema.parse(req.body);
    const borrower = await prisma.borrower.findFirst({
      where: { id: body.borrowerId, userId: req.user!.id }
    });

    if (!borrower) {
      return res.status(404).json({ message: "Borrower not found" });
    }

    const payment = await prisma.payment.create({
      data: { ...body, userId: req.user!.id }
    });

    return res.status(201).json({ payment });
  })
);
