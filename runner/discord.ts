import {
  APIApplicationCommandInteraction,
  APIInteraction,
  APIInteractionResponse,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  InteractionResponseType,
  MessageFlags,
  REST,
  RESTGetCurrentApplicationResult,
  roleMention,
  Routes,
  TextDisplayBuilder,
} from "discord.js";

const getPubKey = async () =>
  (
    (await new REST()
      .setToken(process.env.DISCORD_TOKEN)
      .get(Routes.currentApplication())) as RESTGetCurrentApplicationResult
  ).verify_key;

export const notify = async (
  job: MonitorJobTableRow,
  result: ScrapedProduct
) => {
  const message = new TextDisplayBuilder().setContent(
    `||${result.title} ${roleMention(job.roleId)}||`
  );
  const container = new ContainerBuilder()
    .addSectionComponents((s) =>
      s
        .setThumbnailAccessory((th) =>
          th.setURL(result.image || "https://i.imgur.com/jbf4u4g.png")
        )
        .addTextDisplayComponents(
          (text) => text.setContent(`## ${result.title}`),
          (text) => text.setContent(`**Price:** ${result.price}`),
          (text) => text.setContent(`**SKU:** ${result.sku}`)
        )
    )
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setLabel("Product Page")
          .setStyle(ButtonStyle.Link)
          .setURL(encodeURI(result.url))
          .setEmoji("🔗")
      )
    )
    .addSeparatorComponents((s) => s.setDivider(true).setSpacing(1))
    .addTextDisplayComponents((text) =>
      text.setContent(`-# ${encodeURI(result.url)}`)
    );

  await new REST()
    .setToken(process.env.DISCORD_TOKEN)
    .post(Routes.channelMessages(job.channelId), {
      body: {
        flags: MessageFlags.IsComponentsV2,
        components: [message, container],
      },
    });
};
