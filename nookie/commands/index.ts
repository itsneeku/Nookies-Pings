import { REST, Routes } from "discord.js";
import monitor from "nookie/commands/monitor";

export const commands = new Map([monitor].map((cmd) => [cmd.data.name, cmd]));

export const deployCommands = async () =>
  await new REST()
    .setToken(process.env.DISCORD_TOKEN)
    .put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_APPLICATION_ID,
        process.env.DISCORD_GUILD_ID
      ),
      { body: Array.from(commands.values()).map((cmd) => cmd.data.toJSON()) }
    );
