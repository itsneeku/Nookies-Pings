from dataclasses import dataclass
from typing import Optional


@dataclass
class ScrapedProduct:
  sku: str
  url: str
  title: str
  inStock: bool
  price: Optional[float] = None
  image: Optional[str] = None
