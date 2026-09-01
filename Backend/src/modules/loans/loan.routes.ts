import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { createLoanSchema } from "./loan.schemas";

export const loanRouter = Router();

loanRouter.use(requireAdmin);

loanRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createLoanSchema.parse(req.body);
    const borrower = await prisma.borrower.findFirst({
      where: { id: body.borrowerId, adminId: req.admin!.id }
    });

    if (!borrower) {
      return res.status(404).json({ message: "Borrower not found" });
    }

    const loan = await prisma.loan.create({
      data: { ...body, adminId: req.admin!.id }
    });

    return res.status(201).json({ loan });
  })
);
