import {
  MessageComponentInteraction,
  TextDisplayBuilder,
  APIMessageComponent,
} from "discord.js";
import { addScrapingJob } from "nookie/utils/queue";

const updateWithText = (
  interaction: MessageComponentInteraction,
  content: string
) =>
  interaction.update({
    components: [
      new TextDisplayBuilder()
        .setContent(content)
        .toJSON() as APIMessageComponent,
    ],
  });

export const handleConfirm = async (
  interaction: MessageComponentInteraction,
  data: MonitorJobData
) => {
  await addScrapingJob(data);
  await updateWithText(
    interaction,
    `Monitoring started for ${data.store} - ${data.sku}`
  );
};

export const handleCancel = async (
  interaction: MessageComponentInteraction
) => {
  await updateWithText(interaction, "Monitoring cancelled");
};
