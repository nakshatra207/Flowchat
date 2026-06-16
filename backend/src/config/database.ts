import postgres from "postgres";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const sql = postgres(env.databaseUrl, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10
});

export async function connectDatabase(): Promise<void> {
  await sql`SELECT 1`;
  logger.info("Supabase PostgreSQL connection established");
}

export async function disconnectDatabase(): Promise<void> {
  await sql.end();
  logger.info("PostgreSQL connection closed");
}
