# Theming

`NitroWindProvider` selects light or dark. `dark:` and `light:` resolve from that scheme, or from system appearance when no theme is passed.

```tsx
<NitroWindProvider theme="dark">
  <View className="bg-white dark:bg-slate-950" />
</NitroWindProvider>
```

Prefer semantic classes (`bg-white dark:bg-zinc-950`) over runtime branching.

## Switch theme

```tsx
import { NitroWind, ThemeTransitionPreset, useNitroWind } from "nitro-wind";

const { theme, setTheme } = useNitroWind();

setTheme("dark");
setTheme("light");
setTheme("system"); // follow Appearance, sets hasAdaptiveThemes

setTheme(theme === "dark" ? "light" : "dark", {
  preset: ThemeTransitionPreset.CircleCenter,
  duration: 400,
});

NitroWind.setTheme("dark", { preset: ThemeTransitionPreset.Fade });
NitroWind.getTheme();
NitroWind.currentTheme;
NitroWind.hasAdaptiveThemes;
```

`useUniwind()` returns `{ theme, hasAdaptiveThemes }` for Uniwind-shaped call sites. `Uniwind` is the same singleton as `NitroWind`.

Both engines clear style caches when the theme name changes.

## Named themes

Brand utilities (`bg-brand-500`) come from Tailwind v4 `@theme` (`--color-brand-500`) and/or v3 `theme.extend.colors`. Named modes beyond light/dark use `NitroWind.updateCSSVariables` — do not import `global.css` on native. Define the **same** `--*` keys on every named theme, register once at startup, then switch.

```ts
import { NitroWind } from "nitro-wind";

export const themes = {
  light: { "--color-primary": "#4F46E5", "--color-background": "#ffffff" },
  dark: { "--color-primary": "#818CF8", "--color-background": "#09090b" },
  premium: { "--color-primary": "#fbbf24", "--color-background": "#1e1b4b" },
} as const;

export function registerThemes() {
  for (const [name, variables] of Object.entries(themes)) {
    NitroWind.updateCSSVariables(name, variables);
  }
}

NitroWind.setTheme("premium");
```

`premium:` is a class variant while that theme is active. `dark:` / `light:` do **not** match on `premium`.

React Native cannot use `bg-[var(--color-primary)]`. Read tokens with `useCSSVariable` / `getCSSVariable` and apply them on `style`.

```tsx
const primary = useCSSVariable("--color-primary");
<View style={{ backgroundColor: primary }} />
```

`ScopedVariables` overrides one subtree. Docs: https://nitro-wind.mintlify.app/guide/custom-themes

## Transition presets

Native iOS / Android uses a snapshot overlay. Expo Go falls back to a JS overlay.

`None`, `Fade`, `SlideRightToLeft`, `SlideLeftToRight`, `CircleTopRight`, `CircleTopLeft`, `CircleBottomRight`, `CircleBottomLeft`, `CircleCenter`, `Blur`, `BlurRightToLeft`, `BlurLeftToRight`, `CircleFromOrigin`, `SlideFromOrigin`, `BlurFromOrigin`.

## CSS variables

```tsx
NitroWind.updateCSSVariables("dark", {
  "--accent": "#4F46E5",
  "--color-primary": "#ff6600",
});

import { useCSSVariable, getCSSVariable } from "nitro-wind";

const accent = useCSSVariable("--accent");
```

Use runtime variable updates only for user-selected brand colors or API-driven tokens — not as a substitute for `dark:` classes.

## Safe area

nitro-wind has no `pt-safe` utilities and no `Uniwind.updateInsets`. Use:

```tsx
import { styled } from "nitro-wind";
import { SafeAreaView } from "react-native-safe-area-context";

const Screen = styled(SafeAreaView);
```

Or pad from `useSafeAreaInsets()`.
