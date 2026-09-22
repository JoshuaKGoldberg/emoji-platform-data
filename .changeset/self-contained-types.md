---
"emoji-platform-data": minor
---

Removed the runtime dependency on `emojipedia`: the package's types are now self-contained, so installing it no longer pulls in `emojipedia`'s GraphQL dependencies.
Also removed the `./by-emoji.json` and `./by-title.json` `exports` entries, which never pointed to emitted files.
