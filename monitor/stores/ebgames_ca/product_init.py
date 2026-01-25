from monitors._utils.base import Product
import zendriver as zd
import json

CONFIG = zd.Config(
  headless=False,
  browser_args=[
    "--blink-settings=imagesEnabled=false",
  ],
)


async def get_product_sku(page: zd.Tab, url: str):
  await page.get(url)
  await page.wait_for_ready_state("complete")
  elem = await page.select(".variantSku")
  assert elem is not None, "SKU element not found"
  return elem.attrs.value


async def main(input):
  url = input["url"]
  browser = await zd.start(CONFIG)
  page = browser.main_tab
  assert page is not None, "Failed to get browser page"

  try:
    sku = await get_product_sku(page, url)

    result = {
      "internal_sku": sku,
    }

    print(json.dumps(result))
    return result
  finally:
    await browser.stop()
