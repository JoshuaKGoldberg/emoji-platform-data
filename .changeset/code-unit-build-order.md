---
"@emoji-platform-data/generator": patch
---

Sorted emoji and data keys by code unit rather than with `localeCompare`, so that building in another locale, such as `cs_CZ`, writes the same files.
