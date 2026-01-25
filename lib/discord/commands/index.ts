import { REST, Routes } from "discord.js";

import monitor from "./monitor";

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
