import { waitUntil } from "cloudflare:workers";
import { InteractionResponseType, InteractionType } from "discord.js";

import { commands } from "@/lib/discord/commands";

import { deferInteraction, verifyDiscordRequest, updateInteraction } from "./utils";
import { WebSocketServer } from "./ws";

export default {
  async fetch(request, env) {
    // Handle WebSocket Upgrades
    if (request.headers.get("Upgrade") === "websocket") {
      return env.DO.getByName(env.WS_SERVER_ID).fetch(request);
    }

    // Verify Discord Request
    const verifyResult = await verifyDiscordRequest(request, env);

    if (verifyResult.isErr()) {
      console.error("Request validation failed:", verifyResult.error);
      return Response.json({ error: "Invalid Request" }, { status: 401 });
    }

    // Handle Interactions
    const interaction = verifyResult.value;

    switch (interaction.type) {
      case InteractionType.Ping:
        return Response.json({ type: InteractionResponseType.Pong });

      case InteractionType.ApplicationCommand: {
        const command = commands[interaction.data.name as keyof typeof commands];

        if (!command) {
          console.error(`Unknown command: ${interaction.data.name}`);
          return Response.json({ error: "Command not found" }, { status: 400 });
        }

        waitUntil(
          (async () => {
            const result = await command.execute(interaction, env);

            if (result.isErr()) console.error("Command execution failed:", result.error);

            const updateResult = await updateInteraction(interaction, env, {
              content: result.isErr() ? "An unexpected error occurred" : result.value,
            });

            if (updateResult.isErr())
              console.error("Failed to update interaction:", updateResult.error);
          })(),
        );

        return deferInteraction();
      }

      default:
        return Response.json({ error: "Unknown Interaction" }, { status: 400 });
    }
  },
} satisfies ExportedHandler<Env>;

export { WebSocketServer };
