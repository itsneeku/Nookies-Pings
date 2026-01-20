import { verifyKey } from "discord-interactions";
import {
  APIInteraction,
  APIInteractionResponse,
  InteractionResponseType,
  MessageFlags,
  REST,
  RESTGetCurrentApplicationResult,
  Routes,
} from "discord.js";

const getPubKey = async (env: Env) =>
  (
    (await new REST()
      .setToken(env.DISCORD_TOKEN)
      .get(Routes.currentApplication())) as RESTGetCurrentApplicationResult
  ).verify_key;

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
    await getPubKey(env),
  );
  return valid ? (JSON.parse(body) as APIInteraction) : null;
};

export const upsertJob = async (db: D1Database, data: MonitorInput) =>
  await db
    .prepare(
      `INSERT INTO jobs (store, method, channel, role, cron, custom, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(store, method, custom) DO UPDATE SET
         channel = excluded.channel,
         role = excluded.role,
         cron = excluded.cron,
         updated_at = excluded.updated_at
       RETURNING *`,
    )
    .bind(
      data.store,
      data.method,
      data.channel,
      data.role,
      data.cron,
      JSON.stringify(data.custom),
      Math.floor(Date.now() / 1000),
    )
    .first();
