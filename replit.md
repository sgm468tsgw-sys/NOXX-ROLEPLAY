# Noxx Roleplay — FiveM Discord Bot

A FiveM-focused Discord bot with a purple & black theme, full ticket system, and whitelist role management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server + Discord bot
- Required secrets: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Discord: discord.js v14
- HTTP: Express 5 (hosts healthcheck alongside bot)
- Build: esbuild (ESM bundle)

## Where things live

- `artifacts/api-server/src/bot/` — all bot code
  - `commands/` — slash commands (setup-logs, post-panel, setup-whitelist-role, setup-whitelist-channel)
  - `events/` — ready, interactionCreate, messageCreate
  - `utils/config.ts` — guild settings stored in `data/guild-config.json`
  - `utils/theme.ts` — purple/black embed helpers

## Bot Commands

| Command | Permission | Description |
|---|---|---|
| `/setup-logs #channel` | Admin | Set channel for ticket + whitelist logs |
| `/post-panel [#channel]` | Admin | Post the ticket panel with Open button |
| `/setup-whitelist-role @role` | Admin | Set role granted on whitelist |
| `/setup-whitelist-channel #channel` | Admin | Set channel where users type `wl` |

## Whitelist Flow

1. Admin runs `/setup-whitelist-role` and `/setup-whitelist-channel`
2. User types `wl` in the designated channel
3. Bot deletes the message, grants the role, logs to log channel

## Ticket Flow

1. Admin runs `/post-panel` in desired channel
2. User clicks "Open a Ticket" → private channel created
3. Staff handles issue, clicks "Close Ticket" → transcript saved + channel deleted

## User preferences

- Purple & black theme throughout all embeds
- FiveM server branding

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
