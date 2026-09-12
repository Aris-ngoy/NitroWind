# Unistyles → nitro-wind

Unistyles is a StyleSheet DSL (`StyleSheet.create`, variants, breakpoints). nitro-wind is a Tailwind `className` engine. This is a rewrite of style definitions, not a config swap.

## Checklist

```
- [ ] Inventory react-native-unistyles, UnistylesProvider, StyleSheet.create
- [ ] Install nitro-wind + react-native-nitro-modules; add Babel plugin
- [ ] Wrap NitroWindProvider
- [ ] Convert StyleSheet keys to utility strings
- [ ] Convert Unistyles variants / breakpoints to class variants
- [ ] Keep raw style props where values are truly dynamic
- [ ] Remove unistyles
```

## 1. Install nitro-wind first

Leave Unistyles in place until screens compile on class names, then remove it.

```bash
npx expo install nitro-wind react-native-nitro-modules
```

Add `plugins: ["nitro-wind/babel"]` and wrap `NitroWindProvider` **outside** or **instead of** `UnistylesProvider` once nothing reads Unistyles theme.

## 2. Convert a StyleSheet

```tsx
// before
const styles = StyleSheet.create((theme) => ({
  box: {
    padding: theme.gap(4),
    backgroundColor: theme.colors.background,
    variants: {
      size: {
        sm: { padding: 8 },
        lg: { padding: 24 },
      },
    },
  },
}));

<View style={styles.box} />

// after
<View className="bg-white p-4 dark:bg-zinc-950" />
<View className={size === "lg" ? "p-6" : "p-2"} />
```

Breakpoint variants become `md:` / `lg:` on the same string. `useStyle` is for hosts that cannot take `className`.

## 3. Theme

Map Unistyles theme colors to `dark:` classes or `NitroWind.updateCSSVariables`. Do not port `UnistylesRegistry.addThemes` one-for-one — nitro-wind's runtime theme is `light` | `dark` | `system`.

## 4. What to keep as `style={}`

Keep inline `style` for:

- Animated values / Reanimated shared values
- Measured layout numbers
- Values that are not expressible as a utility (`transform` matrices, etc.)

`styled()` merges `className` with `style`; inline wins on conflict.

## 5. Remove Unistyles

```bash
npm uninstall react-native-unistyles
```

Remove `UnistylesProvider`, `StyleSheet.create` imports from `react-native-unistyles`, Babel / Metro Unistyles plugins if present.

```bash
rg "react-native-unistyles|UnistylesProvider|UnistylesRegistry|createStyleSheet" -g "*.{ts,tsx,js,jsx,json}"
```
