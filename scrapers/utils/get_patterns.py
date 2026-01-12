import os
import sys
import json

current_dir = os.path.dirname(os.path.abspath(__file__))
scrapers_dir = os.path.dirname(current_dir)
sys.path.insert(0, scrapers_dir)

patterns_map = {}

for filename in os.listdir(scrapers_dir):
    if filename.startswith("_") or not filename.endswith(".py"):
        continue

    module_name = filename[:-3]

    patterns_map[module_name] = __import__(module_name).patterns

print(json.dumps(patterns_map))
