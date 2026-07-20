import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  type ChatInputCommandInteraction,
} from "discord.js";
import { updateGuildConfig } from "../utils/config.js";
import { successEmbed, errorEmbed } from "../utils/theme.js";

export const data = new SlashCommandBuilder()
  .setName("setup-logs")
  .setDescription("Set the channel where ticket logs and whitelist logs are sent.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("The log channel")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ embeds: [errorEmbed("Error", "This command can only be used in a server.")], ephemeral: true });
    return;
  }

  const channel = interaction.options.getChannel("channel", true);

  await updateGuildConfig(interaction.guildId, { logChannelId: channel.id });

  await interaction.reply({
    embeds: [
      successEmbed(
        "Log Channel Set",
        `All ticket logs and whitelist events will now be sent to <#${channel.id}>.`,
      ),
    ],
    ephemeral: true,
  });
}
