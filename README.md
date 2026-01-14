<div align='center'>

![Nookie's Pings](https://i.imgur.com/jbf4u4g.png)

[![](https://dcbadge.limes.pink/api/server/27CT2s9kzy)](https://discord.gg/27CT2s9kzy)

# Nookie's Pings

An open-source, batteries-included restock monitor and Discord bot.

</div>

## How It Works

...

## Requirements

- Discord Application
  - Fill `DISCORD_...` keys in `.env`
- Cloudflare Account
  - Fill `CF_...` keys in `.env`
- bun
- uv

## Usage

1. rename `.env.example` to `.env`
2. `bunx wrangler deploy` and fill `WORKER_URL` in `.env`
3. `bun run setup:db`
4. `uv sync`
5. `bun run worker`

## License

AGPLv3
