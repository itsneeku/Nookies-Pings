import { Result } from "better-result";
import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  REST,
  roleMention,
  Routes,
  TextDisplayBuilder,
} from "discord.js";

export const notify = (product: NotificationProduct) => {
  const message = new TextDisplayBuilder().setContent(
    `||${product.title} ${roleMention(product.role)}||`,
  );
  const container = new ContainerBuilder()
    .addSectionComponents((s) =>
      s
        .setThumbnailAccessory((th) =>
          th.setURL(product.image || "https://i.imgur.com/jbf4u4g.png"),
        )
        .addTextDisplayComponents(
          (text) => text.setContent(`## ${product.title}`),
          (text) => text.setContent(`**Price:** ${product.price}`),
          (text) => text.setContent(`**SKU:** ${product.sku}`),
        ),
    )
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setLabel("Product Page")
          .setStyle(ButtonStyle.Link)
          .setURL(encodeURI(product.url))
          .setEmoji("🔗"),
      ),
    )
    .addSeparatorComponents((s) => s.setDivider(true).setSpacing(1))
    .addTextDisplayComponents((text) => text.setContent(`-# ${encodeURI(product.url)}`));

  return Result.tryPromise({
    try: async () => {
      await new REST()
        .setToken(process.env.DISCORD_TOKEN)
        .post(Routes.channelMessages(product.channel), {
          body: {
            flags: MessageFlags.IsComponentsV2,
            components: [message, container],
          },
        });
    },
    catch: (cause) => ({ op: "[notify] execute", cause }),
  });
};

// export const notifyNewProduct = (product: NotificationProduct, search: TableRow) => {
//   const message = new TextDisplayBuilder().setContent(
//     `🆕 New product found ${roleMention(search.role as string)}: ${product.title}`,
//   );
//   const container = new ContainerBuilder()
//     .addSectionComponents((s) =>
//       s
//         .setThumbnailAccessory((th) =>
//           th.setURL(product.image || "https://i.imgur.com/jbf4u4g.png"),
//         )
//         .addTextDisplayComponents(
//           (text) => text.setContent(`## ${product.title}`),
//           (text) => text.setContent(`**Price:** ${product.price}`),
//           (text) => text.setContent(`**SKU:** ${product.sku}`),
//         ),
//     )
//     .addActionRowComponents((row) =>
//       row.addComponents(
//         new ButtonBuilder()
//           .setLabel("Product Page")
//           .setStyle(ButtonStyle.Link)
//           .setURL(encodeURI(product.url))
//           .setEmoji("🔗"),
//       ),
//     )
//     .addSeparatorComponents((s) => s.setDivider(true).setSpacing(1))
//     .addTextDisplayComponents((text) => text.setContent(`-# ${encodeURI(product.url)}`));

//   return Result.tryPromise({
//     try: async () => {
//       await new REST()
//         .setToken(process.env.DISCORD_TOKEN)
//         .post(Routes.channelMessages(search.channel as string), {
//           body: {
//             flags: MessageFlags.IsComponentsV2,
//             components: [message, container],
//           },
//         });
//     },
//     catch: (cause) => new DiscordError({ operation: "notifyNewProduct", cause }),
//   });
// };
