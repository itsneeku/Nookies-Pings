<div align='center'>

![Nookie's Pings](https://i.imgur.com/jbf4u4g.png)

[![](https://dcbadge.limes.pink/api/server/27CT2s9kzy)](https://discord.gg/27CT2s9kzy)

# Nookie's Pings

An open-source, batteries-included restock monitor and Discord bot.

</div>

## How It Works

- `BullMQ`: 2 Redis queues, one for scraping jobs and one for results
- `Discord.js`: Discord bot to add jobs to the queue and sending out results
- `zendriver`, `...`: Scrapers made possible using undetectable web automation frameworks

`/monitor` → Scraping Queue → Scrapers → Results Queue → `#your-channel`

## Usage

1. Fill up your `.env`

### With Nix

2. Run a Valkey instance: `nix run .#db`
3. Run the Discord.js bot: `nix run .#main`
4. Run a couple scrapers: `nix run .#worker`

### Without Nix

2. Run a Redis-compatible database (Valkey, KeyDB, etc.)
3. Run the Discord.js bot: `deno run -A src/main.ts`
4. Run a couple scrapers: `deno run -A src/worker.ts`

### Docker

- Soon

## License

AGPLv3
