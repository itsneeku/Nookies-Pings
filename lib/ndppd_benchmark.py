from curl_cffi import requests
import random
import ipaddress
import concurrent.futures
import time

TARGET_URL = "http://ifconfig.co/ip"
IPV6_SUBNET = None
try:
  with open(".env") as f:
    for line in f:
      if line.startswith("IPV6_SUBNET="):
        IPV6_SUBNET = line.split("=", 1)[1].strip().strip("'\"")
        break
except FileNotFoundError:
  pass


def get_random_ipv6():
  network = ipaddress.IPv6Network(IPV6_SUBNET)
  net_addr_int = int(network.network_address)
  rand_bits = network.max_prefixlen - network.prefixlen
  rand_int = random.getrandbits(rand_bits)
  return str(ipaddress.IPv6Address(net_addr_int + rand_int))


def request(url, randomize=False):
  time.sleep(random.uniform(0.0, 1.0))
  start_time = time.perf_counter()
  try:
    resp = requests.get(
      url,
      impersonate="chrome",
      interface=get_random_ipv6() if randomize else None,
      timeout=20,
    )
    duration = time.perf_counter() - start_time
    print(f"{resp.status_code} | {duration:.4f}s | Response: {resp.text.strip()}")
  except Exception as e:
    return f"Error: {str(e)[:50]}...", time.perf_counter() - start_time


if __name__ == "__main__":
  print(f"Target: {TARGET_URL}")
  print(f"Subnet: {IPV6_SUBNET}")
  print("-" * 60)

  print("Running Normal requests...")
  with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    futures = [executor.submit(request, TARGET_URL) for _ in range(5)]
    concurrent.futures.wait(futures)

  print("-" * 60)

  print("Running Random requests...")
  with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    futures = [executor.submit(request, TARGET_URL, randomize=True) for _ in range(50)]
    concurrent.futures.wait(futures)
