import { z } from "zod";

export const createLoanSchema = z.object({
  borrowerId: z.string().min(1),
  amount: z.coerce.number().positive(),
  purpose: z.string().min(2),
  givenDate: z.coerce.date(),
  guarantor: z.string().optional()
});
