import { z } from "zod";

const mobile = z.string().trim().regex(/^\+?[0-9]{5,15}$/, "Enter a valid mobile number");
const password = z.string().min(6, "Password must have at least 6 characters")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password is too long");

export const loginSchema = z.object({ mobile, password });
export const signupSchema = loginSchema.extend({ name: z.string().trim().min(2).max(100) });

export const recoveryCodeSchema = z.object({ password });
export const resetPasswordSchema = z.object({
  mobile,
  recoveryCode: z.string().trim().transform((value) => value.replace(/-/g, "").toUpperCase())
    .pipe(z.string().regex(/^[A-F0-9]{32}$/, "Enter your 32-character recovery code")),
  newPassword: password
});
