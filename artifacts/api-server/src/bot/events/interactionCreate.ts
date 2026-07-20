import {
  type Client,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type TextChannel,
  Collection,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} from "discord.js";
import type { Command } from "../commands/index.js";
import {
  getGuildConfig,
  addTicket,
  removeTicket,
  getTicket,
} from "../utils/config.js";
import { baseEmbed, errorEmbed, successEmbed, infoEmbed, COLORS } from "../utils/theme.js";
import { logger } from "../../lib/logger.js";

export function registerInteractionCreate(client: Client) {
  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(client, interaction);
      } else if (interaction.isButton()) {
        await handleButton(interaction);
      }
    } catch (err) {
      logger.error({ err }, "Error handling interaction");
    }
  });
}

async function handleCommand(client: Client, interaction: ChatInputCommandInteraction) {
  const col = (client as Client & { commands: Collection<string, Command> }).commands;
  const cmd = col?.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (err) {
    logger.error({ err, command: interaction.commandName }, "Command error");
    const msg = { embeds: [errorEmbed("Error", "An error occurred while running this command.")], ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
}

async function handleButton(interaction: ButtonInteraction) {
  const [ns, action] = interaction.customId.split(":");

  if (ns === "ticket") {
    if (action === "open") await openTicket(interaction);
    else if (action === "close") await closeTicket(interaction);
  }
}

// ─── Open Ticket ──────────────────────────────────────────────────────────────

async function openTicket(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.guildId) {
    await interaction.reply({ embeds: [errorEmbed("Error", "Server not found.")], ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const member = interaction.member;
  const user = interaction.user;

  // Check if user already has an open ticket
  const config = await getGuildConfig(interaction.guildId);
  const existingTicket = Object.entries(config.tickets).find(
    ([, info]) => info.ownerId === user.id,
  );
  if (existingTicket) {
    await interaction.editReply({
      embeds: [errorEmbed("Already Open", `You already have an open ticket: <#${existingTicket[0]}>.`)],
    });
    return;
  }

  // Find or create a ticket category
  let category = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === "tickets",
  );

  if (!category) {
    category = await guild.channels.create({
      name: "Tickets",
      type: ChannelType.GuildCategory,
    });
  }

  // Create the private ticket channel
  const ticketChannel = await guild.channels.create({
    name: `ticket-${user.username}`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: guild.roles.cache.find((r) => r.permissions.has(PermissionFlagsBits.ManageChannels))?.id ?? guild.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ],
      },
    ],
  });

  // Store ticket info
  const openedAt = new Date().toISOString();
  await addTicket(interaction.guildId, ticketChannel.id, {
    ownerId: user.id,
    ownerTag: user.tag,
    openedAt,
  });

  // Send welcome embed inside the ticket
  const welcomeEmbed = baseEmbed(COLORS.primary)
    .setTitle("🎫  Ticket Opened")
    .setDescription(
      [
        `Welcome <@${user.id}>! A staff member will be with you shortly.`,
        "",
        "Please describe your issue in detail below.",
        "Use the button below to close this ticket when resolved.",
      ].join("\n"),
    )
    .addFields(
      { name: "Opened By", value: `<@${user.id}> (${user.tag})`, inline: true },
      { name: "Opened At", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
    );

  const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:close")
      .setLabel("Close Ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger),
  );

  await ticketChannel.send({
    content: `<@${user.id}>`,
    embeds: [welcomeEmbed],
    components: [closeRow],
  });

  // Log ticket opened
  if (config.logChannelId) {
    const logChannel = guild.channels.cache.get(config.logChannelId) as TextChannel | undefined;
    if (logChannel) {
      await logChannel.send({
        embeds: [
          infoEmbed("Ticket Opened", "A new support ticket has been opened.")
            .addFields(
              { name: "User", value: `<@${user.id}> (${user.tag})`, inline: true },
              { name: "Channel", value: `<#${ticketChannel.id}>`, inline: true },
              { name: "Opened At", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
            ),
        ],
      });
    }
  }

  await interaction.editReply({
    embeds: [successEmbed("Ticket Created", `Your ticket has been opened: <#${ticketChannel.id}>`)],
  });
}

// ─── Close Ticket ─────────────────────────────────────────────────────────────

async function closeTicket(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.guildId || !interaction.channel) {
    await interaction.reply({ embeds: [errorEmbed("Error", "Server or channel not found.")], ephemeral: true });
    return;
  }

  const ticketInfo = await getTicket(interaction.guildId, interaction.channelId);
  if (!ticketInfo) {
    await interaction.reply({
      embeds: [errorEmbed("Not a Ticket", "This channel is not a tracked ticket.")],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: false });

  const channel = interaction.channel as TextChannel;
  const guild = interaction.guild;
  const closedBy = interaction.user;

  // Collect transcript (last 100 messages)
  const messages = await channel.messages.fetch({ limit: 100 });
  const transcript = messages
    .reverse()
    .map((m) => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content || "[embed/attachment]"}`)
    .join("\n");

  // Send transcript log to log channel
  const config = await getGuildConfig(interaction.guildId);
  if (config.logChannelId) {
    const logChannel = guild.channels.cache.get(config.logChannelId) as TextChannel | undefined;
    if (logChannel) {
      const logEmbed = baseEmbed(COLORS.dark)
        .setTitle("🔒  Ticket Closed")
        .setDescription("A ticket has been closed and archived below.")
        .addFields(
          { name: "Opened By", value: `<@${ticketInfo.ownerId}> (${ticketInfo.ownerTag})`, inline: true },
          { name: "Closed By", value: `<@${closedBy.id}> (${closedBy.tag})`, inline: true },
          { name: "Opened At", value: `<t:${Math.floor(new Date(ticketInfo.openedAt).getTime() / 1000)}:F>`, inline: true },
          { name: "Closed At", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          { name: "Channel", value: channel.name, inline: true },
        );

      const transcriptBuffer = Buffer.from(transcript || "(no messages)", "utf-8");

      await logChannel.send({
        embeds: [logEmbed],
        files: [
          {
            attachment: transcriptBuffer,
            name: `transcript-${channel.name}-${Date.now()}.txt`,
          },
        ],
      });
    }
  }

  await removeTicket(interaction.guildId, interaction.channelId);

  // Notify then delete after short delay
  const closingEmbed = baseEmbed(COLORS.dark)
    .setTitle("🔒  Closing Ticket")
    .setDescription("This ticket is being closed. The channel will be deleted in 5 seconds.");

  await interaction.editReply({ embeds: [closingEmbed] });

  await new Promise((resolve) => setTimeout(resolve, 5000));
  await channel.delete("Ticket closed").catch(() => null);
}
