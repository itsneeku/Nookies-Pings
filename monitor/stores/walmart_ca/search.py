from monitor.utils.ssr import extract_next_ssr_data_zendriver
import zendriver as zd


async def main(input):
  url = input["url"]
  browser = await zd.start(headless=True)
  page = await browser.get(url)
  await page

  ssr_data = await extract_next_ssr_data_zendriver(page)
  items = (
    ssr_data.get("props")
    .get("pageProps")
    .get("initialData")
    .get("searchResult")
    .get("itemStacks")[0]
    .get("items")
  )

  return [
    {
      "sku": p.get("usItemId"),
      "url": f"https://www.walmart.ca/en/ip/{p.get('usItemId')}",
      "title": p.get("name"),
      "inStock": 1
      if p.get("sellerId") == "0"
      and p.get("availabilityStatusV2").get("value") == "IN_STOCK"
      else 0,
      "price": p.get("price"),
      "image": p.get("imageInfo").get("thumbnailUrl"),
    }
    for p in items
  ]
