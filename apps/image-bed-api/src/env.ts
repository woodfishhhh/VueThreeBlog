import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  PUBLIC_BASE_URL: z.string().url(),
  IMAGE_ROOT: z.string().min(1),
  SQLITE_PATH: z.string().min(1),
  MAX_UPLOAD_MB: z.coerce.number().positive().max(100).default(10),
  TOKEN_SECRET: z.string().min(16),
  WEBP_QUALITY: z.coerce.number().int().min(1).max(100).default(82),
  SHARP_CONCURRENCY: z.coerce.number().int().min(1).max(64).default(2),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).max(10 * 60_000).default(60_000),
  RATE_LIMIT_UPLOAD_MAX: z.coerce.number().int().min(1).max(10_000).default(120),
  RATE_LIMIT_REGISTER_MAX: z.coerce.number().int().min(1).max(10_000).default(60),
});

export interface AppEnv {
  nodeEnv: "development" | "test" | "production";
  port: number;
  publicBaseUrl: string;
  imageRoot: string;
  sqlitePath: string;
  maxUploadBytes: number;
  tokenSecret: string;
  webpQuality: number;
  sharpConcurrency: number;
  rateLimitWindowMs: number;
  rateLimitUploadMax: number;
  rateLimitRegisterMax: number;
}

export function loadEnv(rawEnv: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.parse(rawEnv);
  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    publicBaseUrl: parsed.PUBLIC_BASE_URL.replace(/\/+$/g, ""),
    imageRoot: path.resolve(parsed.IMAGE_ROOT),
    sqlitePath: path.resolve(parsed.SQLITE_PATH),
    maxUploadBytes: Math.floor(parsed.MAX_UPLOAD_MB * 1024 * 1024),
    tokenSecret: parsed.TOKEN_SECRET,
    webpQuality: parsed.WEBP_QUALITY,
    sharpConcurrency: parsed.SHARP_CONCURRENCY,
    rateLimitWindowMs: parsed.RATE_LIMIT_WINDOW_MS,
    rateLimitUploadMax: parsed.RATE_LIMIT_UPLOAD_MAX,
    rateLimitRegisterMax: parsed.RATE_LIMIT_REGISTER_MAX,
  };
}
