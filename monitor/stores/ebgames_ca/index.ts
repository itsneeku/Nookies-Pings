import product from "./product";
import search from "./search";

export default {
  store: "ebgames_ca",
  description: "EBGames Canada",
  monitors: {
    search,
    product,
  } as const,
} satisfies Store;
