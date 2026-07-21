import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { updateGuildConfig } from "../utils/config.js";
import { successEmbed, errorEmbed } from "../utils/theme.js";

export const data = new SlashCommandBuilder()
  .setName("setup-whitelist-role")
  .setDescription("Set the role that is given to users when they are whitelisted.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addRoleOption((opt) =>
    opt
      .setName("role")
      .setDescription("The whitelist role")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ embeds: [errorEmbed("Error", "This command can only be used in a server.")], ephemeral: true });
    return;
  }

  const role = interaction.options.getRole("role", true);

  await updateGuildConfig(interaction.guildId, { whitelistRoleId: role.id });

  await interaction.reply({
    embeds: [
      successEmbed(
        "Whitelist Role Set",
        `Members who type \`wl\` in the whitelist channel will now receive <@&${role.id}>.`,
      ),
    ],
    ephemeral: true,
  });
}
