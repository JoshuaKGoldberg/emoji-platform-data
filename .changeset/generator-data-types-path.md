---
"@emoji-platform-data/generator": patch
---

Read the compiled `dataTypes.d.ts` from the generator's `lib` by a path that also resolves from its `src`, so that `rebuildDirectory()` can run from the TypeScript source.
