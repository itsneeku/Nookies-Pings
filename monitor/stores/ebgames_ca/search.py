from monitors._utils.base import Product, SearchMonitorResult
import zendriver as zd
import json
from selectolax.lexbor import LexborHTMLParser


async def main(input):
  url = input["url"]
  browser = await zd.start(headless=True)
  page = await browser.get(url)
  assert page is not None, "Failed to get browser page"
  await page.wait_for("body")

  html = await page.evaluate("document.body.innerHTML")
  assert html is not None, "Failed to get HTML"
  assert isinstance(html, str), "HTML is not a string"
  parser = LexborHTMLParser(html)

  new_products = []

  product_elements = parser.css(".product-item")

  for elem in product_elements:
    link = elem.css_first("a.product-link")
    if link:
      product_url = link.attrs.get("href")
      if product_url:
        if not product_url.startswith("http"):
          product_url = f"https://www.ebgames.ca{product_url}"

        sku = product_url.split("/")[-1]

        title = elem.css_first(".product-title")
        title_text = getattr(title, "text", "Unknown")
        if hasattr(title_text, "strip"):
          title_text = title_text.strip()

        product = Product(
          sku=sku,
          url=product_url,
          title=title_text,
          inStock=False,
        )
        new_products.append(product)

  await browser.stop()

  return SearchMonitorResult(newProducts=new_products)


# await fetch("https://www.ebgames.ca/SearchResult/QuickSearchAjax?q=Pok%C3%A9mon%20TCG&shippingMethod=1&rootGenre=99&typesorting=0&sdirection=ascending&skippos=24&takenum=24", {
#     "credentials": "include",
#     "headers": {
#         "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0",
#         "Accept": "*/*",
#         "Accept-Language": "en-US,en;q=0.5",
#         "X-NewRelic-ID": "Vw4FUFNRGwEEVlVTAwEF",
#         "X-Requested-With": "XMLHttpRequest",
#         "Sec-GPC": "1",
#         "Sec-Fetch-Dest": "empty",
#         "Sec-Fetch-Mode": "cors",
#         "Sec-Fetch-Site": "same-origin",
#         "Priority": "u=0"
#     },
#     "referrer": "https://www.ebgames.ca/SearchResult/QuickSearch?q=Pok%C3%A9mon%20TCG&shippingMethod=1&rootGenre=99",
#     "method": "POST",
#     "mode": "cors"
# });
