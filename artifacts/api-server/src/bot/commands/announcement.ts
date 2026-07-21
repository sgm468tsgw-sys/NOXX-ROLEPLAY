import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import { errorEmbed, COLORS } from "../utils/theme.js";

// Galaxy-themed deep purple/black palette
const GALAXY_PURPLE = 0x6a0dad;

function galaxyEmbed(title: string, message: string): EmbedBuilder {
  const divider = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
  const starRow  = "✦ ˚ · ★  ✧ ⋆ ˚ · ✦ ★  ⋆ ✧ ˚ · ✦";

  return new EmbedBuilder()
    .setColor(GALAXY_PURPLE)
    .setTitle(`🌌  ${title}`)
    .setDescription(
      [
        `> ${starRow}`,
        `> ${divider}`,
        ``,
        message,
        ``,
        `> ${divider}`,
        `> ${starRow}`,
      ].join("\n"),
    )
    .setFooter({
      text: "✦ Noxx Roleplay  ·  Official Announcement",
    })
    .setTimestamp();
}

export const data = new SlashCommandBuilder()
  .setName("announcement")
  .setDescription("Send a galaxy-themed announcement to a channel.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((opt) =>
    opt
      .setName("message")
      .setDescription("The announcement message")
      .setRequired(true)
      .setMaxLength(1800),
  )
  .addStringOption((opt) =>
    opt
      .setName("title")
      .setDescription("Title of the announcement (default: Announcement)")
      .setRequired(false)
      .setMaxLength(80),
  )
  .addRoleOption((opt) =>
    opt
      .setName("role")
      .setDescription("Role to ping with the announcement")
      .setRequired(false),
  )
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("Channel to send the announcement in (defaults to current)")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({
      embeds: [errorEmbed("Error", "This command can only be used in a server.")],
      ephemeral: true,
    });
    return;
  }

  const message = interaction.options.getString("message", true);
  const title = interaction.options.getString("title") ?? "Announcement";
  const role = interaction.options.getRole("role");
  const target = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;

  const embed = galaxyEmbed(title, message);

  await target.send({
    content: role ? `<@&${role.id}>` : undefined,
    embeds: [embed],
  });

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(GALAXY_PURPLE)
        .setTitle("🌌  Announcement Sent")
        .setDescription(`Your announcement has been posted in <#${target.id}>.`),
    ],
    ephemeral: true,
  });
}
