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

  if (!signature || !timestamp) {
    return Result.err({
      op: "[verifyDiscordRequest] verify headers",
      cause: "Missing signature or timestamp headers",
    });
  }

  const body = await request.text();

  return Result.gen(async function* () {
    const valid = yield* Result.await(
      Result.tryPromise({
        try: () => verifyKey(body, signature, timestamp, env.DISCORD_PUB_KEY),
        catch: (cause) => ({
          op: "[verifyDiscordRequest] verify signature",
          cause,
        }),
      }),
    );

    if (!valid) {
      return Result.err({
        op: "[verifyDiscordRequest] verify signature",
        cause: "Invalid signature",
      });
    }

    const parsed = yield* Result.await(
      Result.tryPromise({
        try: async () => JSON.parse(body) as APIInteraction,
        catch: (cause) => ({
          op: "[verifyDiscordRequest] parse body",
          cause,
        }),
      }),
    );

    return Result.ok(parsed);
  });
};

export const updateInteraction = async (
  interaction: APIApplicationCommandInteraction,
  env: Env,
  body?: unknown,
) => {
  return Result.tryPromise({
    try: async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      await new REST()
        .setToken(env.DISCORD_TOKEN)
        .patch(Routes.webhookMessage(interaction.application_id, interaction.token), { body });
    },
    catch: (cause) => ({ op: "[updateInteraction] execute", cause }),
  });
};
