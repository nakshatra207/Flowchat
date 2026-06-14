import dotenv from "dotenv";
import Joi from "joi";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().port().default(4000),
  CLIENT_ORIGIN: Joi.string().uri().required(),
  MONGODB_URI: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),
  UPLOAD_DIR: Joi.string().default("uploads"),
  MAX_FILE_SIZE_MB: Joi.number().integer().min(1).max(100).default(25),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().default(100)
}).unknown(true);

const { value, error } = envSchema.validate(process.env, {
  abortEarly: false,
  convert: true
});

if (error) {
  throw new Error(`Environment validation failed: ${error.message}`);
}

export const env = {
  nodeEnv: value.NODE_ENV as "development" | "test" | "production",
  port: Number(value.PORT),
  clientOrigin: value.CLIENT_ORIGIN as string,
  mongodbUri: value.MONGODB_URI as string,
  jwtAccessSecret: value.JWT_ACCESS_SECRET as string,
  jwtRefreshSecret: value.JWT_REFRESH_SECRET as string,
  jwtAccessExpiresIn: value.JWT_ACCESS_EXPIRES_IN as string,
  jwtRefreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN as string,
  bcryptSaltRounds: Number(value.BCRYPT_SALT_ROUNDS),
  uploadDir: value.UPLOAD_DIR as string,
  maxFileSizeMb: Number(value.MAX_FILE_SIZE_MB),
  rateLimitWindowMs: Number(value.RATE_LIMIT_WINDOW_MS),
  rateLimitMaxRequests: Number(value.RATE_LIMIT_MAX_REQUESTS),
  isProduction: value.NODE_ENV === "production",
  isTest: value.NODE_ENV === "test"
};

