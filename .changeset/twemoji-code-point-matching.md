---
"@emoji-platform-data/generator": patch
"@emoji-platform-data/twemoji": patch
"emoji-platform-data": patch
---

Fixed Twemoji data being attached to the wrong emoji, such as 😁's to 😄, or dropped, such as ☃️'s, by matching Twemoji's code points before its descriptions.
