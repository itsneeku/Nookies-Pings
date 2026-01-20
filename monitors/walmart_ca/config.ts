import { SlashCommandSubcommandGroupBuilder } from "discord.js";

export const group = new SlashCommandSubcommandGroupBuilder()
  .setName("walmart_ca")
  .setDescription("Walmart Canada")
  .addSubcommand((s) =>
    s
      .setName("search")
      .setDescription("Monitor a search URL")
      .addStringOption((o) =>
        o.setName("url").setDescription("Search URL").setRequired(true),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName("product")
      .setDescription("Monitor a product by SKU")
      .addStringOption((o) =>
        o.setName("sku").setDescription("Product SKU").setRequired(true),
      ),
  );

export const output = {
  search: {},
  product: {},
};
