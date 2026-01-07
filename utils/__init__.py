import json
import sys
from typing import Any


def log(message: str):
  print(f"[Scraper] {message}", file=sys.stderr)


def output(result: Any):
  print(json.dumps(result))
  sys.exit(0)


def read_input():
  input_data = sys.stdin.read()
  return json.loads(input_data)
