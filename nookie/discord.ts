import { verifyKey } from "discord-interactions";
import {
  APIApplicationCommandInteraction,
  APIInteraction,
  APIInteractionResponse,
  InteractionResponseType,
  MessageFlags,
  REST,
  RESTGetCurrentApplicationResult,
  Routes,
} from "discord.js";

export const deferInteraction = (ephemeral: boolean = true) =>
  Response.json({
    type: InteractionResponseType.DeferredChannelMessageWithSource,
    data: ephemeral
      ? {
          flags: MessageFlags.Ephemeral,
        }
      : undefined,
  } satisfies APIInteractionResponse);

export const updateInteraction = async (
  interaction: APIApplicationCommandInteraction,
  env: Env,
  body?: unknown
) => {
  await new Promise((resolve) => setTimeout(resolve, 0));

  await new REST()
    .setToken(env.DISCORD_TOKEN)
    .patch(
      Routes.webhookMessage(interaction.application_id, interaction.token),
      { body }
    );
};

const getPubKey = async (env: Env) =>
  (
    (await new REST()
      .setToken(env.DISCORD_TOKEN)
      .get(Routes.currentApplication())) as RESTGetCurrentApplicationResult
  ).verify_key;

export const verifyDiscordRequest = async (request: Request, env: Env) => {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const body = await request.text();
  if (!signature || !timestamp) return null;

  const valid = await verifyKey(
    body,
    signature,
    timestamp,
    await getPubKey(env)
  );
  return valid ? (JSON.parse(body) as APIInteraction) : null;
};
