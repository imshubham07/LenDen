import { z } from "zod";

export const createBorrowerSchema = z.object({
  name: z.string().min(2),
  fatherOrHusband: z.string().min(2),
  documentNote: z.string().optional(),
  village: z.string().min(2),
  mobile: z.string().min(5),
  monthlyPercentage: z.coerce.number().min(0).max(100)
});

export const updateBorrowerSchema = createBorrowerSchema.partial();
