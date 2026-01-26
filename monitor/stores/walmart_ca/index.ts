import product from "./product";
import search from "./search";

export default {
  name: "walmart_ca",
  description: "Walmart Canada",
  monitors: [product, search],
} satisfies Store;
