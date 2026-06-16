import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const hasDb = !!(process.env.SUPABASE_URL || process.env.DATABASE_URL);
const app = hasDb
  ? (await import("./app")).default
  : (await import("./mockApp")).default;

if (!hasDb) {
  logger.warn(
    "SUPABASE_URL is not set; using local in-memory demo API for development.",
  );
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
