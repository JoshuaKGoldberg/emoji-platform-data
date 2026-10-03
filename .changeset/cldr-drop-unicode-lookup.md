---
"@emoji-platform-data/generator": patch
---

Removed the lookup of emoji by their code points that ran after their glyphs and names, which scanned every Emojipedia item for each emoji yet never matched one the glyph lookup hadn't.
