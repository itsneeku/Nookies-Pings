from monitor.utils.ssr import (
  extract_next_ssr_data_zendriver,
)
import zendriver as zd
import asyncio


async def main(input):
  url = f"https://www.walmart.ca/en/ip/{input['sku']}"

  browser = await zd.start(
    headless=False,
  )
  page = await browser.get(url)

  data = await extract_next_ssr_data_zendriver(page)
  item = (
    data.get("props").get("pageProps").get("initialData").get("data").get("product")
  )

  sold_by_wm = item.get("sellerId") == "0"
  in_stock = item.get("availabilityStatusV2", {}).get("value") == "IN_STOCK"

  data = {
    "title": item.get("name"),
    "inStock": sold_by_wm and in_stock,
    "price": item.get("priceInfo", {}).get("currentPrice", {}).get("price"),
    "image": item.get("imageInfo", {}).get("thumbnailUrl"),
  }
  return data


if __name__ == "__main__":
  asyncio.run(main({"sku": "70PH2R4R8A83"}))
