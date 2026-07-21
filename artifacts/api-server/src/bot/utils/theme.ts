import {
  EmbedBuilder,
  type ColorResolvable,
} from "discord.js";

export const COLORS = {
  primary: 0x7b2fbe as ColorResolvable,   // vivid purple
  dark: 0x1a0533 as ColorResolvable,       // near-black purple
  success: 0x5865f2 as ColorResolvable,    // Discord blue / blurple
  error: 0x9b30d9 as ColorResolvable,      // bright purple (errors)
  warning: 0x4f46e5 as ColorResolvable,    // indigo-blue
  black: 0x0d0d0d as ColorResolvable,      // pure black
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
