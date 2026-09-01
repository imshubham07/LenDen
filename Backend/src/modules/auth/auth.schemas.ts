import { z } from "zod";

export const loginSchema = z.object({
  mobile: z.string().min(5),
  password: z.string().min(6)
});

export const createAdminSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(5),
  password: z.string().min(6)
});
