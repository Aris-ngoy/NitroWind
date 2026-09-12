# Styling

`nitro-wind` turns a Tailwind class string into a React Native style object. It does not parse stylesheets.

```text
"flex-1 items-center bg-white dark:bg-zinc-950"
  → { flex: 1, alignItems: "center", backgroundColor: "..." }
```

Unknown utilities are dropped. Validate with:

```bash
bunx nitro-wind validate "p-4 bg-red-500 dark:bg-blue-600"
```

## Supported families

| Family | Examples |
| --- | --- |
| Layout | `flex`, `flex-1`, `flex-row`, `items-center`, `justify-between`, `absolute`, `relative`, `overflow-hidden`, `z-10` |
| Spacing / size | `p-4`, `mx-2`, `gap-3`, `w-full`, `h-screen`, `min-w-0`, `w-1/2`, `w-[72px]` |
| Color | `bg-white`, `text-zinc-900`, `border-slate-200`, `tint-sky-500`, `bg-red-500/50` |
| Typography | `text-xl`, `font-bold`, `italic`, `underline`, `text-center`, `uppercase` |
| Borders / radius / shadow | `border`, `border-2`, `rounded-2xl`, `shadow-md` |
| Image | `object-cover`, `object-contain` |

Variants stack: `dark:`, `light:`, `ios:`, `android:`, `web:`, `sm:`, `md:`, `lg:`, `xl:`, `active:`, `hover:`, `focus:`, `group`, `group-active:`, `group-hover:`.

Arbitrary values use brackets: `w-[72px]`, `bg-[#4F46E5]`, `top-[12]`.

Theme tokens live in `nitro-wind-core`. Extend them with Tailwind v4 `@theme` in `global.css` and/or v3 `theme.extend` in `tailwind.config.js`. Do not import `global.css` in React Native. Do not add Tailwind plugins.

## Babel-mapped hosts

`plugins: ["nitro-wind/babel"]` remaps these `react-native` imports to `nitro-wind` and hoists invariant static `className` literals into `StyleSheet.create`:

`View`, `Text`, `Pressable`, `Image`, `ScrollView`, `TextInput`, `TouchableOpacity`, `FlatList`

Invariant strings (`p-4 bg-red-500`) skip theme and layout subscriptions. Strings with variants, `group`, or animation tokens stay on the runtime path. Platform-only variants (`ios:`, `android:`, `web:`) can still be resolved at build time when Metro knows the target platform.

Do not wrap these hosts with `styled()` / `withNitroWind()`.

## Extra `*ClassName` props

`styled()` maps any `*ClassName` prop onto the matching style or color prop.

| Prop | Becomes |
| --- | --- |
| `className` | `style` |
| `contentContainerClassName` | `contentContainerStyle` |
| `columnWrapperClassName` | `columnWrapperStyle` |
| `imageClassName` | `imageStyle` |
| `placeholderTextColorClassName` | `placeholderTextColor` |
| `cursorColorClassName` | `cursorColor` |
| `tintColorClassName` | `tintColor` |
| `trackColorOnClassName` | `trackColor.true` |
| `trackColorOffClassName` | `trackColor.false` |
| `thumbColorClassName` | `thumbColor` |

```tsx
<TextInput
  className="rounded-xl border border-zinc-200 px-3 py-2"
  placeholderTextColorClassName="text-zinc-400"
  cursorColorClassName="text-indigo-600"
/>
```

## `styled()` and `withNitroWind()`

Use for hosts **not** in the Babel list, and for third-party components that accept `style`.

```tsx
import { styled, withNitroWind } from "nitro-wind";
import { SafeAreaView, SectionList } from "react-native";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Image as ExpoImage } from "expo-image";

const Screen = styled(SafeAreaView);
const List = styled(SectionList);
const Sheet = styled(BottomSheetView);
export const Image = styled(ExpoImage);

const Progress = withNitroWind(SomeBar, {
  width: { fromClassName: "widthClassName", styleProperty: "width" },
});
```

`withUniwind` === `withNitroWind`. Wrap at module scope. Wrap once; re-export from a shared module if used in many files.

You can also import pre-styled hosts from `nitro-wind` itself (`View`, `Text`, `SafeAreaView`, `Modal`, `SectionList`, `KeyboardAvoidingView`, `Switch`, `ActivityIndicator`, …).

## `useStyle`

```tsx
import { useStyle } from "nitro-wind";

const { style, animation, native } = useStyle("rounded-full bg-indigo-600 px-3 py-1");
```

`style` is already inflated (`shadowOffset`, `transform`). Invariant class names do not re-render on rotation or theme change.

`useResolveClassNames(className)` is the Uniwind-shaped alias: it returns the style object only.

## Rules

- Inline `style` overrides `className` for the same property.
- Do not write `.card { padding: 16px }` or import a CSS entry file.
- Do not add `pt-safe` / `p-safe`. Use `styled(SafeAreaView)` or `useSafeAreaInsets()`.
- `cn()` / `tailwind-merge` is optional. nitro-wind does not auto-deduplicate conflicting utilities; last class wins inside the engine the same way Tailwind does on the web for most utilities. Prefer a `cn` helper when callers pass override `className` props.
