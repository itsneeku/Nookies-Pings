from scrapers.utils.base import ScrapedProduct, curl
from scrapers.utils.ssr import extract_next_ssr_data_html

patterns = ["walmart.ca"]


async def product(sku):
  response = curl(f"https://www.walmart.ca/en/ip/{sku}")

  data = extract_next_ssr_data_html(response.text)
  item = (
    data.get("props").get("pageProps").get("initialData").get("data").get("product")
  )

  sold_by_wm = item.get("sellerId") == "0"
  if not sold_by_wm:
    return None

  return ScrapedProduct(
    sku=item.get("usItemId"),
    url=f"https://www.walmart.ca/en/ip/Nookie/{item.get('usItemId')}",
    title=item.get("name"),
    inStock=item.get("availabilityStatusV2").get("value") == "IN_STOCK",
    price=item.get("priceInfo").get("currentPrice").get("price"),
    image=item.get("imageInfo").get("thumbnailUrl"),
  )
