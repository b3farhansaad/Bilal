# Ticket Claim Bot (Auto ticket room detection) - v2.1

## Why you got "Missing Access" (50001)?
This happens when registering slash commands to a guild the bot doesn't have access to (wrong guildId or bot not invited).
This version disables slash commands by default, because your bot already works automatically by watching ticket channels.

## Features
- Auto-detects any newly created text channel whose name includes `ticket` (configurable).
- Sends a "Claim" message with a button inside the ticket channel.
- Before claim:
  - Ticket opener can view & chat
  - Staff role can view only (no chat)
- After claim:
  - Only the claimer + ticket opener can view & chat
  - Staff role and everyone else cannot view

## Setup
1) Install Node.js 18+
2) Open `config.json` and set:
- token
- staffRoleId

3) Install & run:
```bash
npm i
npm start
```

## Optional: enable slash commands
If you want /ticket and /ping:
- set `enableSlashCommands` = true
- set `guildIdForSlashCommands` to your server id
- make sure the bot is invited to that server with scopes: `bot` + `applications.commands`
