import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import type { Command } from "./commands/index.js";
import { registerCommands } from "./commands/index.js";
import { registerReady } from "./events/ready.js";
import { registerInteractionCreate } from "./events/interactionCreate.js";
import { registerMessageCreate } from "./events/messageCreate.js";
import { logger } from "../lib/logger.js";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}

let client: Client | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY_MS = 60_000;

function createClient(): Client {
  const c = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
  });

  c.commands = new Collection();
  registerCommands(c);
  registerReady(c);
  registerInteractionCreate(c);
  registerMessageCreate(c);

  // Log websocket errors without crashing
  c.on("error", (err) => {
    logger.error({ err }, "Discord client error");
  });

  // Reconnect on unexpected disconnect
  c.on("shardDisconnect", (event, shardId) => {
    logger.warn({ code: event.code, shardId }, "Discord shard disconnected — scheduling reconnect");
    scheduleReconnect();
  });

  c.on("shardError", (err, shardId) => {
    logger.error({ err, shardId }, "Discord shard error");
  });

  c.on("shardReconnecting", (shardId) => {
    logger.info({ shardId }, "Discord shard reconnecting...");
  });

  c.on("shardResume", (shardId, replayed) => {
    reconnectAttempts = 0;
    logger.info({ shardId, replayed }, "Discord shard resumed");
  });

  return c;
}

function scheduleReconnect() {
  reconnectAttempts += 1;
  const delay = Math.min(5_000 * reconnectAttempts, MAX_RECONNECT_DELAY_MS);
  logger.info({ attempt: reconnectAttempts, delayMs: delay }, "Reconnecting to Discord...");

  setTimeout(() => {
    const token = process.env["DISCORD_TOKEN"];
    if (!token) return;

    try {
      client?.destroy();
    } catch {
      // ignore
    }

    client = createClient();
    client.login(token).then(() => {
      reconnectAttempts = 0;
    }).catch((err) => {
      logger.error({ err }, "Reconnect login failed — will retry");
      scheduleReconnect();
    });
  }, delay);
}

export function startBot() {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) {
    logger.warn("DISCORD_TOKEN not set — Discord bot will not start");
    return;
  }

  // Prevent unhandled promise rejections from taking down the process
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection — bot kept alive");
  });

  process.on("uncaughtException", (err) => {
    logger.error({ err }, "Uncaught exception — bot kept alive");
  });

  client = createClient();

  client.login(token).catch((err) => {
    logger.error({ err }, "Initial Discord login failed — will retry");
    scheduleReconnect();
  });

  return client;
}
