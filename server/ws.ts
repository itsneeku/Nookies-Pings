import { DurableObject } from "cloudflare:workers";

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

    const message = JSON.stringify(payload);

    for (const ws of websockets) {
      try {
        ws.send(message);
      } catch (err) {
        console.error("[WebSocketServer] Broadcast error:", err);
        ws.close();
      }
    }
  }
}
