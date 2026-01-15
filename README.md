<div align="center">

![Nookie's Pings](https://i.imgur.com/jbf4u4g.png)

[![Discord](https://dcbadge.limes.pink/api/server/27CT2s9kzy)](https://discord.gg/27CT2s9kzy)

# Nookie's Pings

An open-source, batteries-included restock monitor with Discord integration.

</div>

## Overview

- **Cloudflare Worker:** Hosts the Discord bot and WebSocket server
  - **Discord Bot:** Manages `/monitor` commands and stores requests in D1 database
  - **WebSocket Server:** Pushes database changes to connected clients
- **Local Job Scheduler:** Executes scrapers on cron schedules, syncing with the database via WebSocket

## Requirements

- [Discord Application](https://discord.com/developers/applications/)
- [Cloudflare Account](https://dash.cloudflare.com)
- [Bun](https://bun.sh)
- [uv](https://github.com/astral-sh/uv)

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials
2. Deploy the worker and add the URL to `.env`

   ```
   bunx wrangler deploy
   ```

3. Initialize the database
   ```
   bun run setup:db
   ```
4. Install Python dependencies

   ```sh
   uv sync
   ```

5. Start the job scheduler
   ```sh
   bun run worker
   ```

## Rotating IPv6 Mobile Proxy (AnyIP + `ndppd`)

If you have a mobile data connection with RFC 4941 SLAAC, you may have noticed that you're assigned an entire /64 IPv6 block. If you run a hotspot, each device will have a unique IPv6 address from the same prefix.

You can run `sudo uv run runner/ndppd.py` to setup

- AnyIP to send from any address within your block
- `ndppd` to receive the response back

While its running, a `IPV6_SUBNET` key will be added to your `.env` and be used to choose a source interface in `scrapers/utils/base.py`

This effectively turns your mobile data connection into a free-ish rotating IPv6 mobile proxy. Some like Cloudflare and Akamai may aggregate by /64 or /48, but others don't.

## License

[AGPLv3](LICENSE)

**TLDR:** Do whatever. Modify, sell, marry it. As long as you open-source your changes under the same license.
