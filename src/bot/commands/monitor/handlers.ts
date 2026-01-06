import {
  ChannelSelectMenuInteraction,
  codeBlock,
  MessageFlags,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import { ID } from "./data.ts";
import {
  buildCRONModal,
  buildMonitorContainer,
  buildURLModal,
} from "./builders.ts";
import { wrapAsync } from "$utils/safe.ts";
import { addScrapingJob } from "$utils/queues.ts";

export const handleInteraction = wrapAsync(_handleInteraction);

async function _handleInteraction(form: FormInteraction) {
  switch (form.i.customId) {
    case ID.BTN_EDIT_URL:
      return await handleEditURL(form);

    case ID.SELECT_MODULE:
      return await handleSelectModule(form);

    case ID.SELECT_CRON:
      return await handleSelectCRON(form);

    case ID.SELECT_CHANNEL:
      return await handleSelectChannel(form);

    case ID.SELECT_ROLE:
      return await handleSelectRole(form);

    case ID.START:
      return await handleSubmit(form);
  }
}

async function handleEditURL({ i, state }: FormInteraction) {
  await i.showModal(buildURLModal(state.url), { withResponse: true });

  const modalSubmission = await i
    .awaitModalSubmit({ time: 5 * 60 * 1000 })
    .catch(() => null);

  if (!modalSubmission || !modalSubmission.isFromMessage()) return;

  const url = modalSubmission.fields.getTextInputValue(ID.MODAL_INPUT_URL);

  return await modalSubmission
    .update({ components: [buildMonitorContainer({ ...state, url })] })
    .then(() => (state.url = url))
    .catch(() => null); // ignore zombie submissions
}

async function handleSelectModule({ i, state }: FormInteraction) {
  await i.deferUpdate();
  state.module = (i as StringSelectMenuInteraction).values[0];
}

async function handleSelectCRON({ i, state }: FormInteraction) {
  const cron = (i as StringSelectMenuInteraction).values[0];
  if ((i as StringSelectMenuInteraction).values[0] !== ID.SCHEDULE_CUSTOM) {
    await i.deferUpdate();
    return state.cron = cron;
  }

  await i.showModal(buildCRONModal(state.cron));
  await i.editReply({ components: [buildMonitorContainer(state)] }); // refresh ui

  const modalSubmission = await i
    .awaitModalSubmit({ time: 5 * 60 * 1000 })
    .catch(() => null);

  if (!modalSubmission || !modalSubmission.isFromMessage()) return;

  const newCron = modalSubmission.fields.getTextInputValue(ID.MODAL_INPUT_CRON);

  return await modalSubmission
    .update({
      components: [buildMonitorContainer({ ...state, cron: newCron })],
    })
    .then(() => (state.cron = newCron))
    .catch(() => null); // ignore zombie submissions
}

async function handleSelectChannel({ i, state }: FormInteraction) {
  await i.deferUpdate();
  state.channelId = (i as ChannelSelectMenuInteraction).values[0];
}

async function handleSelectRole({ i, state }: FormInteraction) {
  await i.deferUpdate();
  state.roleId = (i as RoleSelectMenuInteraction).values[0];
}

async function handleSubmit({ i, state }: FormInteraction) {
  await i.update({ components: [buildMonitorContainer(state, true)] });
  const statusMessage = await i.followUp({
    flags: MessageFlags.Ephemeral,
    content: "⏳",
  });

  const result = await addScrapingJob(state as ScrapeJobData);

  if (result.isErr()) {
    await i.webhook.editMessage(statusMessage, {
      content: `❌
      ${codeBlock("json", JSON.stringify(result.error, null, 2))}`,
    });
  } else {
    await i.webhook.editMessage(statusMessage, {
      content: `✅ Job ID: **${result.value.id}**
      ${codeBlock("json", JSON.stringify(result.value.data, null, 2))}`,
    });
  }

  await i.editReply({ components: [buildMonitorContainer(state)] });
}
