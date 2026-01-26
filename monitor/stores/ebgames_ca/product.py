from monitor.utils.base import Product
import zendriver as zd
import asyncio

CONFIG = zd.Config(
  headless=False,
  browser_args=[
    "--blink-settings=imagesEnabled=false",
  ],
)


async def scrape_product_page(page: zd.Tab):
  await page.wait_for("body")

  body = await page.select("body")
  bodyClass = body.attrs.class_
  sku = bodyClass.split("-")[-1]

  urlLink = await page.select('link[rel="canonical"]')
  url = urlLink.attrs.href

  titleElem = await page.select(".prodTitle")
  title = titleElem.text.strip()

  stockStatusElem = await page.select(".productAvailabilityNew")
  inStock = "Deliver to Home" in stockStatusElem.text

  priceElem = await page.select("span.prodPriceCont")
  price = float(priceElem.text.replace("$", "").strip())

  imageElem = await page.select("#packshotImage")
  image = imageElem.attrs.src

  return Product(
    sku,
    url,
    title,
    inStock,
    price,
    image,
  )


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
  await page.wait_for_ready_state("complete")  # wait for cf challenge
  return (await page.select(".variantSku")).attrs.value


async def main(input):
  url = input["url"]
  browser = await zd.start(CONFIG)
  page = browser.main_tab
  await page.send(zd.cdp.emulation.set_data_saver_override(data_saver_enabled=True))
  sku = await get_product_sku(page, url)
  result = await fetch(page, sku)
  print(result)
  await browser.stop()
