---
name: nitro-wind
description: >
  Install, configure, and write Tailwind className styles with nitro-wind in
  Expo or bare React Native. Use when the user asks to add nitro-wind, use
  className on React Native views, wrap third-party components, switch themes,
  animate lists, or mentions NitroWindProvider, styled(), useStyle, or
  computeStyle. Do not use NativeWind, Uniwind, or CSS files unless the user
  is migrating — then load migrate-to-nitro-wind.
license: MIT
metadata:
  author: aristote-ngoy
  version: "0.1.0"
  homepage: https://nitro-wind.mintlify.app
---

# nitro-wind

`nitro-wind` is a Tailwind **utility-class** engine for React Native. It does **not** compile CSS or run Tailwind plugins. It **does** read Tailwind v4 `@theme` in `global.css` and v3 `theme.extend` in `tailwind.config.js` via the Babel plugin. Do not `import "./global.css"` in React Native. You write class strings; the engine returns inflated React Native styles.

- Expo Go → JavaScript engine from `nitro-wind-core`
- Dev client / prebuild / bare RN → native C++ engine after a rebuild

Docs: https://nitro-wind.mintlify.app
Index: https://nitro-wind.mintlify.app/llms.txt
Full dump: https://nitro-wind.mintlify.app/llms-full.txt

**Do not invent APIs.** If unsure, fetch the docs page or `llms.txt` first.

## Install

```bash
# Expo
npx expo install nitro-wind react-native-nitro-modules

# bun / npm / yarn
bun add nitro-wind react-native-nitro-modules
```

Add the Babel plugin. Keep the existing Expo or RN preset.

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"], // or "module:@react-native/babel-preset"
    plugins: ["nitro-wind/babel"],
  };
};
```

Wrap the app once. Import `global.css` is **not** required.

```tsx
import { NitroWindProvider } from "nitro-wind";
import { Text, View } from "react-native";

export default function App() {
  return (
    <NitroWindProvider>
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <Text className="text-xl font-bold text-zinc-900 dark:text-white">
          Hello nitro-wind
        </Text>
      </View>
    </NitroWindProvider>
  );
}
```

```bash
npx expo start          # Expo Go — JS engine
npx expo run:ios        # native C++ engine (rebuild after install)
npx expo run:android
```

Bare RN: `bundle exec pod install --project-directory=ios` then rebuild. Fast Refresh is not enough for the first native install.

## `className` vs `styled()`

With `nitro-wind/babel`, these imports from `react-native` accept `className` with **no wrap**:

`View`, `Text`, `Pressable`, `Image`, `ScrollView`, `TextInput`, `TouchableOpacity`, `FlatList`

```tsx
import { FlatList, Text, View } from "react-native";

<FlatList
  className="flex-1 bg-white dark:bg-zinc-950"
  contentContainerClassName="p-4 gap-2"
  data={items}
  renderItem={({ item }) => (
    <View className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
      <Text className="text-zinc-900 dark:text-white">{item.title}</Text>
    </View>
  )}
/>
```

`className` on `FlatList` / `ScrollView` is the **outer** `style`. Padding and gap for rows go on `contentContainerClassName`.

Use `styled()` or `withNitroWind()` for every other host (`SafeAreaView`, `SectionList`, `Modal`, `Switch`, …) and any third-party view that takes `style`. Wrap **once at module scope**, never inside render.

```tsx
import { styled } from "nitro-wind";
import { SafeAreaView } from "react-native";
import { Image as ExpoImage } from "expo-image";

const Screen = styled(SafeAreaView);
export const Image = styled(ExpoImage);
```

Or import pre-styled primitives from `nitro-wind` (`SafeAreaView`, `Modal`, `SectionList`, `KeyboardAvoidingView`, `Switch`, …).

Do **not** wrap Babel-mapped hosts again. `withUniwind` is an alias of `withNitroWind`.

## What to write

Tailwind utilities only. Unknown classes are ignored.

```bash
bunx nitro-wind validate "p-4 bg-red-500 dark:bg-blue-600"
```

Variants: `dark:`, `light:`, `ios:`, `android:`, `web:`, `sm:`–`xl:`, `active:`, `hover:`, `focus:`, `group` / `group-active:` / `group-hover:`.

Arbitrary values: `w-[72px]`, `bg-[#4F46E5]`.

There is **no** `pt-safe` / `p-safe`. Use `styled(SafeAreaView)` or insets from `react-native-safe-area-context`.

There is **no** Metro `withNativeWind` / `withUniwindConfig`, no `@import 'tailwindcss'`, no `cssInterop`.

Details: [references/styling.md](references/styling.md)

## Theme

```tsx
import { NitroWind, ThemeTransitionPreset, useNitroWind } from "nitro-wind";

const { theme, setTheme } = useNitroWind();
setTheme(theme === "dark" ? "light" : "dark", {
  preset: ThemeTransitionPreset.CircleCenter,
  duration: 400,
});

NitroWind.setTheme("dark", { preset: ThemeTransitionPreset.Fade });
NitroWind.updateCSSVariables("dark", { "--color-primary": "#4F46E5" });
```

Named themes (`premium`, `ocean`, …): register the same `--*` keys on every theme with `updateCSSVariables`, then `setTheme("premium")`. The name is also a class prefix (`premium:bg-indigo-950`). `dark:` / `light:` only match when that exact name is active.

`Uniwind` is a drop-in alias of `NitroWind`. `useUniwind()` still works.

Details: [references/theming.md](references/theming.md)

## Animations

| Path | Classes | Extra install |
| --- | --- | --- |
| Loops | `animate-spin`, `animate-pulse`, `animate-bounce`, `animate-ping` | none |
| Enter / exit / layout | `uw-entering-*`, `uw-exiting-*`, `uw-layout-*` (or `nw-*`) | `react-native-reanimated` |

Keep a **stable `key`** on animated rows.

Details: [references/animations.md](references/animations.md)

## `useStyle` and the engine

```tsx
const { style } = useStyle("rounded-full bg-indigo-600 px-3 py-1");
```

Use `useStyle` / `useResolveClassNames` when you need a style object (Navigation theme, Reanimated worklets, libraries that reject `className`).

API table: [references/api.md](references/api.md)

## Agent rules

1. Prefer `className` on Babel-mapped hosts. Use `styled()` only when required.
2. Do not add `global.css`, Tailwind v4 `@import`, or a Metro CSS wrapper.
3. Do not install NativeWind or Uniwind for a greenfield nitro-wind app.
4. After adding the native module, tell the user to rebuild (`expo run:*` or `pod install` + native run).
5. Validate unfamiliar class strings with `bunx nitro-wind validate`.
6. Cite https://nitro-wind.mintlify.app when answering API questions.

## Additional resources

- Styling: [references/styling.md](references/styling.md)
- Theming: [references/theming.md](references/theming.md)
- Animations: [references/animations.md](references/animations.md)
- Public API: [references/api.md](references/api.md)
- Migrating from another library: sibling skill `migrate-to-nitro-wind`
