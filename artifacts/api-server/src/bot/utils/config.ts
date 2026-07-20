import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../../data");
const CONFIG_PATH = path.join(DATA_DIR, "guild-config.json");

export interface TicketInfo {
  ownerId: string;
  ownerTag: string;
  openedAt: string;
}

export interface GuildConfig {
  logChannelId?: string;
  whitelistRoleId?: string;
  needWhitelistedRoleId?: string;
  whitelistChannelId?: string;
  tickets: Record<string, TicketInfo>; // channelId -> info
}

type ConfigStore = Record<string, GuildConfig>;

let cache: ConfigStore | null = null;

async function load(): Promise<ConfigStore> {
  if (cache) return cache;
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    cache = JSON.parse(raw) as ConfigStore;
  } catch {
    cache = {};
  }
  return cache;
}

async function save(store: ConfigStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export async function getGuildConfig(guildId: string): Promise<GuildConfig> {
  const store = await load();
  if (!store[guildId]) {
    store[guildId] = { tickets: {} };
  }
  return store[guildId]!;
}

export async function updateGuildConfig(
  guildId: string,
  updates: Partial<Omit<GuildConfig, "tickets">>,
): Promise<void> {
  const store = await load();
  if (!store[guildId]) store[guildId] = { tickets: {} };
  Object.assign(store[guildId]!, updates);
  await save(store);
}

export async function addTicket(
  guildId: string,
  channelId: string,
  info: TicketInfo,
): Promise<void> {
  const store = await load();
  if (!store[guildId]) store[guildId] = { tickets: {} };
  store[guildId]!.tickets[channelId] = info;
  await save(store);
}

export async function removeTicket(
  guildId: string,
  channelId: string,
): Promise<TicketInfo | undefined> {
  const store = await load();
  if (!store[guildId]) return undefined;
  const info = store[guildId]!.tickets[channelId];
  delete store[guildId]!.tickets[channelId];
  await save(store);
  return info;
}

export async function getTicket(
  guildId: string,
  channelId: string,
): Promise<TicketInfo | undefined> {
  const store = await load();
  return store[guildId]?.tickets[channelId];
}
