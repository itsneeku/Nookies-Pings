from monitors._utils.base import Product, shouldNotify, ProductMonitorResult
import zendriver as zd
import json

CONFIG = zd.Config(
  headless=False,
  browser_args=[
    "--blink-settings=imagesEnabled=false",
  ],
)


async def fetch(page: zd.Tab, skus: list[str]) -> list[dict]:
  sku_list = ",".join(skus)
  result = await page.evaluate(
    f"""
        fetch('https://www.ebgames.ca/api2/product/getproductsbysku?skus[]={sku_list}', {{
            headers: {{"X-Requested-With": "XMLHttpRequest"}}
        }}).then(response => response.json())
        """,
    await_promise=True,
  )
  assert result is not None, "Failed to fetch products"
  return result if isinstance(result, list) else []


async def parse_product(item: dict) -> Product:
  sku = item.get("sku")
  url = item.get("url")
  name = item.get("name")
  assert sku is not None, "SKU not found in product data"
  assert url is not None, "URL not found in product data"
  assert name is not None, "Name not found in product data"

  return Product(
    sku=sku,
    url=url,
    title=name,
    inStock=item.get("inStock", False),
    price=float(item.get("price", 0)) if item.get("price") else None,
    image=item.get("image"),
  )


async def main(input):
  products = input["products"]

  skus = [p["internal_sku"] for p in products if p.get("internal_sku")]

  if not skus:
    return ProductMonitorResult(products=[])

  skus = skus[:500]

  browser = await zd.start(CONFIG)
  page = browser.main_tab
  assert page is not None, "Failed to get browser page"

  try:
    api_data = await fetch(page, skus)

    curr_products = {}
    for item in api_data:
      product = await parse_product(item)
      curr_products[product.sku] = product

    prev_products = {}
    for p in products:
      if p.get("internal_sku"):
        prev = Product(
          sku=p.get("sku", ""),
          url=p.get("url", ""),
          title=p.get("title") or "",
          inStock=p.get("inStock", False),
          price=p.get("price"),
          image=p.get("image"),
        )
        prev_products[p["internal_sku"]] = prev

    result = []
    for internal_sku, curr in curr_products.items():
      prev = prev_products.get(internal_sku)
      curr.shouldNotify = shouldNotify(prev, curr)
      result.append(curr)

    return ProductMonitorResult(products=result)

  finally:
    await browser.stop()
