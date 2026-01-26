from monitor.utils.base import get_random_ipv6
from monitor.utils.ssr import (
  extract_next_ssr_data_html,
  extract_next_ssr_data_zendriver,
)
import zendriver as zd
import curl_cffi


async def main(input):
  url = f"https://www.walmart.ca/en/ip/{input['sku']}"
  data = None
  response = curl_cffi.get(
    url, interface=get_random_ipv6(), impersonate="safari_ios", timeout=20
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

  return {
    "title": item.get("name"),
    "inStock": 1
    if sold_by_wm and item.get("availabilityStatusV2").get("value") == "IN_STOCK"
    else 0,
    "price": item.get("priceInfo").get("currentPrice").get("price"),
    "image": item.get("imageInfo").get("thumbnailUrl"),
  }
