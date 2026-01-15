from scrapers.utils.base import ScrapedProduct, curl_interface
from scrapers.utils.ssr import (
  extract_next_ssr_data_html,
  extract_next_ssr_data_zendriver,
)
import zendriver as zd
import curl_cffi

patterns = ["walmart.ca"]


async def product(sku):
  url = f"https://www.walmart.ca/en/ip/{sku}"
  data = None
  response = curl_cffi.get(
    url, interface=curl_interface(), impersonate="safari_ios", timeout=20
  )

  if response.status_code == 200:
    data = extract_next_ssr_data_html(response.text)
  else:
    browser = await zd.start(headless=True)
    page = await browser.get(url)
    await page
    data = await extract_next_ssr_data_zendriver(page)

  item = (
    data.get("props").get("pageProps").get("initialData").get("data").get("product")
  )
  sold_by_wm = item.get("sellerId") == "0"

  return ScrapedProduct(
    sku=item.get("usItemId"),
    url=f"https://www.walmart.ca/en/ip/Nookie/{item.get('usItemId')}",
    title=item.get("name"),
    inStock=sold_by_wm and item.get("availabilityStatusV2").get("value") == "IN_STOCK",
    price=item.get("priceInfo").get("currentPrice").get("price"),
    image=item.get("imageInfo").get("thumbnailUrl"),
  )


async def search(url):
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
