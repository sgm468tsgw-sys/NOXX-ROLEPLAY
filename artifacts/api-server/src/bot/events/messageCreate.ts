import { type Client, type TextChannel } from "discord.js";
import { getGuildConfig } from "../utils/config.js";
import { baseEmbed, errorEmbed, COLORS } from "../utils/theme.js";
import { logger } from "../../lib/logger.js";

export function registerMessageCreate(client: Client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.guild || !message.guildId) return;

    try {
      await handleWhitelist(message);
    } catch (err) {
      logger.error({ err }, "Error handling messageCreate");
    }
  });
}

async function handleWhitelist(message: import("discord.js").Message) {
  if (!message.guild || !message.guildId) return;

  const config = await getGuildConfig(message.guildId);

  // Only trigger in the designated whitelist channel
  if (!config.whitelistChannelId || message.channelId !== config.whitelistChannelId) return;

  const content = message.content.trim().toLowerCase();
  if (content !== "wl") return;

  // Check role is configured
  if (!config.whitelistRoleId) {
    await message.reply({
      embeds: [errorEmbed("Not Configured", "No whitelist role has been set. Ask an admin to run `/setup-whitelist-role`.")],
    });
    return;
  }

  const member = message.member;
  if (!member) return;

  const role = message.guild.roles.cache.get(config.whitelistRoleId);
  if (!role) {
    await message.reply({
      embeds: [errorEmbed("Role Not Found", "The configured whitelist role no longer exists. Ask an admin to reconfigure it.")],
    });
    return;
  }

  // Check if already whitelisted
  if (member.roles.cache.has(role.id)) {
    await message.delete().catch(() => null);
    const notice = await message.channel.send({
      content: `<@${message.author.id}>`,
      embeds: [
        baseEmbed(COLORS.dark)
          .setTitle("⚡  Already Whitelisted")
          .setDescription(`You already have the <@&${role.id}> role.`),
      ],
    });
    setTimeout(() => notice.delete().catch(() => null), 8000);
    return;
  }

  // Grant the whitelist role
  try {
    await member.roles.add(role, `Whitelisted via #${(message.channel as TextChannel).name}`);
  } catch (err: unknown) {
    const isPermError =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: unknown }).code === 50013;

    if (isPermError) {
      const notice = await message.channel.send({
        embeds: [
          baseEmbed(COLORS.error)
            .setTitle("❌  Bot Missing Permissions")
            .setDescription(
              [
                `I don't have permission to assign <@&${role.id}>.`,
                "",
                "**Fix:** In your server's role list, drag the bot's role **above** the whitelist role, then try again.",
              ].join("\n"),
            ),
        ],
      });
      setTimeout(() => notice.delete().catch(() => null), 15000);
    }
    throw err;
  }

  // Remove the "need whitelisted" role if the player has it
  if (config.needWhitelistedRoleId && member.roles.cache.has(config.needWhitelistedRoleId)) {
    const needRole = message.guild.roles.cache.get(config.needWhitelistedRoleId);
    if (needRole) {
      await member.roles.remove(needRole, "Player has been whitelisted").catch(() => null);
    }
  }

  await message.delete().catch(() => null);

  const successMsg = await message.channel.send({
    content: `<@${message.author.id}>`,
    embeds: [
      baseEmbed(COLORS.primary)
        .setTitle("✅  Whitelisted!")
        .setDescription(
          `Congratulations <@${message.author.id}>! You have been granted the <@&${role.id}> role.\nWelcome to the server!`,
        )
        .addFields(
          { name: "Player", value: `${message.author.tag}`, inline: true },
          { name: "Role Granted", value: `<@&${role.id}>`, inline: true },
          { name: "Time", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        ),
    ],
  });

  setTimeout(() => successMsg.delete().catch(() => null), 15000);

  // Log to log channel
  if (config.logChannelId) {
    const logChannel = message.guild.channels.cache.get(config.logChannelId) as TextChannel | undefined;
    if (logChannel) {
      await logChannel.send({
        embeds: [
          baseEmbed(COLORS.primary)
            .setTitle("🎮  Whitelist Granted")
            .setDescription("A player has been whitelisted.")
            .addFields(
              { name: "Player", value: `<@${message.author.id}> (${message.author.tag})`, inline: true },
              { name: "Role", value: `<@&${role.id}>`, inline: true },
              { name: "Channel", value: `<#${message.channelId}>`, inline: true },
              { name: "Time", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
            ),
        ],
      });
    }
  }
}
