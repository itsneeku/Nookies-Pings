import { Result } from "better-result";
import { DurableObject } from "cloudflare:workers";

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

    const messageResult = Result.try({
      try: () => JSON.stringify(payload),
      catch: (e) => ({ op: "[WebSocketServer] JSON.stringify", cause: e }),
    });

    await messageResult.match({
      ok: async (message) => {
        for (const ws of websockets) {
          const sendResult = Result.try({
            try: () => ws.send(message),
            catch: (e) => ({ op: "[WebSocketServer] send", cause: e }),
          });

          sendResult.match({
            ok: () => {},
            err: (err) => {
              console.error("[WebSocketServer] Broadcast error:", err);
              ws.close();
            },
          });
        }
      },
      err: async (err) => {
        console.error("[WebSocketServer] Broadcast error:", err);
      },
    });
  }
}
