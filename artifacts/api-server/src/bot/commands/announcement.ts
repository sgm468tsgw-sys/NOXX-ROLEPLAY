import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import { errorEmbed } from "../utils/theme.js";

const COLOR = 0x6a0dad;

function createAnnouncement(title: string, message: string) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setAuthor({
      name: "🌌 NOXX ROLEPLAY",
    })
    .setTitle(`✦ ${title}`)
    .setDescription(
`╔══════════════════════════════════════╗

## 💜 ${title}

${message}

══════════════════════════════════════

✨ **Stay Respectful**
🌆 **Build Your Story**
🖤 **Welcome to NOXX Roleplay**

╚══════════════════════════════════════╝`
    )
    .setThumbnail(
      "https://cdn.discordapp.com/embed/avatars/0.png" // Replace with your logo URL later
    )
    .setFooter({
      text: "✦ Official NOXX Roleplay Announcement ✦",
    })
    .setTimestamp();
}

export const data = new SlashCommandBuilder()
  .setName("announcement")
  .setDescription("Send a holographic styled announcement.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

  .addStringOption(option =>
    option
      .setName("message")
      .setDescription("Announcement message")
      .setRequired(true)
      .setMaxLength(1800)
  )

  .addStringOption(option =>
    option
      .setName("title")
      .setDescription("Announcement title")
      .setRequired(false)
  )

  .addRoleOption(option =>
    option
      .setName("role")
      .setDescription("Role to ping")
  )

  .addBooleanOption(option =>
    option
      .setName("everyone")
      .setDescription("Ping everyone")
  )

  .addBooleanOption(option =>
    option
      .setName("here")
      .setDescription("Ping here")
  )

  .addChannelOption(option =>
    option
      .setName("channel")
      .setDescription("Channel to send to")
      .addChannelTypes(ChannelType.GuildText)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "Error",
          "This command can only be used inside a server."
        ),
      ],
      ephemeral: true,
    });
  }

  const message = interaction.options.getString("message", true);
  const title =
    interaction.options.getString("title") ?? "Official Announcement";

  const role = interaction.options.getRole("role");
  const everyone = interaction.options.getBoolean("everyone");
  const here = interaction.options.getBoolean("here");

  const channel = (interaction.options.getChannel("channel") ??
    interaction.channel) as TextChannel;

  let ping = "";

  if (everyone) ping += "@everyone ";
  if (here) ping += "@here ";
  if (role) ping += `<@&${role.id}>`;

  const embed = createAnnouncement(title, message);

  try {
    await channel.send({
      content: ping || undefined,
      embeds: [embed],
      allowedMentions: {
        parse: ["everyone", "roles"],
      },
    });

    // Automatically publish if it's an Announcement channel
    if (channel.type === ChannelType.GuildAnnouncement) {
      await channel.crosspost().catch(() => {});
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle("✅ Announcement Sent")
          .setDescription(`Your announcement was successfully sent to ${channel}.`),
      ],
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);

    await interaction.reply({
      embeds: [
        errorEmbed(
          "Failed",
          "I couldn't send the announcement to that channel."
        ),
      ],
      ephemeral: true,
    });
  }
}
