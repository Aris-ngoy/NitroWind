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

Cache keys are 64-bit integers: `fnv1a64(className)` mixed with the context bitmask (color scheme, platform, RTL, group/interaction, width bucket). Theme is not part of the key — theme changes clear the cache.

## React subscriptions

`useStyle` classifies each className and only subscribes to what the variants actually read. Invariant classNames (`p-4 bg-red-500`) do not subscribe to theme or window size, so a rotation does not re-render static views. The Babel plugin hoists those same invariant literals into `StyleSheet.create` via `computeStaticStyle`.
