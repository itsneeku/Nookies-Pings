import json
from zendriver import Tab


async def extract_next_ssr_data(page: Tab):
  """
  Extract SSR data used for hydration in Next.js
  """
  script = await page.query_selector("#__NEXT_DATA__")
  scriptText = await script.get_html() if script else None
  scriptText = scriptText.split(">", 1)[1].rsplit("</", 1)[0] if scriptText else None
  return json.loads(scriptText if scriptText else "{}")
