
import type { Client, TextBasedChannel } from "discord.js";
import { baseEmbed, COLORS } from "../utils/theme.js";
import { getGuildConfig } from "../utils/config.js";
import { logger } from "../../lib/logger.js";

const INTERVAL_MS = 60 * 60 * 1000; // 1 Hour

let reminderInterval: NodeJS.Timeout | null = null;

/**
 * Sends the whitelist reminder to every configured guild.
 */
export async function sendReminder(client: Client): Promise<void> {
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

      // Delete previous reminder
      try {
        const messages = await (channel as TextBasedChannel).messages.fetch({
          limit: 10,
        });

        const previousReminder = messages.find(
          (m) =>
            m.author.id === client.user?.id &&
            m.embeds.length > 0 &&
            m.embeds[0].title?.includes("WHITELIST")
        );

        if (previousReminder) {
          await previousReminder.delete().catch(() => {});
        }
      } catch {}

      await (channel as TextBasedChannel).send({
        content: `<@&${config.needWhitelistedRoleId}>`,
        allowedMentions: {
          roles: [config.needWhitelistedRoleId],
        },
        embeds: [
          baseEmbed(COLORS.primary)
            .setTitle("👑💜 NOXX ROLEPLAY • WHITELIST 💙🖤")
            .setDescription(
              [
                "# 🚨 GET WHITELISTED NOW 🚨",
                "",
                "Ready to enter the city?",
                "",
                "💬 Type **`wl`** in this channel.",
                "",
                "✅ Instant Whitelist",
                "🚓 Police • EMS • DOJ",
                "💼 Player-Owned Businesses",
                "🔫 Gangs • Custom Drugs",
                "🚗 Custom Vehicles",
                "🏙️ Custom MLOs",
                "💰 Balanced Economy",
                "",
                "📢 Invite your friends and start your story today!",
                "",
                "💜 **NOXX ROLEPLAY — WHERE YOUR STORY STARTS.**",
              ].join("\n")
            )
            .setThumbnail(client.user?.displayAvatarURL() ?? null)
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

/**
 * Manual function.
 * Call this from a command to instantly post the announcement.
 */
export async function postWhitelistAnnouncement(client: Client): Promise<void> {
  await sendReminder(client);
}

/**
 * Starts the automatic hourly reminder.
 */
export function startWhitelistReminder(client: Client): void {
  if (reminderInterval) {
    logger.info("Whitelist reminder is already running.");
    return;
  }

  // Send one immediately when the bot starts
  sendReminder(client).catch((err) =>
    logger.error({ err }, "Initial whitelist reminder failed.")
  );

  reminderInterval = setInterval(() => {
    sendReminder(client).catch((err) =>
      logger.error({ err }, "Whitelist reminder interval failed.")
    );
  }, INTERVAL_MS);

  logger.info("Whitelist reminder started.");
}
