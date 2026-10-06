#!/usr/bin/env python3
"""Build a static GitHub Pages demo without server-only files or credentials."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs"
PUBLIC_FILES = ("index.html", "style.css", "script.js", "data.js", "favicon.svg")

if OUTPUT.exists():
    shutil.rmtree(OUTPUT)
OUTPUT.mkdir()
for filename in PUBLIC_FILES:
    shutil.copy2(ROOT / filename, OUTPUT / filename)
shutil.copytree(ROOT / "assets", OUTPUT / "assets")

data_file = OUTPUT / "data.js"
data = data_file.read_text(encoding="utf-8")
old = "chat: { useGemini: true }"
if data.count(old) != 1:
    raise RuntimeError("Cannot find the Gemini setting in data.js")
data_file.write_text(data.replace(old, "chat: { useGemini: false }"), encoding="utf-8")
(OUTPUT / ".nojekyll").touch()
print(f"Built GitHub Pages demo in {OUTPUT}")
