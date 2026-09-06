import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(12),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:3000")
}).refine(
  (value) => !value.UPSTASH_REDIS_REST_URL || Boolean(value.UPSTASH_REDIS_REST_TOKEN),
  { message: "UPSTASH_REDIS_REST_TOKEN is required when UPSTASH_REDIS_REST_URL is set" }
);

export const env = envSchema.parse(process.env);
export const corsOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
