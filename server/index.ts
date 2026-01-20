import { InteractionType, InteractionResponseType } from "discord.js";
import { waitUntil } from "cloudflare:workers";
import { deferInteraction, verifyDiscordRequest } from "./utils";
import { commands } from "../commands";
import { WebSocketServer } from "./ws";

const WS_ID = ":3";

export default {
  async fetch(request, env) {
    // Handle WebSocket Upgrades
    if (request.headers.get("Upgrade") === "websocket") {
      const stub = env.DO.getByName(WS_ID);
      return stub.fetch(request);
    }

    // Verify Discord Request
    const interaction = await verifyDiscordRequest(request, env);
    if (!interaction) {
      return Response.json({ error: "Invalid Request" }, { status: 401 });
    }

    // Handle Interactions
    switch (interaction.type) {
      case InteractionType.Ping:
        return Response.json({ type: InteractionResponseType.Pong });

      case InteractionType.ApplicationCommand: {
        const command = commands.get(interaction.data.name);

        if (!command) {
          console.error(`Unknown command: ${interaction.data.name}`);
          return Response.json({ error: "Command not found" }, { status: 400 });
        }

        waitUntil(command.execute(interaction, env));
        return deferInteraction();
      }

      default:
        return Response.json({ error: "Unknown Interaction" }, { status: 400 });
    }
  },
} satisfies ExportedHandler<Env>;

export { WebSocketServer };
