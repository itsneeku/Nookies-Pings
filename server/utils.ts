import { verifyKey } from "discord-interactions";
import {
  APIInteraction,
  APIInteractionResponse,
  InteractionResponseType,
  MessageFlags,
} from "discord.js";

export const deferInteraction = (ephemeral: boolean = true) =>
  Response.json({
    type: InteractionResponseType.DeferredChannelMessageWithSource,
    data:
      ephemeral ?
        {
          flags: MessageFlags.Ephemeral,
        }
      : undefined,
  } satisfies APIInteractionResponse);

export const verifyDiscordRequest = async (request: Request, env: Env) => {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const body = await request.text();
  if (!signature || !timestamp) return null;

  const valid = await verifyKey(
    body,
    signature,
    timestamp,
    env.DISCORD_PUB_KEY,
  );
  return valid ? (JSON.parse(body) as APIInteraction) : null;
};
