---
"@emoji-platform-data/generator": patch
---

Read fluemoji's metadata files one at a time, so `generateFluemoji` no longer fails with `EMFILE` where a process can't open over 1,600 files at once.
