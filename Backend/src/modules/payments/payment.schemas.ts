import { z } from "zod";

export const createPaymentSchema = z.object({
  borrowerId: z.string().min(1),
  amount: z.coerce.number().positive(),
  paymentDate: z.coerce.date(),
  note: z.string().optional()
});
