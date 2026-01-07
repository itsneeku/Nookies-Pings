import { mkSafe } from "$utils/safe.ts";
import {
  Client,
  Events,
  GatewayIntentBits,
  Interaction,
  Partials,
  Routes,
  SendableChannels,
  Snowflake,
} from "discord.js";
import { err, ok, safeTry } from "neverthrow";
import { loadCommands, loadModules } from "$utils/load.ts";
import { dirname, join } from "@std/path";
import { fromFileUrl } from "@std/path/from-file-url";

const intents = [GatewayIntentBits.Guilds];
const partials = [Partials.User, Partials.Channel, Partials.Message];

class Bot {
  commands = new Map<string, Command>();
  scrapingModules = new Map<string, ScrapingModule>();
  client = new Client({ intents, partials });

  constructor() {
    this.client.on(Events.InteractionCreate, this.handleInteractionCreate);

    this.client.once(
      Events.ClientReady,
      (c) => console.log(`[Bot] Ready: ${c.user.tag}`),
    );
  }

  handleInteractionCreate = async (i: Interaction) => {
    const result = i.isChatInputCommand()
      ? await mkSafe(this.commands.get(i.commandName)!, "execute")(i)
      : null;
    if (result?.isErr()) {
      console.error("[Bot] Error handling interaction:", result.error);
    }
  };

  start = () =>
    safeTry(async function* (this: Bot) {
      this.commands = yield* await loadCommands();
      console.log("[Bot] Loaded:", Array.from(this.commands.keys()));

      this.scrapingModules = yield* await loadModules();
      console.log("[Bot] Loaded:", Array.from(this.scrapingModules.keys()));

      yield* await this.login(Deno.env.get("BOT_TOKEN"));
      yield* await this.deployCommands(Deno.env.get("GUILD_ID")!);
      return ok(this);
    }.bind(this));

  ping = (channelId: Snowflake) =>
    safeTry(async function* (this: Bot) {
      const channel = yield* await this.fetchChannels(channelId);
      return !channel.isSendable()
        ? err(`Cannot send to channel: ${channelId}`)
        : this.sendToChannel(channel, Date());
    }.bind(this));

  deployCommands = (guildId: Snowflake) =>
    this.rest.PUT(
      Routes.applicationGuildCommands(this.client.application!.id, guildId),
      {
        body: Array.from(this.commands.values(), (cmd) => cmd.data.toJSON()),
      },
    );

  fetchChannels = (...args: Parameters<typeof this.client.channels.fetch>) =>
    mkSafe(this.client.channels, "fetch")(...args)
      .andThen((ch) => ch ? ok(ch) : err("Channel not found"));

  sendToChannel = (
    ch: SendableChannels,
    ...args: Parameters<SendableChannels["send"]>
  ) => mkSafe(ch, "send")(...args);

  login = mkSafe(this.client, "login");

  rest = {
    GET: mkSafe(this.client.rest, "get"),
    POST: mkSafe(this.client.rest, "post"),
    PUT: mkSafe(this.client.rest, "put"),
    DELETE: mkSafe(this.client.rest, "delete"),
    PATCH: mkSafe(this.client.rest, "patch"),
  };
}

export const bot = new Bot();
