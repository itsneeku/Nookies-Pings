import argparse
import subprocess
import sys
import os
import ipaddress
import tempfile


class Colors:
  HEADER = "\033[95m"
  BLUE = "\033[94m"
  GREEN = "\033[92m"
  WARNING = "\033[93m"
  FAIL = "\033[91m"
  ENDC = "\033[0m"
  BOLD = "\033[1m"


def log_info(msg):
  print(f"{Colors.BLUE}[i]{Colors.ENDC} {msg}")


def log_success(msg):
  print(f"{Colors.GREEN}[+]{Colors.ENDC} {msg}")


def log_fail(msg):
  print(f"{Colors.FAIL}[!]{Colors.ENDC} {msg}")


def manage_env(subnet=None, remove=False):
  """Adds or removes IPV6_SUBNET from .env without touching other vars."""
  lines = []
  if os.path.exists(".env"):
    with open(".env", "r") as f:
      lines = f.readlines()

  # Filter out any existing IPV6_SUBNET line
  lines = [l for l in lines if not l.strip().startswith("IPV6_SUBNET=")]

  if not remove and subnet:
    if lines and not lines[-1].endswith("\n"):
      lines[-1] += "\n"
    lines.append(f"IPV6_SUBNET='{subnet}'\n")

  with open(".env", "w") as f:
    f.writelines(lines)


def get_ipv6_candidates():
  candidates = set()
  try:
    cmd = ["ip", "-6", "-o", "addr", "show", "scope", "global"]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)

    for line in result.stdout.splitlines():
      parts = line.split()
      if len(parts) < 4:
        continue

      interface = parts[1]
      cidr_str = parts[3]

      try:
        if_addr = ipaddress.IPv6Interface(cidr_str)
        if if_addr.network.prefixlen == 64:
          candidates.add((interface, str(if_addr.network)))
      except ValueError:
        continue

  except subprocess.CalledProcessError:
    log_fail("Failed to query network interfaces.")
    sys.exit(1)

  return sorted(list(candidates))


def main():
  if os.geteuid() != 0:
    log_fail("Must be run as root.")
    sys.exit(1)

  parser = argparse.ArgumentParser(
    description="Auto-configure AnyIP routing and ndppd."
  )
  parser.add_argument("--interface", "-i", help="Manually specify interface")
  args = parser.parse_args()

  selected_interface = None
  selected_subnet = None

  if args.interface:
    log_info(f"Analyzing interface: {args.interface}")
    candidates = get_ipv6_candidates()
    matches = [c for c in candidates if c[0] == args.interface]

    if not matches:
      log_fail(f"No global /64 subnet found on {args.interface}.")
      sys.exit(1)
    elif len(matches) == 1:
      selected_interface, selected_subnet = matches[0]
    else:
      log_info(f"Interface {args.interface} has multiple subnets:")
      for idx, (iface, subnet) in enumerate(matches, 1):
        print(f"  {idx}. {subnet}")
      choice = input("Select one (number): ")
      try:
        selected_interface, selected_subnet = matches[int(choice) - 1]
      except (ValueError, IndexError):
        log_fail("Invalid selection.")
        sys.exit(1)
  else:
    log_info("Scanning network interfaces...")
    candidates = get_ipv6_candidates()

    if len(candidates) == 0:
      log_fail("No interfaces with a global IPv6 /64 subnet found.")
      sys.exit(1)

    elif len(candidates) == 1:
      selected_interface, selected_subnet = candidates[0]
      log_success(f"Found: {selected_interface} ({selected_subnet})")

    else:
      print(f"\n{Colors.BOLD}Multiple Candidates Found:{Colors.ENDC}")
      print(f"   {'ID':<4} {'INTERFACE':<12} {'SUBNET'}")
      print("   " + "-" * 45)
      for idx, (iface, subnet) in enumerate(candidates, 1):
        print(f"   {idx:<4} {iface:<12} {subnet}")
      print("")

      while True:
        try:
          choice = input(f"Select interface (1-{len(candidates)}): ")
          idx = int(choice) - 1
          if 0 <= idx < len(candidates):
            selected_interface, selected_subnet = candidates[idx]
            break
          else:
            print("Invalid number.")
        except ValueError:
          print("Please enter a number.")
        except KeyboardInterrupt:
          print("\nCancelled.")
          sys.exit(0)

  try:
    subprocess.run(
      [
        "ip",
        "-6",
        "route",
        "replace",
        "local",
        selected_subnet,
        "dev",
        selected_interface,
      ],
      check=True,
      capture_output=True,
    )
    log_success(f"Route applied: {selected_subnet} -> {selected_interface}")
  except subprocess.CalledProcessError as e:
    log_fail(f"Failed to apply route: {e}")
    sys.exit(1)

  manage_env(selected_subnet)
  log_success("Added IPV6_SUBNET to .env")

  ndppd_conf_content = f"""
proxy {selected_interface} {{
    rule {selected_subnet} {{
        static
    }}
}}
"""
  with tempfile.NamedTemporaryFile(mode="w+", delete=False, suffix=".conf") as tmp_conf:
    tmp_conf.write(ndppd_conf_content)
    tmp_conf_path = tmp_conf.name

  ndppd_process = None
  try:
    log_success("Starting ndppd...")
    ndppd_process = subprocess.Popen(["ndppd", "-c", tmp_conf_path])
    ndppd_process.wait()

  except FileNotFoundError:
    log_fail("ndppd not found")
  except KeyboardInterrupt:
    log_info("Stopping...")
  finally:
    if ndppd_process and ndppd_process.poll() is None:
      ndppd_process.terminate()
      try:
        ndppd_process.wait(timeout=2)
      except subprocess.TimeoutExpired:
        ndppd_process.kill()

    if os.path.exists(tmp_conf_path):
      os.remove(tmp_conf_path)
    manage_env(remove=True)


if __name__ == "__main__":
  main()
