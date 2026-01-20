from monitors._utils.base import ScrapedProduct
from monitors._utils.ssr import extract_next_ssr_data_zendriver
import zendriver as zd


async def main(url):
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
    ScrapedProduct(
      sku=p.get("usItemId"),
      url=f"https://www.walmart.ca/en/ip/Nookie/{p.get('usItemId')}",
      title=p.get("name"),
      inStock=p.get("sellerId") == "0"
      and p.get("availabilityStatusV2").get("value") == "IN_STOCK",
      price=p.get("price"),
      image=p.get("imageInfo").get("thumbnailUrl"),
    )
    for p in items
  ]

#   'walmart': 'https://www.walmart.ca/en/browse/toys/trading-cards/pokemon-cards/10011_31745_6000204969672?facet=retailer_type%3AWalmart',
