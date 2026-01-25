import { Result } from "better-result";
import { DurableObject } from "cloudflare:workers";

import { WebSocketError } from "@/lib/errors";

export class WebSocketServer extends DurableObject<Env> {
  override async fetch(_request: Request) {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    if (!server) return new Response(null, { status: 500 });

    this.ctx.acceptWebSocket(server);
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async broadcast(payload: unknown) {
    const websockets = this.ctx.getWebSockets();
    if (websockets.length === 0) return;

    const messageResult = Result.try({
      try: () => JSON.stringify(payload),
      catch: (e) => new WebSocketError({ operation: "JSON.stringify", cause: e }),
    });

    await messageResult.match({
      ok: async (message) => {
        for (const ws of websockets) {
          const sendResult = Result.try({
            try: () => ws.send(message),
            catch: (e) => new WebSocketError({ operation: "ws.send", cause: e }),
          });

          sendResult.match({
            ok: () => {},
            err: (err) => {
              console.error("[WebSocketServer] Broadcast error:", err.message);
              ws.close();
            },
          });
        }
      },
      err: async (err) => {
        console.error("[WebSocketServer] Broadcast error:", err.message);
      },
    });
  }
}
