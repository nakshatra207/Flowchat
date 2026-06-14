import http from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./socket/index.js";
import { logger } from "./utils/logger.js";

const app = createApp();
const httpServer = http.createServer(app);
createSocketServer(httpServer);

async function bootstrap(): Promise<void> {
  await connectDatabase();

  httpServer.listen(env.port, () => {
    logger.info(`FlowChat backend listening on port ${env.port}`);
  });
}

function shutdown(signal: string): void {
  logger.info(`Received ${signal}. Shutting down backend.`);
  httpServer.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

bootstrap().catch((error: unknown) => {
  logger.error("Backend bootstrap failed", {
    error: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});

