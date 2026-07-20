import {
  EmbedBuilder,
  type ColorResolvable,
} from "discord.js";

export const COLORS = {
  primary: 0x7b2fbe as ColorResolvable,   // vivid purple
  dark: 0x4a1a7a as ColorResolvable,       // dark purple
  success: 0x5b8a3c as ColorResolvable,    // green
  error: 0xe74c3c as ColorResolvable,      // red
  warning: 0xf39c12 as ColorResolvable,    // amber
  black: 0x0d0d0d as ColorResolvable,      // near-black
};

export const FOOTER = { text: "FiveM Whitelist Bot", iconURL: undefined as string | undefined };

export function baseEmbed(color: ColorResolvable = COLORS.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setTimestamp()
    .setFooter(FOOTER);
}

export function successEmbed(title: string, description: string) {
  return baseEmbed(COLORS.success)
    .setTitle(`✅ ${title}`)
    .setDescription(description);
}

export function errorEmbed(title: string, description: string) {
  return baseEmbed(COLORS.error)
    .setTitle(`❌ ${title}`)
    .setDescription(description);
}

export function infoEmbed(title: string, description: string) {
  return baseEmbed(COLORS.primary)
    .setTitle(`🔮 ${title}`)
    .setDescription(description);
}
