import app from "./app";
import { logger } from "./lib/logger";
import { startBot } from "./bot/index";

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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Self-ping every 4 minutes to keep the repl awake on the free plan
  setInterval(() => {
    fetch(`http://localhost:${port}/api/healthz`)
      .catch(() => null); // silently ignore failures
  }, 4 * 60 * 1000);
});

// Start the Discord bot alongside the HTTP server
startBot();
