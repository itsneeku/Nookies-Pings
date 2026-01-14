import { InteractionType, InteractionResponseType } from "discord.js";
import { DurableObject, waitUntil } from "cloudflare:workers";
import { commands } from "nookie/commands/index";
import { deferInteraction, verifyDiscordRequest } from "./discord";

export default {
  async fetch(request, env) {
    if (request.headers.get("Upgrade") === "websocket")
      return env.DO.getByName(":3").fetch(request);

    const interaction = await verifyDiscordRequest(request, env);
    if (!interaction) return Response.json(":3", { status: 401 });

    switch (interaction.type) {
      case InteractionType.Ping:
        return Response.json({ type: InteractionResponseType.Pong });

      case InteractionType.ApplicationCommand:
        waitUntil(
          commands.get(interaction.data.name)!.execute(interaction, env)
        );
        return deferInteraction();

      default:
        return Response.json(":3", { status: 400 });
    }
  },
} satisfies ExportedHandler<Env>;

export class WebSocketServer extends DurableObject<Env> {
  override async fetch(_request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.ctx.acceptWebSocket(server!);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async broadcast(change: unknown) {
    const message = JSON.stringify(change);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(message);
      } catch (err) {
        console.error("[Hub] Failed to send message:", err);
        ws.close();
      }
    }
  }
}
