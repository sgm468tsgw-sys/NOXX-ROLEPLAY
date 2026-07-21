import type { Client, TextBasedChannel } from "discord.js";
import { baseEmbed, COLORS } from "../utils/theme.js";
import { getGuildConfig } from "../utils/config.js";
import { logger } from "../../lib/logger.js";

const INTERVAL_MS = 60 * 60 * 1000; // 1 Hour

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

      const textChannel = channel as TextBasedChannel;

      // Delete previous whitelist reminder
      try {
        const messages = await textChannel.messages.fetch({ limit: 20 });

        const oldReminder = messages.find(
          (m) =>
            m.author.id === client.user?.id &&
            m.embeds.length > 0 &&
            m.embeds[0].title?.includes("WELCOME TO NOXX ROLEPLAY")
        );

        if (oldReminder) {
          await oldReminder.delete().catch(() => {});
        }
      } catch {}

      await textChannel.send({
        content: `<@&${config.needWhitelistedRoleId}>`,
        allowedMentions: {
          roles: [config.needWhitelistedRoleId],
        },
        embeds: [
          baseEmbed(COLORS.primary)
            .setTitle("👑💜 WELCOME TO NOXX ROLEPLAY 💙🖤")
            .setDescription([
              "# 🌆 Welcome to the City!",
              "",
              "Thank you for joining **NOXX Roleplay**! We're excited to have you become part of our community.",
              "",
              "### 🚀 Getting Started",
              "💬 Type **`wl`** in this channel to receive your **instant whitelist**.",
              "",
              "## 🌟 What You'll Find",
              "🚓 Active Police, EMS & DOJ",
              "💼 Player-Owned Businesses",
              "🔫 Gangs & Criminal Progression",
              "🚗 Custom Vehicles",
              "🏙️ Premium Custom MLOs",
              "🏠 Housing & Player Activities",
              "💰 Balanced Economy",
              "🎭 Serious Roleplay with Fun Experiences",
              "",
              "## ❤️ Why Choose NOXX?",
              "🤝 Friendly Community",
              "🛠️ Active Staff Team",
              "📈 Frequent Updates",
              "🎉 New Content Added Regularly",
              "",
              "📢 Invite your friends, get whitelisted, and begin creating unforgettable stories together.",
              "",
              "💜 **We can't wait to see you in the city!**",
              "",
              "🌆 **NOXX ROLEPLAY — WHERE YOUR STORY STARTS.** 👑",
            ].join("\n"))
            .setThumbnail(client.user?.displayAvatarURL() ?? undefined)
            .setImage("https://i.imgur.com/YOUR_SERVER_BANNER.png") // Replace with your banner URL
            .setFooter({
              text: "💜 NOXX Roleplay • Join Today • Instant Whitelist",
              iconURL: client.user?.displayAvatarURL(),
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

  // Send immediately when the bot starts
  sendReminder(client).catch((err) =>
    logger.error({ err }, "Initial whitelist reminder failed.")
  );

  // Repeat every hour
  reminderInterval = setInterval(() => {
    sendReminder(client).catch((err) =>
      logger.error({ err }, "Whitelist reminder interval failed.")
    );
  }, INTERVAL_MS);

  logger.info("NOXX Roleplay whitelist reminder started.");
}
