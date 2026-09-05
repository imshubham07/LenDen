import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { createLoanSchema, updateLoanStatusSchema } from "./loan.schemas";

export const loanRouter = Router();
const STATUS_CHANGE_WINDOW_MS = 15 * 60 * 1000;

loanRouter.use(requireUser);

loanRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createLoanSchema.parse(req.body);
    const borrower = await prisma.borrower.findFirst({
      where: { id: body.borrowerId, userId: req.user!.id }
    });

    if (!borrower) {
      return res.status(404).json({ message: "Borrower not found" });
    }

    const loan = await prisma.loan.create({
      data: { ...body, userId: req.user!.id }
    });

    return res.status(201).json({ loan });
  })
);

loanRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const body = updateLoanStatusSchema.parse(req.body);
    const loan = await prisma.loan.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const canReopen =
      loan.status === "CLOSED" && Date.now() - loan.updatedAt.getTime() <= STATUS_CHANGE_WINDOW_MS;

    if (loan.status === "CLOSED" && body.status === "ACTIVE" && !canReopen) {
      return res.status(403).json({ message: "Paid loan status is locked after 15 minutes" });
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loan.id },
      data: { status: body.status }
    });

    return res.json({ loan: updatedLoan });
  })
);
