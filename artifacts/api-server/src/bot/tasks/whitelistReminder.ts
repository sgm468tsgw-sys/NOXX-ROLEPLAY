import type { Client, TextBasedChannel } from "discord.js";
import { baseEmbed, COLORS } from "../utils/theme.js";
import { getGuildConfig } from "../utils/config.js";
import { logger } from "../../lib/logger.js";

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

let reminderInterval: NodeJS.Timeout | null = null;

async function sendReminder(client: Client): Promise<void> {
  for (const guild of client.guilds.cache.values()) {
    try {
      const config = await getGuildConfig(guild.id);

      if (!config.whitelistChannelId || !config.needWhitelistedRoleId) {
        continue;
      }

      const channel = guild.channels.cache.get(config.whitelistChannelId);

      if (!channel || !channel.isTextBased()) {
        logger.warn(
          { guildId: guild.id },
          "Whitelist channel not found or is not text-based."
        );
        continue;
      }

      await (channel as TextBasedChannel).send({
        content: `<@&${config.needWhitelistedRoleId}>`,
        allowedMentions: {
          roles: [config.needWhitelistedRoleId],
        },
        embeds: [
          baseEmbed(COLORS.primary)
            .setTitle("💜🌆 NOXX ROLEPLAY • WHITELIST 🌆🖤")
            .setDescription([
              "## Ready to Join Noxx Roleplay?",
              "",
              "🚀 Type **`wl`** in this channel to get **instantly whitelisted.**",
              "",
              "✅ Instant Access",
              "🎭 Begin Your RP Journey",
              "💼 Jobs • Gangs • Businesses",
              "🚓 EMS • PD • DOJ",
              "",
              "⚡ **Your story starts here.**",
            ].join("\n"))
            .setFooter({
              text: "Noxx Roleplay • Instant Whitelist",
            })
            .setTimestamp(),
        ],
      });

      logger.info(
        { guildId: guild.id },
        "Whitelist reminder sent successfully."
      );
    } catch (err) {
      logger.error(
        { err, guildId: guild.id },
        "Failed to send whitelist reminder."
      );
    }
  }
}

export function startWhitelistReminder(client: Client): void {
  if (reminderInterval) {
    logger.info("Whitelist reminder is already running.");
    return;
  }

  // Uncomment this if you want one reminder immediately when the bot starts.
  // sendReminder(client).catch(err =>
  //   logger.error({ err }, "Initial whitelist reminder failed.")
  // );

  reminderInterval = setInterval(() => {
    sendReminder(client).catch((err) =>
      logger.error({ err }, "Whitelist reminder interval failed.")
    );
  }, INTERVAL_MS);

  logger.info("Whitelist reminder started.");
}
