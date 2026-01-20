from dataclasses import dataclass
from typing import Optional
import ipaddress
import random


@dataclass
class ScrapedProduct:
  sku: str
  url: str
  title: str
  inStock: bool
  price: Optional[float] = None
  image: Optional[str] = None
  shouldNotify: bool = False


def get_random_ipv6():
  """Generate a random IPv6 address from the subnet."""
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


def shouldNotify(prev: ScrapedProduct, curr: ScrapedProduct):
  return (
    (not prev)
    or (not prev.inStock and curr.inStock)
    or (prev.price and curr.price and curr.price < prev.price)
  )
