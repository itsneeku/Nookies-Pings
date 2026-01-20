import sys
import json
import asyncio
import traceback
import importlib.util
from pathlib import Path
from dataclasses import asdict


async def run_module(data: dict):
  try:
    file_path = Path(__file__).parent / data["store"] / f"{data['method']}.py"

    if not file_path.exists():
      raise FileNotFoundError(f"Script not found at {file_path}")

    spec = importlib.util.spec_from_file_location("dynamic_mod", file_path)
    assert spec is not None and spec.loader is not None, (
      f"Could not load module spec or loader for {file_path}"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    result = await module.main(data)

    print(json.dumps(asdict(result)))

  except Exception as e:
    print(
      json.dumps(
        {
          "error": str(e),
          "trace": traceback.format_exc().splitlines(),
        },
        indent=2,
      )
    )


if __name__ == "__main__":
  input_data = json.loads(sys.stdin.read())
  asyncio.run(run_module(input_data))
