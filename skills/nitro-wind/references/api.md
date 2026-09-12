# Public API

Package: `nitro-wind`. Peer: `react-native-nitro-modules`. Optional peer: `react-native-reanimated`.

## Provider and hooks

| Export | Role |
| --- | --- |
| `NitroWindProvider` | Theme, platform, group / interaction. Window size is **not** in context — `useStyle` subscribes to dimensions only when the className has breakpoints. |
| `useNitroWind()` | `{ theme, setTheme, group, interaction, context, … }` |
| `useUniwind()` | `{ theme, hasAdaptiveThemes }` |
| `useStyle(className)` | `{ style, animation, native }` — already inflated |
| `useResolveClassNames(className)` | style object only |
| `useCSSVariable(name)` | CSS variable from the active theme |
| `useAccentColor` / `getAccentColor` | Color from a class string for non-style color props |
| `useAnimatedClassName` | Reanimated recipe from a class string |

## Components

| Export | Role |
| --- | --- |
| `styled(Component)` | Adds `className`, merges `style`, maps `*ClassName`, enables `group-*` |
| `withNitroWind(Component, mapping?)` | `styled()` plus optional prop mapping |
| `withUniwind` | Alias of `withNitroWind` |
| `View`, `Text`, `Pressable`, … | Pre-styled hosts (also `Styled*` names) |
| `SafeAreaView`, `Modal`, `SectionList`, `KeyboardAvoidingView`, `Switch`, `ActivityIndicator`, `ImageBackground`, `RefreshControl` | Import from `nitro-wind` or wrap yourself |

## Singleton

```ts
import { NitroWind, Uniwind, ThemeTransitionPreset } from "nitro-wind";

NitroWind.setTheme("dark", { preset: ThemeTransitionPreset.Fade });
NitroWind.getTheme();
NitroWind.currentTheme;
NitroWind.hasAdaptiveThemes;
NitroWind.updateCSSVariables("dark", { "--accent": "#4F46E5" });
NitroWind.getCSSVariable("--accent");
NitroWind.loadTailwindCss(`@theme { --color-brand: #4F46E5; }`);
NitroWind.loadTailwindConfig(require("./tailwind.config.js"));
```

`Uniwind === NitroWind`.

## Engine

| Function | Purpose |
| --- | --- |
| `computeStyle(className, context?)` | Native Nitro path with JS fallback |
| `computeStaticStyle(className)` | Inflated dictionary for Babel `StyleSheet.create` hoisting |
| `isNativeEngineAvailable()` | Whether the C++ HybridObject loaded |
| `clearEngineCache()` | Drop cached style results |
| `setEngineThemeName(name)` | Update the engine-side theme name |

Callers must not inflate or re-tokenize after `computeStyle`.

## Babel

`nitro-wind/babel` remaps `View`, `Text`, `Pressable`, `Image`, `ScrollView`, `TextInput`, `TouchableOpacity`, `FlatList` from `react-native` → `nitro-wind`, hoists invariant (or platform-only) static `className` literals, and loads Tailwind v4 `@theme` plus v3 `theme.extend`.

## CLI

```bash
bunx nitro-wind info
bunx nitro-wind validate "p-4 bg-red-500 dark:bg-blue-600"
bunx nitro-wind generate-theme ./theme
```

## Docs

- https://nitro-wind.mintlify.app/api/overview
- https://nitro-wind.mintlify.app/llms.txt
