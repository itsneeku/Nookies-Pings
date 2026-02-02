import walmart_ca_product from "@/monitor/stores/walmart_ca/product";

export const stores: Store[] = [
  {
    name: "walmart_ca",
    description: "Walmart Canada",
    monitors: [walmart_ca_product],
  },
];
