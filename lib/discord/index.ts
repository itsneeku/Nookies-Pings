import { REST, Routes } from "discord.js";
import { fileURLToPath } from "url";

import monitor from "@/lib/discord/commands/monitor";

export const commands = {
  monitor,
};

export const deployCommands = async () =>
  await new REST()
    .setToken(process.env.DISCORD_TOKEN)
    .put(
      Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, process.env.DISCORD_GUILD_ID),
      {
        body: await Promise.all(Object.values(commands).map((cmd) => cmd.command.toJSON())),
      },
    );

if (import.meta.url && process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log("Deploying commands...");
  await deployCommands();
  console.log("Commands deployed!");
}
