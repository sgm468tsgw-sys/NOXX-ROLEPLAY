import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { updateGuildConfig } from "../utils/config.js";
import { successEmbed, errorEmbed } from "../utils/theme.js";

export const data = new SlashCommandBuilder()
  .setName("setup-need-whitelist-role")
  .setDescription("Set the role that is removed from a player when they get whitelisted.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addRoleOption((opt) =>
    opt
      .setName("role")
      .setDescription("The 'need whitelisted' role to remove on approval")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ embeds: [errorEmbed("Error", "This command can only be used in a server.")], ephemeral: true });
    return;
  }

  const role = interaction.options.getRole("role", true);

  await updateGuildConfig(interaction.guildId, { needWhitelistedRoleId: role.id });

  await interaction.reply({
    embeds: [
      successEmbed(
        "Need-Whitelist Role Set",
        `When a player is whitelisted, <@&${role.id}> will automatically be removed from them.`,
      ),
    ],
    ephemeral: true,
  });
}
