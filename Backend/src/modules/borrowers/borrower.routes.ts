import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { toNumber } from "../../utils/money";
import { createBorrowerSchema, updateBorrowerSchema } from "./borrower.schemas";

export const borrowerRouter = Router();
type AmountRow = { amount: unknown };

borrowerRouter.use(requireAdmin);

borrowerRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const borrowers = await prisma.borrower.findMany({
      where: { adminId: req.admin!.id },
      orderBy: { createdAt: "desc" },
      include: {
        loans: { select: { amount: true } },
        payments: { select: { amount: true } }
      }
    });

    return res.json({
      borrowers: borrowers.map((borrower) => {
        const totalGiven = borrower.loans.reduce((sum, loan) => sum + toNumber(loan.amount), 0);
        const totalPaid = borrower.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);

        return {
          id: borrower.id,
          name: borrower.name,
          fatherOrHusband: borrower.fatherOrHusband,
          village: borrower.village,
          mobile: borrower.mobile,
          monthlyPercentage: toNumber(borrower.monthlyPercentage),
          totalGiven,
          totalPaid,
          outstandingPrincipal: totalGiven - totalPaid,
          createdAt: borrower.createdAt
        };
      })
    });
  })
);

borrowerRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createBorrowerSchema.parse(req.body);
    const existing = await prisma.borrower.findFirst({
      where: { adminId: req.admin!.id, mobile: body.mobile }
    });

    if (existing) {
      return res.status(409).json({ message: "Borrower with this mobile already exists" });
    }

    const borrower = await prisma.borrower.create({
      data: { ...body, adminId: req.admin!.id }
    });

    return res.status(201).json({ borrower });
  })
);

borrowerRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const borrower = await prisma.borrower.findFirst({
      where: { id: req.params.id, adminId: req.admin!.id },
      include: {
        loans: { orderBy: { givenDate: "desc" } },
        payments: { orderBy: { paymentDate: "desc" } }
      }
    });

    if (!borrower) {
      return res.status(404).json({ message: "Borrower not found" });
    }

    const totalGiven = borrower.loans.reduce((sum: number, loan: AmountRow) => sum + toNumber(loan.amount), 0);
    const totalPaid = borrower.payments.reduce(
      (sum: number, payment: AmountRow) => sum + toNumber(payment.amount),
      0
    );

    return res.json({
      borrower,
      summary: {
        totalGiven,
        totalPaid,
        outstandingPrincipal: totalGiven - totalPaid
      }
    });
  })
);

borrowerRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const body = updateBorrowerSchema.parse(req.body);
    const existing = await prisma.borrower.findFirst({
      where: { id: req.params.id, adminId: req.admin!.id }
    });

    if (!existing) {
      return res.status(404).json({ message: "Borrower not found" });
    }

    if (body.mobile && body.mobile !== existing.mobile) {
      const duplicate = await prisma.borrower.findFirst({
        where: { adminId: req.admin!.id, mobile: body.mobile }
      });

      if (duplicate) {
        return res.status(409).json({ message: "Borrower with this mobile already exists" });
      }
    }

    const borrower = await prisma.borrower.update({
      where: { id: req.params.id },
      data: body
    });

    return res.json({ borrower });
  })
);
