# NativeWind → nitro-wind

NativeWind compiles CSS through Metro and `cssInterop`. nitro-wind resolves class strings in JS or C++. Most layout / color / type utilities stay as-is.

## Checklist

```
- [ ] Inventory package.json, babel, metro, global.css, nativewind-env.d.ts
- [ ] Remove nativewind + react-native-css-interop
- [ ] Install nitro-wind + react-native-nitro-modules
- [ ] Swap babel preset/plugin
- [ ] Remove withNativeWind from Metro
- [ ] Stop importing global.css (or delete Tailwind @tailwind directives)
- [ ] Replace NativeWindProvider / vars() ThemeProvider
- [ ] Replace cssInterop / remapProps with styled() / withNitroWind()
- [ ] Replace pt-safe / p-safe
- [ ] Delete nativewind type stubs
- [ ] Rebuild and sweep leftovers
```

## 1. Uninstall

```bash
npm uninstall nativewind react-native-css-interop
# yarn remove / bun remove — same packages
```

Search and delete every import:

```bash
rg "react-native-css-interop|from 'nativewind'|from \"nativewind\"" -g "*.{ts,tsx,js,jsx}"
```

## 2. Install

```bash
npx expo install nitro-wind react-native-nitro-modules
# or: bun add nitro-wind react-native-nitro-modules
```

## 3. Babel

Remove `'nativewind/babel'` from `presets` (and from `plugins` if present). Add `"nitro-wind/babel"` to `plugins`.

## 4. Metro

Remove:

```js
const { withNativeWind } = require("nativewind/metro");
module.exports = withNativeWind(config, { input: "./global.css" });
```

Export the default Expo / RN Metro config. nitro-wind does not wrap Metro.

## 5. CSS and Tailwind config

Keep `global.css` `@theme` (v4) and/or `tailwind.config.js` `theme.extend` (v3). Do not import the CSS file on native.

- Delete `@tailwind base/components/utilities` if unused on web.
- Remove `import "./global.css"` from `App.tsx` / `_layout.tsx` on native.
- Keep `@theme` / `theme.extend`. Drop `content`, Tailwind plugins, and Metro CSS wrappers.

## 6. Provider

```tsx
// before
import { NativeWindStyleSheet /* or ThemeProvider / vars */ } from "nativewind";

// after
import { NitroWindProvider } from "nitro-wind";

<NitroWindProvider>{children}</NitroWindProvider>
```

Remove `vars()` wrappers and NativeWind `<ThemeProvider>`. Keep React Navigation's `ThemeProvider` if present.

```tsx
// before
<View style={themes[colorScheme]} className="flex-1 bg-background" />

// after
<View className="flex-1 bg-white dark:bg-zinc-950" />
```

Runtime tokens:

```ts
import { NitroWind } from "nitro-wind";
NitroWind.updateCSSVariables("dark", { "--color-primary": "#273c75" });
```

## 7. `cssInterop` / `remapProps`

```tsx
// before
import { cssInterop } from "react-native-css-interop";
cssInterop(Image, { className: "style" });

// after
import { styled } from "nitro-wind";
import { Image as ExpoImage } from "expo-image";
export const Image = styled(ExpoImage);
```

Custom mappings:

```tsx
import { withNitroWind } from "nitro-wind";

const StyledProgressBar = withNitroWind(ProgressBar, {
  width: { fromClassName: "widthClassName", styleProperty: "width" },
});
```

Wrap at module scope, once per component. Do **not** wrap `View`, `Text`, `Pressable`, `Image`, `ScrollView`, `TextInput`, `TouchableOpacity`, `FlatList` from `react-native` — the Babel plugin already remaps them.

Non-style color props use `*ClassName` (no NativeWind `accent-` requirement):

```tsx
<ActivityIndicator className="m-4" colorClassName="text-blue-500" />
<Image tintColorClassName="tint-red-500" source={icon} />
```

## 8. Safe area

Replace `pt-safe`, `px-safe`, `p-safe`, `m-safe`, and `-or-` / `-offset-` variants:

```tsx
import { styled } from "nitro-wind";
import { SafeAreaView } from "react-native-safe-area-context";

const Screen = styled(SafeAreaView);
```

## 9. Types and leftover files

Delete `nativewind-env.d.ts` / `nativewind.d.ts`. You do not need a generated `uniwind-types.d.ts`.

NativeWind `animated-*` transition classes are not a CSS interop layer here. Use `animate-*` loops or `uw-entering-*` / `uw-layout-*` (needs Reanimated). See the `nitro-wind` skill animations reference.

## 10. `className` overrides

If the app relied on NativeWind deduping `` className={`p-4 ${override}`} ``, add a `cn` helper (`clsx` + `tailwind-merge`) and use it at those call sites.

## 11. Final sweep

```bash
rg "nativewind|NativeWind|cssInterop|remapProps|react-native-css-interop|withNativeWind" -g "*.{ts,tsx,js,jsx,json,css}"
```

Rebuild. Expo Go works with the JS engine; a dev client is required for the C++ engine and native theme transitions.
