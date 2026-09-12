# NitroWind

**High-performance Tailwind CSS engine for React Native, powered by Nitro Modules**

`nitro-wind` brings the familiar Tailwind utility-class API to React Native with a native C++ core. It delivers near-zero JavaScript style resolution, a JS fallback for Expo Go, and excellent performance while keeping Tailwind's developer experience.

**Fully free and open source** under the MIT license.

## Install

```bash
bun add nitro-wind react-native-nitro-modules
```

Add the Babel plugin so `className` works on React Native hosts (`View`, `Text`, `FlatList`, …) and static class names can be hoisted:

```js
// babel.config.js
module.exports = {
  presets: [
    // Expo: "babel-preset-expo"
    // Bare RN: "module:@react-native/babel-preset"
  ],
  plugins: ["nitro-wind/babel"],
};
```

Optional: add `global.css` with `@theme` (Tailwind v4) and/or `tailwind.config.js` (v3) to extend colors (`bg-brand-500`). The Babel plugin loads them. Do not import the CSS file in React Native.

Then wrap the app in `NitroWindProvider`. Expo Go uses the JavaScript engine automatically. A development build or bare React Native app loads the native C++ engine (and native theme transitions) after you rebuild.

## Expo

Works in **Expo Go** (JS fallback) and in a **dev client / prebuild** (native C++ engine).

```bash
npx create-expo-app@latest MyApp
cd MyApp
npx expo install nitro-wind react-native-nitro-modules
```

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["nitro-wind/babel"],
  };
};
```

```tsx
// App.tsx
import { StatusBar } from "expo-status-bar";
import { NitroWindProvider } from "nitro-wind";
import { Text, View } from "react-native";

export default function App() {
  return (
    <NitroWindProvider>
      <StatusBar style="auto" />
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
# Expo Go — JS engine
npx expo start

# Native C++ engine (rebuild after installing nitro-wind)
npx expo run:ios
npx expo run:android
```

`expo run:*` creates a development build. Expo Go cannot load custom native code, so it stays on the JS fallback until you use a dev client.

Repo example: [`apps/expo-example`](apps/expo-example).

## Bare React Native

Nitro autolinks the native module. After installing, rebuild the app — do not use Fast Refresh alone for the first native install.

```bash
npx @react-native-community/cli init MyApp
cd MyApp
bun add nitro-wind react-native-nitro-modules
```

```js
// babel.config.js
module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: ["nitro-wind/babel"],
};
```

```tsx
// App.tsx
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
# iOS
bundle exec pod install --project-directory=ios
bun run ios

# Android
bun run android
```

Repo example: [`apps/bare-example`](apps/bare-example).

## Examples

### `className` vs `styled()`

With the Babel plugin, `View`, `Text`, `Pressable`, `Image`, `ScrollView`, `TextInput`, `TouchableOpacity`, and `FlatList` accept `className` from `react-native` — no wrap.

```tsx
import { FlatList, Text, View } from "react-native";

<FlatList
  className="flex-1 bg-white dark:bg-zinc-950"
  contentContainerClassName="p-4 gap-2"
  data={items}
  renderItem={({ item }) => (
    <View className="rounded-xl bg-zinc-100 p-3">
      <Text className="text-zinc-900">{item.title}</Text>
    </View>
  )}
/>
```

Use `styled()` for other hosts (`SafeAreaView`, `SectionList`, `Modal`) or third-party components. You can also import pre-styled primitives from `nitro-wind`. See the [styling guide](https://nitro-wind.mintlify.app/guide/styling).

### `useStyle()`

```tsx
import { useStyle } from "nitro-wind";
import { View, Text } from "react-native";

export function Badge() {
  const { style } = useStyle("rounded-full bg-indigo-600 px-3 py-1");
  return (
    <View style={style}>
      <Text className="text-xs font-medium text-white">Native</Text>
    </View>
  );
}
```

### Theme switching

```tsx
import { NitroWind, ThemeTransitionPreset, useNitroWind } from "nitro-wind";
import { Pressable, Text } from "react-native";

export function ThemeToggle() {
  const { theme, setTheme } = useNitroWind();

  return (
    <Pressable
      className="rounded-full bg-zinc-200 px-4 py-2 dark:bg-zinc-800"
      onPress={() =>
        setTheme(theme === "dark" ? "light" : "dark", {
          preset: ThemeTransitionPreset.CircleCenter,
          duration: 400,
        })
      }
    >
      <Text className="text-zinc-900 dark:text-white">Theme: {theme}</Text>
    </Pressable>
  );
}

// Or without the hook:
NitroWind.setTheme("dark", { preset: ThemeTransitionPreset.Fade });
```

On a native iOS or Android build this uses the snapshot overlay (fade, slide, circle, blur). Expo Go falls back to the JS overlay.

## This repository

```
packages/
  nitro-wind/          Main React Native library (C++ Nitro HybridObject + JS API)
  nitro-wind-core/     Shared tokenizer, parser, theme tokens, JS engine
  nitro-wind-cli/      Theme generation and className validation
apps/
  expo-example/        Expo SDK 57 (JS fallback)
  bare-example/        React Native 0.86 (native C++ engine)
  compare-example/     nitro-wind vs NativeWind vs Uniwind
```

```bash
bun install
bun run check
bun test packages/nitro-wind-core packages/nitro-wind

cd apps/expo-example && bun run start
cd apps/bare-example && bun run ios
cd apps/compare-example && bun run start
```

| iPhone 17 Pro | Pixel 10 |
| --- | --- |
| ![Resolve Speed on iPhone 17 Pro: nitro-wind at 5.41M ops/s; NativeWind and Uniwind unmeasured](apps/compare-example/benchmark-iphone17pro.png) | ![Resolve Speed on Pixel 10: nitro-wind at 1.01M ops/s; NativeWind and Uniwind unmeasured](apps/compare-example/benchmark-pixel10.png) |

Resolve Speed only times a synchronous, headless `className → style` call. `nitro-wind` exposes `computeStyle()`; NativeWind (`cssInterop`) and Uniwind (`useResolveClassNames`) resolve inside a React render, so they show `—` here and are compared on the Rendering tab.

## Docs

Published on Mintlify at [nitro-wind.mintlify.app](https://nitro-wind.mintlify.app). Source lives in [`docs/`](docs). A push to `main` that changes `docs/**` deploys the live site. Pull requests that touch `docs/**` run `mint validate` and a broken-link check.

```bash
cd docs && npx mint dev
```

## AI agents

Install the agent skills so Cursor, Claude Code, Codex, and other agents can add nitro-wind or migrate from NativeWind, Uniwind, Unistyles, and other styling libraries:

```bash
npx skills add Aris-ngoy/NitroWind
npx skills add https://nitro-wind.mintlify.app
```

| Skill | Use when |
| --- | --- |
| `nitro-wind` | Install, `className`, theming, animations |
| `migrate-to-nitro-wind` | Replace NativeWind, Uniwind, Unistyles, or another library |

Agents can also read [`llms.txt`](llms.txt) in this repo or https://nitro-wind.mintlify.app/llms.txt. See the [AI agents](https://nitro-wind.mintlify.app/guide/ai) guide.

## License

MIT — free for everyone, forever.
