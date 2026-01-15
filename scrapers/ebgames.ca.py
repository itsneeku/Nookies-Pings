from scrapers.utils.base import ScrapedProduct
import zendriver as zd
import asyncio

patterns = ["ebgames.ca"]


# product id != sku
# product id is the page identifier (https://www.ebgames.ca/Trading%20Cards/Games/941649/)
# sku is the product code (803752) (we dont care about it)
async def product(url):
  browser = await zd.start(headless=True)
  page = await browser.get(url)
  await page
  await page.select("body")

  return ScrapedProduct(
    sku=(await page.select("body")).get("class_").split("-")[-1],
    url=(await page.query_selector('link[rel="canonical"]')).get("href"),
    title=(await page.select(".prodTitle")).text.strip(),
    inStock="Deliver to Home" in (await page.select(".productAvailabilityNew")).text,
    price=(await page.select("span.pricetext")).text.replace("$", "").strip(),
    image=(await page.select("#packshotImage")).get("src"),
  )


async def main():
  print(await product("https://www.ebgames.ca/Trading%20Cards/Games/941968"))
  print(await product("https://www.ebgames.ca/Trading Cards/Games/941968"))
  print(
    await product(
      "https://www.ebgames.ca/Trading%20Cards/Games/941968/pokemon-trading-card-game-mega-venusaur-ex-premium-collection-french"
    )
  )


if __name__ == "__main__":
  asyncio.run(main())
