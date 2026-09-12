# Other libraries → nitro-wind

Use this when the source is not NativeWind, Uniwind, or Unistyles.

Install once, then convert styles to Tailwind class strings.

```bash
npx expo install nitro-wind react-native-nitro-modules
```

```js
plugins: ["nitro-wind/babel"]
```

```tsx
import { NitroWindProvider, styled } from "nitro-wind";
```

Rebuild after the first native install.

## React Native `StyleSheet`

Replace static sheets with utilities. Keep `style={}` for dynamic / animated values.

```tsx
// before
<View style={styles.card} />

// after
<View className="rounded-xl bg-white p-4 dark:bg-zinc-900" />
```

Platform selects become `ios:` / `android:` / `web:`.

## Tamagui

Tamagui is a compiler + design-system runtime. Do not keep `@tamagui/core` `styled()` for layout you are moving to nitro-wind.

- Convert Tamagui tokens (`$space.4`, `$color.background`) to Tailwind utilities or `dark:` pairs.
- Replace Tamagui `Stack` / `XStack` / `YStack` with `View` + `flex-row` / `gap-*`.
- Replace Tamagui `Text` with RN `Text` + typography classes when the screen no longer needs Tamagui.
- Third-party or remaining Tamagui hosts that still accept `style` can be wrapped with nitro-wind `styled()` — do not confuse Tamagui's `styled` with `styled` from `nitro-wind`. Always import nitro-wind's as a named import:

```tsx
import { styled as nw } from "nitro-wind";
```

Remove Tamagui babel / compiler config only after no Tamagui components remain.

## Restyle (`@shopify/restyle`)

Restyle variant props (`variant="defaults"`, `backgroundColor="cardPrimary"`) become class strings. Delete `createTheme` / `ThemeProvider` from Restyle when unused. Use `NitroWindProvider` + `dark:` instead of Restyle dark themes.

## twrnc / `tailwind-rn` / `NativeWind v2` class helper

These already use class strings.

```tsx
// before
<View style={tw`p-4 bg-white`} />
<View style={tailwind("p-4 bg-white")} />

// after
<View className="p-4 bg-white" />
```

Remove the helper package. Add the Babel plugin so `className` works on RN hosts.

## Dripsy / `styled-components/native` / Emotion Native

Convert template-literal CSS to utilities. Wrap leftover third-party hosts with `styled()` from `nitro-wind` (not the CSS-in-JS `styled`). Remove the CSS-in-JS runtime when no styled components remain.

## Gluestack / HeroUI Native / React Native Reusables

If they currently depend on NativeWind or Uniwind, follow [nativewind.md](nativewind.md) or [uniwind.md](uniwind.md) first, then point `className` at nitro-wind. Re-wrap any kit primitive that does not get Babel remapping:

```tsx
import { styled } from "nitro-wind";
import { Box as KitBox } from "@/components/ui/box";
export const Box = styled(KitBox);
```

## What never to add

- Metro CSS wrappers
- `global.css` Tailwind imports for native
- `cssInterop`
- A second styling runtime “just in case”

## Verification

```bash
rg "from 'twrnc'|from \"twrnc\"|tailwind-rn|@shopify/restyle|@tamagui/core|styled-components/native|@emotion/native|dripsy" -g "*.{ts,tsx,js,jsx,json}"
```

Every converted screen should use `className` on Babel-mapped hosts or `styled()` on everything else, under one `NitroWindProvider`.
