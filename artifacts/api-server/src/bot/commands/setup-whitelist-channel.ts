import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  type ChatInputCommandInteraction,
} from "discord.js";
import { updateGuildConfig } from "../utils/config.js";
import { successEmbed, errorEmbed } from "../utils/theme.js";

export const data = new SlashCommandBuilder()
  .setName("setup-whitelist-channel")
  .setDescription("Set the channel where members type 'wl' to get whitelisted.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("The whitelist channel")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ embeds: [errorEmbed("Error", "This command can only be used in a server.")], ephemeral: true });
    return;
  }

  const channel = interaction.options.getChannel("channel", true);

  await updateGuildConfig(interaction.guildId, { whitelistChannelId: channel.id });

  await interaction.reply({
    embeds: [
      successEmbed(
        "Whitelist Channel Set",
        `Members who type \`wl\` in <#${channel.id}> will receive the whitelist role.`,
      ),
    ],
    ephemeral: true,
  });
}
