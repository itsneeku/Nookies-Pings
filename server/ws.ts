import { Result } from "better-result";
import { DurableObject } from "cloudflare:workers";

import { logger } from "@/lib/logger";

export class WebSocketServer extends DurableObject<Env> {
  override async fetch(request: Request) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (token !== this.env.WS_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    if (!server) return new Response(null, { status: 500 });

    this.ctx.acceptWebSocket(server);
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async broadcast(payload: WebSocketPayload) {
    const websockets = this.ctx.getWebSockets();
    if (websockets.length === 0) return;

    const message = Result.try(() => JSON.stringify(payload));
    if (message.isErr())
      return logger.error(
        { module: "WebSocketServer", payload, error: message.error },
        "Payload serialization failed",
      );

    for (const ws of websockets) {
      Result.try(() => ws.send(message.value)).match({
        ok: () => logger.info({ module: "WebSocketServer", ws, payload }, "Broadcast successful"),
        err: (error) => {
          logger.error({ module: "WebSocketServer", error, ws, payload }, "Broadcast failed");
          ws.close();
        },
      });
    }
  }
}
