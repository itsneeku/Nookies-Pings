from dataclasses import dataclass, asdict
from typing import Optional
import ipaddress
import random


@dataclass
class Product:
  sku: str
  url: str
  title: str
  inStock: bool
  price: Optional[float] = None
  image: Optional[str] = None


@dataclass
class ProductMonitorResult:
  products: list[Product]


@dataclass
class SearchMonitorResult:
  newProducts: list[Product]


def get_random_ipv6():
  try:
    subnet = None
    with open(".env") as f:
      for line in f:
        if line.startswith("IPV6_SUBNET="):
          subnet = line.split("=", 1)[1].strip().strip("'\"")
          break

    network = ipaddress.IPv6Network(subnet)
    net_addr_int = int(network.network_address)
    rand_bits = network.max_prefixlen - network.prefixlen
    rand_int = random.getrandbits(rand_bits)
    return str(ipaddress.IPv6Address(net_addr_int + rand_int))
  except Exception:
    return None


def shouldNotify(prev: Product | None, curr: Product) -> bool:
  if prev is None:
    return True
  if not prev.inStock and curr.inStock:
    return True
  if prev.price != curr.price:
    return True
  return False
