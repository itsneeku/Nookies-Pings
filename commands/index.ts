import {
  APIApplicationCommandInteraction,
  REST,
  RESTGetCurrentApplicationResult,
  Routes,
} from "discord.js";
import monitor from "./monitor";

export const commands = new Map([monitor].map((cmd) => [cmd.name, cmd]));

export const deployCommands = async () => {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  const applicationId = (
    (await rest.get(
      Routes.currentApplication(),
    )) as RESTGetCurrentApplicationResult
  ).id;
  await rest.put(
    Routes.applicationGuildCommands(
      applicationId,
      process.env.DISCORD_GUILD_ID,
    ),
    {
      body: await Promise.all(
        [...commands.values()].map((cmd) => cmd.data().then((d) => d.toJSON())),
      ),
    },
  );
};

export const updateInteraction = async (
  interaction: APIApplicationCommandInteraction,
  env: Env,
  body?: unknown,
) => {
  await new Promise((resolve) => setTimeout(resolve, 10));

  await new REST()
    .setToken(env.DISCORD_TOKEN)
    .patch(
      Routes.webhookMessage(interaction.application_id, interaction.token),
      { body },
    );
};
