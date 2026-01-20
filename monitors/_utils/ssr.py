from zendriver import Tab

from selectolax.lexbor import LexborHTMLParser
import json


async def extract_next_ssr_data_zendriver(page: Tab):
  """
  Extract SSR data used for hydration in Next.js
  """
  script = await page.select("#__NEXT_DATA__")
  scriptText = await script.get_html() if script else None
  scriptText = scriptText.split(">", 1)[1].rsplit("</", 1)[0] if scriptText else None
  return json.loads(scriptText if scriptText else "{}")


def extract_next_ssr_data_html(html: str):
  """
  Extract SSR data used for hydration in Next.js
  """
  script = LexborHTMLParser(html).css_first("#__NEXT_DATA__")
  return json.loads(script.text())
