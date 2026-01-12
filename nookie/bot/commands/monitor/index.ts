import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  RoleSelectMenuBuilder,
  ChannelSelectMenuInteraction,
  RoleSelectMenuInteraction,
} from "discord.js";
import { bot } from "nookie/bot/client";
import { handleConfirm, handleCancel } from "./handle";

const ID = {
  STORE: "store",
  SKU: "sku",
  MAX_PRICE: "max_price",
  CRON: "cron",
  CHANNEL: "channel",
  ROLE: "role",
} as const;

const getButtons = (disabled: boolean) => [
  new ButtonBuilder()
    .setCustomId("confirm_monitor")
    .setLabel("Confirm")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled),
  new ButtonBuilder()
    .setCustomId("cancel_monitor")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary),
];

const buildContainer = (selections: {
  channelId: string | null;
  roleId: string | null;
}) =>
  new ContainerBuilder().addActionRowComponents(
    (row) =>
      row.addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(ID.CHANNEL)
          .setPlaceholder("Select a channel...")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      ),
    (row) =>
      row.addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(ID.ROLE)
          .setPlaceholder("Select a role...")
          .setRequired(true)
      ),
    (row) =>
      row.addComponents(
        getButtons(selections.channelId === null || selections.roleId === null)
      )
  );

export const cmd: Command = {
  data: new SlashCommandBuilder()
    .setName("monitor")
    .setDescription("Monitor a product")
    .addStringOption((o) =>
      o
        .setName(ID.STORE)
        .setDescription("Store Name")
        .setChoices(bot.stores.map((s) => ({ name: s, value: s })))
        .setRequired(true)
    )
    .addStringOption((o) =>
      o.setName(ID.SKU).setDescription("Product SKU").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName(ID.MAX_PRICE).setDescription("Maximum Price")
    )
    .addStringOption((o) =>
      o.setName(ID.CRON).setDescription("Custom cron pattern")
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction
      .deferReply({ flags: MessageFlags.Ephemeral })
      .catch(() => {});

    const options = {
      store: interaction.options.getString(ID.STORE, true),
      sku: interaction.options.getString(ID.SKU, true),
      maxPrice: interaction.options.getString(ID.MAX_PRICE)
        ? parseFloat(interaction.options.getString(ID.MAX_PRICE)!)
        : undefined,
      cron: interaction.options.getString(ID.CRON) || "*/1 * * * *",
    };

    const selections = {
      channelId: null as string | null,
      roleId: null as string | null,
    };

    const reply = await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [buildContainer(selections)],
    });

    reply
      .createMessageComponentCollector({
        time: 5 * 60_000,
      })
      .on("collect", async (i) => {
        switch (i.customId) {
          case ID.CHANNEL:
            selections.channelId =
              (i as ChannelSelectMenuInteraction).channels.first()?.id ?? null;
            return i.update({ components: [buildContainer(selections)] });

          case ID.ROLE:
            selections.roleId =
              (i as RoleSelectMenuInteraction).roles.first()?.id ?? null;
            return i.update({ components: [buildContainer(selections)] });

          case "confirm_monitor":
            if (selections.channelId && selections.roleId) {
              return handleConfirm(i, {
                ...options,
                method: "product",
                channelId: selections.channelId,
                roleId: selections.roleId,
              });
            }
            break;

          case "cancel_monitor":
            return handleCancel(i);
        }
      });
  },
};
