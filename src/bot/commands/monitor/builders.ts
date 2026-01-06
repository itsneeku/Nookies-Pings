import {
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  Colors,
  ContainerBuilder,
  ModalBuilder,
  RoleSelectMenuBuilder,
  SectionBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  TextInputStyle,
} from "discord.js";

import { getScheduleOptions, ID, MODULE_OPTIONS } from "./data.ts";

export const buildMonitorContainer = (state: ScrapeJobForm, loading = false) =>
  new ContainerBuilder()
    .setAccentColor(Colors.NotQuiteBlack)
    .addSectionComponents(buildURLSection(state, loading))
    .addSeparatorComponents((sep) =>
      sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Module"))
    .addActionRowComponents((row) =>
      row.addComponents(buildModuleSelect(state, loading))
    )
    .addSeparatorComponents((sep) =>
      sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents((text) => text.setContent("### Schedule"))
    .addActionRowComponents((row) =>
      row.addComponents(buildScheduleSelect(state, loading))
    )
    .addSeparatorComponents((sep) =>
      sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("### Channel"),
    )
    .addActionRowComponents((row) =>
      row.addComponents(buildChannelSelect(loading))
    )
    .addSeparatorComponents((sep) =>
      sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Role"))
    .addActionRowComponents((row) =>
      row.addComponents(buildRoleSelect(loading))
    )
    .addSeparatorComponents((sep) =>
      sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large)
    )
    .addActionRowComponents((row) =>
      row.addComponents(buildSubmitButton(loading))
    );

const buildURLSection = (state: ScrapeJobForm, loading: boolean) =>
  new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          "### URL",
          state.url ? `\`${state.url}\`` : "-# No URL configured",
        ].join("\n"),
      ),
    )
    .setButtonAccessory(
      new ButtonBuilder()
        .setCustomId(ID.BTN_EDIT_URL)
        .setLabel(" ")
        .setDisabled(loading)
        .setStyle(state.url ? ButtonStyle.Secondary : ButtonStyle.Danger)
        .setEmoji("✏️"),
    );

const buildModuleSelect = (state: ScrapeJobForm, loading: boolean) =>
  new StringSelectMenuBuilder()
    .setCustomId(ID.SELECT_MODULE)
    .setPlaceholder("Select a scraping module...")
    .setRequired(true)
    .setDisabled(loading)
    .addOptions(
      ...MODULE_OPTIONS.map((opt) =>
        opt.value === state.module ? { ...opt, default: true } : opt
      ),
    );

const buildScheduleSelect = (state: ScrapeJobForm, loading: boolean) =>
  new StringSelectMenuBuilder()
    .setCustomId(ID.SELECT_CRON)
    .setPlaceholder("Select a schedule...")
    .setRequired(true)
    .setDisabled(loading)
    .addOptions(...getScheduleOptions(state));

const buildChannelSelect = (loading: boolean) =>
  new ChannelSelectMenuBuilder()
    .setCustomId(ID.SELECT_CHANNEL)
    .setPlaceholder("Select a channel to ping...")
    .setRequired(true)
    .setDisabled(loading)
    .addChannelTypes(ChannelType.GuildText);

const buildRoleSelect = (loading: boolean) =>
  new RoleSelectMenuBuilder()
    .setCustomId(ID.SELECT_ROLE)
    .setPlaceholder("Select a role to ping...")
    .setDisabled(loading)
    .setRequired(true);

const buildSubmitButton = (loading: boolean) =>
  new ButtonBuilder()
    .setCustomId(ID.START)
    .setLabel("Monitor")
    .setStyle(ButtonStyle.Success)
    .setEmoji("✅")
    .setDisabled(loading);

export const buildURLModal = (val?: string) =>
  new ModalBuilder()
    .setCustomId(ID.MODAL_URL)
    .setTitle("🔗 Product URL")
    .addLabelComponents((label) =>
      label.setLabel("Product URL").setTextInputComponent((input) =>
        input
          .setCustomId(ID.MODAL_INPUT_URL)
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("https://example.com/")
          .setRequired(true)
          .setValue(val ?? "")
      )
    );

export const buildCRONModal = (val?: string) =>
  new ModalBuilder()
    .setCustomId(ID.MODAL_CRON)
    .setTitle("⏰ Set Cron Schedule")
    .addTextDisplayComponents((text) =>
      text.setContent(
        "For help creating cron expressions, see [crontab.guru](https://crontab.guru/)",
      )
    )
    .addLabelComponents((label) =>
      label.setLabel("Cron Expression").setTextInputComponent((input) =>
        input
          .setCustomId(ID.MODAL_INPUT_CRON)
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("*/5 * * * *")
          .setRequired(true)
          .setValue(val ?? "")
      )
    );
