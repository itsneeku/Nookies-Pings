from scrapers.utils.base import ScrapedProduct

patterns = ["store.com"]


async def product(sku):
    return ScrapedProduct(
        sku=sku,
        url="https://store.com/product/{}".format(sku),
        title="Product Title",
        in_stock=True,
        price=19.99,
        image="https://cataas.com/cat",
    )
