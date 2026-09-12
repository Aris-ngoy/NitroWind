# Uniwind → nitro-wind

Uniwind and nitro-wind both expose `className`. The Metro CSS pipeline, `@import 'uniwind'`, and `extraThemes` go away. Compatibility aliases (`Uniwind`, `withUniwind`, `useUniwind`, `useResolveClassNames`, `uw-*` animation tokens) keep existing call sites compiling.

## Checklist

```
- [ ] Inventory uniwind, metro withUniwindConfig, global.css, extraThemes, dtsFile
- [ ] Remove uniwind
- [ ] Install nitro-wind + react-native-nitro-modules
- [ ] Add nitro-wind/babel; remove nothing Uniwind-specific from babel (Uniwind had no babel preset)
- [ ] Remove withUniwindConfig from Metro
- [ ] Stop importing global.css / @import 'uniwind'
- [ ] Replace Uniwind providers with NitroWindProvider
- [ ] Keep withUniwind() or switch to styled() / withNitroWind()
- [ ] Replace Uniwind.updateInsets / pt-safe
- [ ] Delete uniwind-types.d.ts
- [ ] Rebuild and sweep leftovers
```

## 1. Uninstall / install

```bash
npm uninstall uniwind
npx expo install nitro-wind react-native-nitro-modules
```

Leave `tailwindcss` only if the **web** target still uses Tailwind CSS. Native styling does not need it.

## 2. Metro

Remove the outermost Uniwind wrapper:

```js
// delete
const { withUniwindConfig } = require("uniwind/metro");
module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  polyfills: { rem: 14 },
  extraThemes: ["ocean"],
});
```

Export the default Expo / RN config. `cssEntryFile`, `polyfills.rem`, `extraThemes`, `dtsFile` have no nitro-wind equivalents.

## 3. CSS entry

Remove:

```css
@import "tailwindcss";
@import "uniwind";
```

and `@source` / `@theme` / `@layer theme` / `@variant` blocks used only for native. Drop `import "./global.css"` from the native entry unless web still needs it.

Re-express light / dark tokens as `dark:` / `light:` classes:

```tsx
<View className="bg-white dark:bg-zinc-950" />
```

Custom Uniwind themes (`extraThemes: ['ocean']`, `@variant ocean`): register the same CSS variables on every theme and switch by name. There is no Metro `extraThemes` array.

```ts
NitroWind.updateCSSVariables("ocean", {
  "--color-primary": "#0ea5e9",
  "--color-background": "#0c4a6e",
});
NitroWind.setTheme("ocean");
```

`ocean:` then works as a class prefix (`ocean:bg-sky-950`), the same idea as Uniwind's `@variant ocean`. Every theme must define the same variable names. See https://nitro-wind.mintlify.app/guide/custom-themes.

## 4. Provider and theme API

```tsx
// before
import { Uniwind } from "uniwind";
Uniwind.setTheme("dark");
Uniwind.updateInsets(insets);

// after
import { NitroWindProvider, NitroWind, ThemeTransitionPreset } from "nitro-wind";

<NitroWindProvider>{children}</NitroWindProvider>

NitroWind.setTheme("dark", { preset: ThemeTransitionPreset.Fade });
```

`import { Uniwind } from "nitro-wind"` still works (`Uniwind === NitroWind`). Prefer `NitroWind` in new files.

`useUniwind()` is still exported. Prefer `useNitroWind()` when you need `setTheme`.

There is no `Uniwind.updateInsets`. Replace `pt-safe` / `p-safe` with `styled(SafeAreaView)` or `useSafeAreaInsets()`.

## 5. `withUniwind`

```tsx
// keep compiling
import { withUniwind } from "nitro-wind";
export const Image = withUniwind(ExpoImage);

// preferred
import { styled } from "nitro-wind";
export const Image = styled(ExpoImage);
```

Do not wrap Babel-mapped `react-native` hosts. Do not wrap `react-native-reanimated` primitives — put `uw-entering-*` classes on a styled / Babel-mapped host instead.

Custom Uniwind mappings (`fromClassName` / `styleProperty`) work on `withNitroWind` / `withUniwind`.

## 6. Resolve helpers

```tsx
import { useResolveClassNames, useStyle, useCSSVariable } from "nitro-wind";

const headerStyle = useResolveClassNames("bg-blue-500");
const { style } = useStyle("bg-white dark:bg-gray-900");
const primary = useCSSVariable("--color-primary");
```

`useCSSVariable` only sees variables you registered with `NitroWind.updateCSSVariables` (or generated tokens) — not a deleted `global.css` `@theme` block.

## 7. Animations

`uw-entering-*`, `uw-exiting-*`, `uw-layout-*` keep working. `nw-*` is the same set. Install `react-native-reanimated` if those tokens are used. Looping `animate-*` needs no extra package.

## 8. Types and sweep

Delete `uniwind-types.d.ts` (or whatever `dtsFile` pointed at).

```bash
rg "uniwind/metro|withUniwindConfig|from 'uniwind'|from \"uniwind\"|@import 'uniwind'|updateInsets|extraThemes|uniwind-types" -g "*.{ts,tsx,js,jsx,json,css}"
```

Change remaining `from "uniwind"` imports to `from "nitro-wind"`.

Rebuild. Expo Go = JS engine; native theme transitions need a dev client.
