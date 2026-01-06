import json
import sys

import asyncio
from typing import Any

import zendriver as zd


def log(message: str):
    print(f"[Python] {message}", file=sys.stderr)


def out(obj: Any):
    print(json.dumps(obj))
    sys.exit(0)


async def main():
    log("log")

    input_data = sys.stdin.read()

    if not input_data:
        log("No input data received")
        sys.exit(1)

    job_data = json.loads(input_data)

    out(
        {
            "in": job_data,
            "status": "completed",
            "data": {"id": 123, "values": [10.5, 20.3, 30.1]},
            "worker_type": "uv-python",
        }
    )


if __name__ == "__main__":
    asyncio.run(main())
