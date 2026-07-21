import { Collection, type Client } from "discord.js";
import * as setupLogs from "./setup-logs.js";
import * as postPanel from "./post-panel.js";
import * as setupWhitelistRole from "./setup-whitelist-role.js";
import * as setupWhitelistChannel from "./setup-whitelist-channel.js";
import * as setupNeedWhitelistRole from "./setup-need-whitelist-role.js";
import * as announcement from "./announcement.js";

export interface Command {
  data: { name: string; toJSON: () => unknown };
  execute: (interaction: import("discord.js").ChatInputCommandInteraction) => Promise<void>;
}

const commands: Command[] = [
  setupLogs,
  postPanel,
  setupWhitelistRole,
  setupWhitelistChannel,
  setupNeedWhitelistRole,
  announcement,
];

export function registerCommands(client: Client) {
  if (!client.commands) {
    (client as Client & { commands: Collection<string, Command> }).commands = new Collection();
  }
  const col = (client as Client & { commands: Collection<string, Command> }).commands;
  for (const cmd of commands) {
    col.set(cmd.data.name, cmd);
  }
}

export { commands };
