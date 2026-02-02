import { Result } from "better-result";
import { verifyKey } from "discord-interactions";
import {
  type APIApplicationCommandInteraction,
  type APIInteraction,
  type APIInteractionResponse,
  InteractionResponseType,
  MessageFlags,
  REST,
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

export const verifyDiscordRequest = async (request: Request, env: Env) => {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");

  if (!signature || !timestamp) return Result.err("Missing signature/timestamp headers");

  return await Result.gen(async function* () {
    const body = yield* Result.await(Result.tryPromise(() => request.text()));

    const valid = yield* Result.await(
      Result.tryPromise(() => verifyKey(body, signature, timestamp, env.DISCORD_PUB_KEY)),
    );
    if (!valid) return Result.err("Invalid request signature");

    return Result.try(() => JSON.parse(body) as APIInteraction);
  });
};

export const updateInteraction = async (
  interaction: APIApplicationCommandInteraction,
  env: Env,
  body?: unknown,
) =>
  Result.tryPromise(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    await new REST()
      .setToken(env.DISCORD_TOKEN)
      .patch(Routes.webhookMessage(interaction.application_id, interaction.token), { body });
  });
