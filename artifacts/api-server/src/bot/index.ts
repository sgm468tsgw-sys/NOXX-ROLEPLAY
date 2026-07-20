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

export function startBot() {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) {
    logger.warn("DISCORD_TOKEN not set — Discord bot will not start");
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
  });

  client.commands = new Collection();

  registerCommands(client);
  registerReady(client);
  registerInteractionCreate(client);
  registerMessageCreate(client);

  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to log in to Discord");
    process.exit(1);
  });

  return client;
}
