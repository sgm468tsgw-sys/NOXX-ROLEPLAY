import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import { baseEmbed, errorEmbed, COLORS } from "../utils/theme.js";

export const data = new SlashCommandBuilder()
  .setName("post-panel")
  .setDescription("Post the ticket panel in a channel.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("Channel to post the panel in (defaults to current)")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ embeds: [errorEmbed("Error", "This command can only be used in a server.")], ephemeral: true });
    return;
  }

  const target = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;

  const embed = baseEmbed(COLORS.primary)
    .setTitle("🎫  Support Tickets")
    .setDescription(
      [
        "**Need help? Open a ticket below.**",
        "",
        ">>> Our staff team will assist you as soon as possible.",
        "Please have your issue ready to describe when the ticket opens.",
        "",
        "**Rules:**",
        "• One ticket per issue",
        "• No spam or abuse",
        "• Staff will close resolved tickets",
      ].join("\n"),
    )
    .setThumbnail(interaction.guild?.iconURL() ?? null)
    .setImage("https://i.imgur.com/0000000.png"); // placeholder — remove if not needed

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:open")
      .setLabel("Open a Ticket")
      .setEmoji("📨")
      .setStyle(ButtonStyle.Primary),
  );

  await target.send({ embeds: [embed], components: [row] });

  await interaction.reply({
    embeds: [
      baseEmbed(COLORS.success)
        .setTitle("✅ Panel Posted")
        .setDescription(`Ticket panel has been posted in <#${target.id}>.`),
    ],
    ephemeral: true,
  });
}
