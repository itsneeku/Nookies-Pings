import { waitUntil } from "cloudflare:workers";
import { InteractionResponseType, InteractionType } from "discord.js";

import { commands } from "@/lib/discord";
import { logger } from "@/lib/logger";
import { deferInteraction, verifyDiscordRequest, updateInteraction } from "@/server/utils";
import { WebSocketServer } from "@/server/ws";

export default {
  async fetch(request, env) {
    // Handle WebSocket Upgrades
    if (request.headers.get("Upgrade") === "websocket") {
      return env.DO.getByName(env.WS_SERVER_ID).fetch(request);
    }

    // Verify Discord Request
    const verifyResult = await verifyDiscordRequest(request, env);
    if (verifyResult.isErr()) {
      logger.error({ error: verifyResult.error }, "Can't verify discord request");
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
          logger.error({ interaction }, "Unknown command");
          return Response.json({ error: "Command not found" }, { status: 400 });
        }

        waitUntil(
          (async () => {
            const result = await command.execute(interaction, env);
            if (result.isErr()) {
              logger.error(
                {
                  interaction,
                  error: result.error,
                },
                "Command execution failed",
              );
            }

            const updateResult = await updateInteraction(interaction, env, {
              content: result.isErr() ? "Something went wrong" : result.value,
            });

            if (updateResult.isErr())
              logger.error(
                {
                  interaction: interaction,
                  error: updateResult.error,
                },
                "Interaction update failed",
              );
          })(),
        );

        return deferInteraction();
      }

      default:
        logger.error({ interaction }, "Unknown interaction type");
        return Response.json({ error: "Unknown Interaction" }, { status: 400 });
    }
  },
} satisfies ExportedHandler<Env>;

export { WebSocketServer };
