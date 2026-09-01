import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { createPaymentSchema } from "./payment.schemas";

export const paymentRouter = Router();

paymentRouter.use(requireAdmin);

paymentRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createPaymentSchema.parse(req.body);
    const borrower = await prisma.borrower.findFirst({
      where: { id: body.borrowerId, adminId: req.admin!.id }
    });

    if (!borrower) {
      return res.status(404).json({ message: "Borrower not found" });
    }

    const payment = await prisma.payment.create({
      data: { ...body, adminId: req.admin!.id }
    });

    return res.status(201).json({ payment });
  })
);
