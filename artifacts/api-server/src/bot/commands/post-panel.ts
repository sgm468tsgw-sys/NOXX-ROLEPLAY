import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import { baseEmbed, errorEmbed, COLORS } from "../utils/theme.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, "../../../../../attached_assets/088771F1-76CD-4ECC-A7A6-92DA24E8D38F_1784586111164.png");

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

  const logo = new AttachmentBuilder(LOGO_PATH, { name: "noxx-logo.png" });

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
    .setImage("attachment://noxx-logo.png");

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:open")
      .setLabel("Open a Ticket")
      .setEmoji("📨")
      .setStyle(ButtonStyle.Primary),
  );

  await target.send({ embeds: [embed], components: [row], files: [logo] });

  await interaction.reply({
    embeds: [
      baseEmbed(COLORS.success)
        .setTitle("✅ Panel Posted")
        .setDescription(`Ticket panel has been posted in <#${target.id}>.`),
    ],
    ephemeral: true,
  });
}
