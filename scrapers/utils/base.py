from dataclasses import dataclass
from typing import Optional
import ipaddress
import random
import curl_cffi


@dataclass
class ScrapedProduct:
  sku: str
  url: str
  title: str
  inStock: bool
  price: Optional[float] = None
  image: Optional[str] = None


def get_random_ipv6(subnet):
  """Generate a random IPv6 address from the subnet."""
  network = ipaddress.IPv6Network(subnet)
  net_addr_int = int(network.network_address)
  rand_bits = network.max_prefixlen - network.prefixlen
  rand_int = random.getrandbits(rand_bits)
  return str(ipaddress.IPv6Address(net_addr_int + rand_int))


def curl(url: str, impersonate="safari_ios"):
  subnet = None
  try:
    with open(".env") as f:
      for line in f:
        if line.startswith("IPV6_SUBNET="):
          subnet = line.split("=", 1)[1].strip().strip("'\"")
          break
  except FileNotFoundError:
    pass
  ip = get_random_ipv6(subnet) if subnet else None
  return curl_cffi.get(url, interface=ip, impersonate=impersonate, timeout=20)
