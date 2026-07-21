import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import { postWhitelistAnnouncement } from "../tasks/whitelistReminder.js";
export const data=new SlashCommandBuilder().setName("post-whitelist").setDescription("Posts whitelist reminder").setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(interaction:ChatInputCommandInteraction){await postWhitelistAnnouncement(interaction.client);await interaction.reply({content:"✅ Whitelist reminder posted.",ephemeral:true});}
