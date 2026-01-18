from scrapers.utils.base import ScrapedProduct
import zendriver as zd
import asyncio

CONFIG = zd.Config(
  headless=False,
  browser_args=[
    "--blink-settings=imagesEnabled=false",
  ],
)
PATTERNS = ["ebgames.ca"]


async def product_page(url):
  config = zd.Config(
    headless=False,
    browser_args=[
      "--blink-settings=imagesEnabled=false",
    ],
  )
  browser = await zd.start(config)
  page = browser.main_tab
  await page.send(zd.cdp.emulation.set_data_saver_override(data_saver_enabled=True))
  await page.get(url)
  await page.wait_for("body")

  res = ScrapedProduct(
    sku=(await page.select("body")).get("class_").split("-")[-1],
    url=(await page.query_selector('link[rel="canonical"]')).get("href"),
    title=(await page.select(".prodTitle")).text.strip(),
    inStock="Deliver to Home" in (await page.select(".productAvailabilityNew")).text,
    price=(await page.select("span.prodPriceCont")).text.replace("$", "").strip(),
    image=(await page.select("#packshotImage")).get("src"),
  )
  await browser.stop()
  return res


async def fetch(page: zd.Tab, sku: str):
  """
  Rate limited @ 500 queries/5 mins
  """
  response = await page.evaluate(
    f"""
        fetch('https://www.ebgames.ca/api2/product/getproductsbysku?skus[]={sku}', {{
            headers: {{"X-Requested-With": "XMLHttpRequest"}}
        }}).then(response => response.json())
        """,
    await_promise=True,
  )
  return response


async def get_product_sku(page: zd.Tab, url: str):
  await page.get(url)
  await page.wait_for_ready_state("complete")
  return (await page.select(".variantSku")).get("value")


async def main():
  browser = await zd.start(CONFIG)
  page = browser.main_tab
  await page.send(zd.cdp.emulation.set_data_saver_override(data_saver_enabled=True))
  sku = await get_product_sku(
    page,
    "https://www.ebgames.ca/Trading%20Cards/Games/961429/magic-the-gathering-teenage-mutant-ninja-turtles-booster-box",
  )
  result = await fetch(page, sku)
  print(result)
  await browser.stop()


if __name__ == "__main__":
  asyncio.run(main())
