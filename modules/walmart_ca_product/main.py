import asyncio
from typing import TypedDict
import zendriver as zd

import utils
import utils.zendriver


class WalmartProduct(TypedDict):
  name: str
  sku: str
  price: float
  img: str
  url: str
  sold_by_wm: bool
  in_stock: bool


async def scrape(url: str):
  """
  Extract product data from a walmart specific product page's SSR data.
  """
  browser = await zd.start(headless=False)
  page = await browser.get(url)
  await page

  ssr_data = await utils.zendriver.extract_next_ssr_data(page)
  item = (
    ssr_data.get("props").get("pageProps").get("initialData").get("data").get("product")
  )

  utils.log("meow")

  product = WalmartProduct(
    name=item.get("name"),
    sku=item.get("usItemId"),
    price=item.get("priceInfo").get("currentPrice").get("price"),
    img=item.get("imageInfo").get("thumbnailUrl"),
    url=f"https://www.walmart.ca/en/ip/Nookie/{item.get('usItemId')}",
    sold_by_wm=item.get("sellerId") == "0",
    in_stock=item.get("availabilityStatusV2").get("value") == "IN_STOCK",
  )
  return product


async def main():
  input = utils.read_input()


if __name__ == "__main__":
  asyncio.run(main())
