import { REST, RESTGetCurrentApplicationResult, Routes } from "discord.js";
import monitor from "nookie/commands/monitor";

export const commands = new Map([monitor].map((cmd) => [cmd.data.name, cmd]));

export const deployCommands = async () => {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  const applicationId = (
    (await rest.get(
      Routes.currentApplication()
    )) as RESTGetCurrentApplicationResult
  ).id;
  await rest.put(
    Routes.applicationGuildCommands(
      applicationId,
      process.env.DISCORD_GUILD_ID
    ),
    { body: Array.from(commands.values()).map((cmd) => cmd.data.toJSON()) }
  );
};
