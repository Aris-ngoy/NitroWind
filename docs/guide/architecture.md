# Architecture

```
className string
    → Tokenizer + Parser (C++ or JS fallback)
    → Resolved StyleObject (theme / platform / context)
    → Cache lookup (FNV-1a + dependency bitmasks)
    → React style prop (JS) or native compute (Nitro JSI)
```

## Packages

- `nitro-wind` — React bindings, Nitro HybridObject, Babel automapping
- `nitro-wind-core` — Tokenizer, parser, theme tables, JS engine
- `nitro-wind-cli` — Theme generation and className validation

## Native engine

`HybridStyleEngine` implements the Nitrogen spec `StyleEngine` in C++ for iOS and Android. The same parser rules live in TypeScript so Expo Go and unit tests stay consistent.

## Caching

Cache keys combine a 64-bit FNV-1a hash of the className with a context bitmask (color scheme, platform, RTL, group/interaction, width bucket). Theme changes clear the cache.
