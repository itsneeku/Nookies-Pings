import {
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  Colors,
  ContainerBuilder,
  ModalBuilder,
  RoleSelectMenuBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  TextInputStyle,
} from "discord.js";

import { ID } from "./data.ts";
import { bot } from "../../bot.ts";

export class MonitorFormBuilder extends ContainerBuilder {
  constructor(private state: ScrapeJobForm) {
    super();
    this.setAccentColor(Colors.NotQuiteBlack);
  }

  selectScraper() {
    return new StringSelectMenuBuilder()
      .setCustomId(ID.SELECT_MODULE)
      .setPlaceholder("Select a scraping module...")
      .setRequired(true)
      .setDisabled(this.state.loading)
      .addOptions(
        ...Array.from(bot.scrapingModules.keys()).map((mod) => ({
          label: mod,
          description: `${mod}`,
          value: mod,
          emoji: "⚡",
          default: mod === this.state.module,
        })),
      );
  }

  selectSchedule() {
    return new StringSelectMenuBuilder()
      .setCustomId(ID.SELECT_CRON)
      .setPlaceholder("Select a schedule...")
      .setRequired(true)
      .setDisabled(this.state.loading)
      .addOptions(
        this.state.customSchedules.map((
          opt,
        ) => (opt.value === this.state.cron ? { ...opt, default: true } : opt)),
      );
  }

  selectChannel() {
    return new ChannelSelectMenuBuilder()
      .setCustomId(ID.SELECT_CHANNEL)
      .setPlaceholder("Select a channel to ping...")
      .setRequired(true)
      .setDisabled(this.state.loading)
      .addChannelTypes(ChannelType.GuildText);
  }

  selectRole() {
    return new RoleSelectMenuBuilder()
      .setCustomId(ID.SELECT_ROLE)
      .setPlaceholder("Select a role to ping...")
      .setDisabled(this.state.loading)
      .setRequired(true);
  }

  submitButton() {
    return new ButtonBuilder()
      .setCustomId(ID.START)
      .setLabel("Monitor")
      .setStyle(ButtonStyle.Success)
      .setEmoji("✅")
      .setDisabled(this.state.loading);
  }

  addScraperSection() {
    this.addTextDisplayComponents((t) => t.setContent("### Module"));
    this.addActionRowComponents((row) =>
      row.addComponents(this.selectScraper())
    );
    return this;
  }

  addURLSection() {
    const { url } = this.state;
    return this.addSectionComponents((s) =>
      s.addTextDisplayComponents((t) =>
        t.setContent(`### URL\n${url ? `\`${url}\`` : "-# No URL configured"}`)
      ).setButtonAccessory(
        new ButtonBuilder()
          .setCustomId(ID.BTN_EDIT_URL)
          .setLabel(" ")
          .setDisabled(this.state.loading)
          .setStyle(url ? ButtonStyle.Secondary : ButtonStyle.Danger)
          .setEmoji("✏️"),
      )
    );
  }

  addScheduleSection() {
    this.addTextDisplayComponents((t) => t.setContent("### Schedule"));
    this.addActionRowComponents((row) =>
      row.addComponents(this.selectSchedule())
    );
    this.addSeparatorSmall();
    return this;
  }

  addOutputSection() {
    this.addTextDisplayComponents((t) => t.setContent("### Channel"));
    this.addActionRowComponents((row) =>
      row.addComponents(this.selectChannel())
    );
    this.addSeparatorSmall();
    this.addTextDisplayComponents((t) => t.setContent("### Role"));
    this.addActionRowComponents((row) => row.addComponents(this.selectRole()));
    return this;
  }

  addSubmitSection() {
    return this.addActionRowComponents((row) =>
      row.addComponents(this.submitButton())
    );
  }

  addStatusMessageSection(statusMessage?: string) {
    return statusMessage
      ? this.addTextDisplayComponents((t) => t.setContent(statusMessage))
      : this;
  }

  addSeparatorSmall() {
    return this.addSeparatorComponents((s) =>
      s.setDivider(false).setSpacing(SeparatorSpacingSize.Small)
    );
  }

  addSeparatorLarge() {
    return this.addSeparatorComponents((s) =>
      s.setDivider(true).setSpacing(SeparatorSpacingSize.Large)
    );
  }
}

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
    .addTextDisplayComponents((t) =>
      t.setContent(
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
