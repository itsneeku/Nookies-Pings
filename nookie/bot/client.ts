import {
  Client,
  ContainerBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
  RequestData,
  REST,
  Routes,
} from "discord.js";
import { readdir } from "fs/promises";
import { join } from "path";
import { pyGetStores } from "nookie/utils/py";

const intents = [GatewayIntentBits.Guilds];
const partials = [Partials.User, Partials.Channel, Partials.Message];

export class Bot {
  token: string = process.env.BOT_TOKEN!;
  commands: Record<string, Command> = {};
  stores: string[] = [];

  client = new Client({ intents, partials }).on(
    Events.InteractionCreate,
    async (i) => {
      if (i.isChatInputCommand()) {
        const command = this.commands[i.commandName];
        if (command) {
          await command.execute(i);
        }
      }
    }
  );

  async send(channelId: string, components: ContainerBuilder[]) {
    if (this.client.isReady()) {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased() || !channel.isSendable()) return;
      return channel.send({
        flags: MessageFlags.IsComponentsV2,
        components,
      });
    } else {
      return new REST({ version: "10" })
        .setToken(process.env.BOT_TOKEN!)
        .post(Routes.channelMessages(channelId), {
          body: {
            flags: MessageFlags.IsComponentsV2,
            components,
          },
        });
    }
  }

  async start() {
    await this.loadStores();
    console.log(`Loaded stores: ${this.stores.join(", ")}`);

    await this.loadCommands();
    console.log(`Loaded commands: ${Object.keys(this.commands).join(", ")}`);

    await this.client.login(process.env.BOT_TOKEN!);
    await this.deployCommands();
  }

  async loadStores() {
    this.stores = Object.keys(await pyGetStores());
  }

  async loadCommands() {
    const commandsPath = join(__dirname, "commands");
    const dirs = await readdir(commandsPath);
    for (const dir of dirs) {
      this.commands[dir] = (
        await import(join(commandsPath, dir, "index.ts"))
      ).cmd;
    }
  }

  async deployCommands() {
    await this.client.rest.put(
      Routes.applicationGuildCommands(
        this.client.application!.id,
        process.env.GUILD_ID!
      ),
      { body: Object.values(this.commands).map((c) => c.data.toJSON()) }
    );
  }
}

export const bot = new Bot();
