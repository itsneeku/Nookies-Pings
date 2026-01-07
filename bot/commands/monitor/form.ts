import {
  ChannelSelectMenuInteraction,
  ChatInputCommandInteraction,
  codeBlock,
  InteractionCollector,
  MessageComponentInteraction,
  MessageFlags,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import {
  buildCRONModal,
  buildURLModal,
  MonitorFormBuilder,
} from "./builders.ts";
import { describeCron, ID } from "./data.ts";
import { addScrapingJob } from "$utils/queues.ts";
import { mkSafe } from "$utils/safe.ts";

export class MonitorForm {
  state: ScrapeJobForm = {
    loading: false,
    customSchedules: [
      {
        label: "Every 3 Minutes",
        description: "*/3 * * * *",
        value: "*/3 * * * *",
        emoji: "⏱️",
      },
      {
        label: "Custom",
        description: "Set a custom cron schedule",
        value: ID.SCHEDULE_CUSTOM,
        emoji: "⚡",
      },
    ],
  };
  collector?: InteractionCollector<any>;

  handlers: Record<
    string,
    (i: MessageComponentInteraction) => Promise<unknown>
  > = {
    [ID.BTN_EDIT_URL]: (i) => this.handleEditURL(i),
    [ID.SELECT_MODULE]: (i) => this.handleSelectModule(i),
    [ID.SELECT_CRON]: (i) => this.handleSelectCRON(i),
    [ID.SELECT_CHANNEL]: (i) => this.handleSelectChannel(i),
    [ID.SELECT_ROLE]: (i) => this.handleSelectRole(i),
    [ID.START]: (i) => this.handleSubmit(i),
  };

  async start(interaction: ChatInputCommandInteraction) {
    const reply = await interaction.reply({
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      components: [this.render()],
      withResponse: true,
    });

    this.collector = reply.resource?.message
      ?.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 15 * 60 * 1000,
      })
      ?.on("collect", async (i) => {
        const result = await mkSafe(this.handlers[i.customId])(i);
        if (result.isErr()) {
          console.error(
            "[MonitorForm] Error handling interaction:",
            result.error,
          );
        }
      });
  }

  render(statusMessage?: string) {
    return new MonitorFormBuilder(this.state)
      .addScraperSection()
      .addSeparatorLarge()
      .addURLSection()
      .addSeparatorLarge()
      .addScheduleSection()
      .addOutputSection()
      .addSeparatorLarge()
      .addSubmitSection()
      .addStatusMessageSection(statusMessage);
  }

  update(newState: Partial<ScrapeJobForm>) {
    this.state = { ...this.state, ...newState };
    return this;
  }

  async handleEditURL(i: MessageComponentInteraction) {
    await i.showModal(buildURLModal(this.state.url), { withResponse: true });
    const modalSubmission = await i
      .awaitModalSubmit({ time: 5 * 60 * 1000 })
      .catch(() => null);

    if (!modalSubmission || !modalSubmission.isFromMessage()) return;

    const url = modalSubmission.fields.getTextInputValue(ID.MODAL_INPUT_URL);

    await modalSubmission
      .update({ components: [this.update({ url }).render()] })
      .catch(() => null); // ignore zombie submissions
  }

  async handleSelectModule(i: MessageComponentInteraction) {
    await i.deferUpdate();
    this.update({ module: (i as StringSelectMenuInteraction).values[0] });
  }

  async handleSelectCRON(i: MessageComponentInteraction) {
    const selectedCron = (i as StringSelectMenuInteraction).values[0];
    if (selectedCron !== ID.SCHEDULE_CUSTOM) {
      await i.deferUpdate();
      return this.update({ cron: selectedCron });
    }

    await i.showModal(buildCRONModal(this.state.cron));
    await i.editReply({ components: [this.render()] }); // refresh ui

    const modalSubmission = await i
      .awaitModalSubmit({ time: 5 * 60 * 1000 })
      .catch(() => null);
    if (!modalSubmission || !modalSubmission.isFromMessage()) return;

    const customCron = modalSubmission.fields.getTextInputValue(
      ID.MODAL_INPUT_CRON,
    );

    const describedCron = describeCron(customCron);
    const statusMessage = describedCron.isErr()
      ? describedCron.error.message
      : undefined;

    if (
      describedCron.isOk() &&
      !this.state.customSchedules.some((s) => s.value === customCron)
    ) {
      this.state.customSchedules.push({
        label: `Custom: ${customCron}`,
        description: describedCron.value,
        value: customCron,
        emoji: "⚡",
      });

      this.update({ cron: customCron });
    }

    await modalSubmission
      .update({ components: [this.update({}).render(statusMessage)] })
      .catch(() => null); // ignore zombie submissions
  }

  async handleSelectChannel(i: MessageComponentInteraction) {
    await i.deferUpdate();
    this.update({ channelId: (i as ChannelSelectMenuInteraction).values[0] });
  }

  async handleSelectRole(i: MessageComponentInteraction) {
    await i.deferUpdate();
    this.update({ roleId: (i as RoleSelectMenuInteraction).values[0] });
  }

  async handleSubmit(i: MessageComponentInteraction) {
    await i.update({ components: [this.update({ loading: true }).render()] });
    const statusMessage = await i.followUp({
      flags: MessageFlags.Ephemeral,
      content: "⏳",
    });

    const result = await addScrapingJob(this.state as ScrapeJobData);

    await i.webhook.editMessage(statusMessage, {
      content: result.isErr()
        ? `❌
      ${codeBlock("json", JSON.stringify(result.error, null, 2))}`
        : `✅ Job ID: **${result.value.id}**
      ${codeBlock("json", JSON.stringify(result.value.data, null, 2))}`,
    });

    await i.editReply({
      components: [this.update({ loading: false }).render()],
    });
  }
}
