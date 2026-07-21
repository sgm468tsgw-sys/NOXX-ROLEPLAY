import type { Client, TextChannel } from "discord.js";
import { baseEmbed, COLORS } from "../utils/theme.js";
import { getGuildConfig } from "../utils/config.js";
import { logger } from "../../lib/logger.js";

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

async function sendReminder(client: Client): Promise<void> {
  for (const [guildId, guild] of client.guilds.cache) {
    try {
      const config = await getGuildConfig(guildId);

      if (!config.whitelistChannelId || !config.needWhitelistedRoleId) continue;

      const channel = guild.channels.cache.get(config.whitelistChannelId) as TextChannel | undefined;
      if (!channel) continue;

      await channel.send({
        content: `<@&${config.needWhitelistedRoleId}>`,
        embeds: [
          baseEmbed(COLORS.primary)
            .setTitle("🎮  Want to Join Noxx Roleplay?")
            .setDescription(
              [
                "You're one step away from accessing the server!",
                "",
                "**To get whitelisted**, simply type `wl` right here in this channel.",
                "It takes less than a second and grants you instant access.",
                "",
                "🌆  **Noxx Roleplay** — where your story begins.",
              ].join("\n"),
            )
            .setFooter({ text: "Noxx Roleplay Whitelist System" })
            .setTimestamp(),
        ],
      });

      logger.info({ guildId }, "Sent whitelist reminder");
    } catch (err) {
      logger.warn({ err, guildId }, "Failed to send whitelist reminder for guild");
    }
  }
}

export function startWhitelistReminder(client: Client): void {
  // Fire immediately, then every 30 minutes
  sendReminder(client).catch((err) =>
    logger.error({ err }, "Error in initial whitelist reminder"),
  );

  setInterval(() => {
    sendReminder(client).catch((err) =>
      logger.error({ err }, "Error in whitelist reminder interval"),
    );
  }, INTERVAL_MS);
}
