---
name: migrate-to-nitro-wind
description: >
  Migrate a React Native app to nitro-wind from NativeWind, Uniwind, Unistyles,
  Tamagui, Restyle, StyleSheet, twrnc, Tailwind RN, or other styling libraries.
  Use when the user asks to switch to nitro-wind, replace NativeWind or Uniwind,
  drop cssInterop / withUniwindConfig / StyleSheet.create variants, or mentions
  migrating className styling. Detect the source library first, then follow the
  matching reference.
license: MIT
metadata:
  author: aristote-ngoy
  version: "0.1.0"
  homepage: https://nitro-wind.mintlify.app
---

# Migrate to nitro-wind

nitro-wind keeps Tailwind `className` on React Native. It does **not** compile CSS or run Tailwind plugins. Keep Tailwind v4 `@theme` in `global.css` and/or v3 `theme.extend` in `tailwind.config.js`. Do not import `global.css` on native. Drop plugins, `content`, and Metro CSS wrappers.

Docs: https://nitro-wind.mintlify.app
NativeWind: https://nitro-wind.mintlify.app/migration/nativewind
Uniwind: https://nitro-wind.mintlify.app/migration/uniwind
Unistyles: https://nitro-wind.mintlify.app/migration/unistyles

**Do not invent nitro-wind APIs.** Fetch https://nitro-wind.mintlify.app/llms.txt if unsure. After the project compiles, use the sibling `nitro-wind` skill for day-to-day styling.

## Detect the source

Read these before changing files:

- `package.json` (nativewind, uniwind, react-native-unistyles, tamagui, restyle, twrnc, tailwind-rn, nativewind, react-native-css-interop)
- `babel.config.js` / `babel.config.ts` (`nativewind/babel`)
- `metro.config.js` (`withNativeWind`, `withUniwindConfig`)
- `tailwind.config.*`, `global.css` / `uniwind-types.d.ts` / `nativewind-env.d.ts`
- Imports: `cssInterop`, `remapProps`, `vars`, `withUniwind`, `useUniwind`, `Uniwind.`, `StyleSheet.create` from `react-native-unistyles`, `createUnistyles`, `styled` from `@tamagui/core`

Then open **one** reference:

| Source | Reference |
| --- | --- |
| NativeWind / `react-native-css-interop` | [references/nativewind.md](references/nativewind.md) |
| Uniwind | [references/uniwind.md](references/uniwind.md) |
| Unistyles | [references/unistyles.md](references/unistyles.md) |
| StyleSheet, Tamagui, Restyle, twrnc, others | [references/other.md](references/other.md) |

If two libraries are present (e.g. NativeWind leftovers after a Uniwind migrate), finish the leftover sweep in **both** matching references.

## Shared install (every source)

```bash
# remove the old styling runtime (see the source reference for the exact list)
npx expo install nitro-wind react-native-nitro-modules
```

```js
// babel.config.js — keep the Expo / RN preset, add:
plugins: ["nitro-wind/babel"]
```

```tsx
import { NitroWindProvider } from "nitro-wind";

export default function App() {
  return <NitroWindProvider>{/* app */}</NitroWindProvider>;
}
```

Do **not** add:

- `withNativeWind` / `withUniwindConfig` in Metro
- `@import 'tailwindcss'` / `@import 'uniwind'` CSS entry
- `cssInterop` / `remapProps`
- `nativewind/babel`

Do **not** wrap Babel-mapped hosts (`View`, `Text`, `Pressable`, `Image`, `ScrollView`, `TextInput`, `TouchableOpacity`, `FlatList`) with `styled()`.

Rebuild after the first native install (`npx expo run:ios` / `run:android`, or `pod install` + native run). Expo Go stays on the JS engine until a dev client exists.

## Compatibility aliases

These compile during a gradual migrate. Prefer the nitro-wind names in new code.

| Old | nitro-wind |
| --- | --- |
| `Uniwind` | `NitroWind` |
| `useUniwind()` | `useNitroWind()` / `useUniwind()` |
| `withUniwind()` | `withNitroWind()` / `styled()` |
| `useResolveClassNames()` | `useResolveClassNames()` / `useStyle()` |
| `uw-entering-*` | same, or `nw-entering-*` |

## Shared verification

```bash
rg "nativewind|react-native-css-interop|uniwind/metro|withNativeWind|cssInterop|remapProps|from 'uniwind'|from \"uniwind\"|react-native-unistyles" -g "*.{ts,tsx,js,jsx,json,css}"
```

Then:

1. `npx expo start -c` or `npx react-native start --reset-cache`
2. Rebuild native if the module was just added
3. Light / dark switch
4. `FlatList` `className` vs `contentContainerClassName`
5. Third-party wrappers (`expo-image`, gradients, blur) still get `className`
6. Entering / exiting rows keep stable keys
7. No `pt-safe` left — those utilities do not exist; use `styled(SafeAreaView)` or insets

## Agent rules

1. Detect the source library from the repo. Do not assume NativeWind.
2. Remove the old runtime completely. Leftover `react-native-css-interop` is the most common failure.
3. Keep existing Tailwind class strings when they are valid utilities. Rewrite only library-specific APIs.
4. Safe-area classes from NativeWind / Uniwind must be replaced; nitro-wind has no `*-safe` utilities.
5. Cite https://nitro-wind.mintlify.app/guide/styling when choosing `className` vs `styled()`.
