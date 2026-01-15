import os
import sys
import json
import asyncio
import importlib.util
from dataclasses import asdict


async def execute(module, input_data: dict):
  try:
    method_name = input_data.get("method", "product")
    sku = input_data.get("sku")

    result = await getattr(module, method_name)(sku)
    print(json.dumps(asdict(result)))
  except Exception as e:
    print(json.dumps({"error": str(e), "trace": str(e.__traceback__)}))


if __name__ == "__main__":
  input_data = json.loads(sys.stdin.read())
  target_name = input_data.get("store")
  script_path = os.path.join(os.path.dirname(__file__), f"{target_name}.py")

  spec = importlib.util.spec_from_file_location(target_name, script_path)
  if not spec or not spec.loader:
    print(json.dumps({"error": f"Could not load {target_name}"}))
    sys.exit(1)

  module = importlib.util.module_from_spec(spec)
  spec.loader.exec_module(module)

  asyncio.run(execute(module, input_data))
