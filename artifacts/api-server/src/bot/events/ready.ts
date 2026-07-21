import { REST, Routes } from "discord.js";
import type { Client } from "discord.js";
import { commands } from "../commands/index.js";
import { logger } from "../../lib/logger.js";
import { startWhitelistReminder } from "../tasks/whitelistReminder.js";

export function registerReady(client: Client) {
  client.once("ready", async (c) => {
    logger.info({ tag: c.user.tag }, "Discord bot logged in");

    const token = process.env["DISCORD_TOKEN"];
    const clientId = process.env["DISCORD_CLIENT_ID"];

    if (!token || !clientId) {
      logger.error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID for slash command registration");
      return;
    }

    try {
      const rest = new REST().setToken(token);
      const body = commands.map((cmd) => cmd.data.toJSON());
      await rest.put(Routes.applicationCommands(clientId), { body });
      logger.info({ count: body.length }, "Slash commands registered globally");
    } catch (err) {
      logger.error({ err }, "Failed to register slash commands");
    }

    startWhitelistReminder(c);
  });
}
