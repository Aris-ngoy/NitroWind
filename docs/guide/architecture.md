# Architecture

```
className string
    → Tokenizer + Parser + inflate + animation (C++ or JS fallback)
    → StyleResult { style, animation }
    → Two-tier cache (JS interned objects, C++ inflated records)
    → React style prop
```

## Packages

- `nitro-wind` — React bindings, Nitro HybridObject, Babel automapping
- `nitro-wind-core` — Tokenizer, parser, theme tables, JS engine
- `nitro-wind-cli` — Theme generation and className validation

## Native engine

`HybridStyleEngine` implements the Nitrogen spec `StyleEngine` in C++ for iOS and Android. `compute` returns a `StyleResult`: an inflated style dictionary (`shadowOffset`, `transform`) plus `AnimationMeta`. The same parser rules live in TypeScript so Expo Go and unit tests stay consistent. Callers do not inflate or re-tokenize after crossing the engine seam.

## Caching

Cache keys are strings: `` `${bitmask}:${className}` ``, where the bitmask packs color scheme, platform, RTL, interaction/group, and a width bucket (`fastCacheKey` in `nitro-wind-core`). Theme is not part of the key — theme changes clear the cache. The engine seam's own cache sits at the className-and-bitmask granularity on both sides: `nitrowind::engine::Engine` on the C++ side, `JsStyleEngine` on the JS side. The wrappers around each (`HybridStyleEngine` on the JSI boundary, `packages/nitro-wind/src/engine.ts` on the JS side) do not layer a second cache on top — `engine.ts`'s own cache exists because it also has to skip the native-vs-JS dispatch decision on a hit, which the engine seam itself does not know about.

## React subscriptions

`useStyle` classifies each className and only subscribes to what the variants actually read. Invariant classNames (`p-4 bg-red-500`) do not subscribe to theme or window size, so a rotation does not re-render static views. The Babel plugin hoists those same invariant literals into `StyleSheet.create` via `computeStaticStyle`.
