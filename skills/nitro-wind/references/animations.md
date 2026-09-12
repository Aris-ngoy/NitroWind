# Animations

Two paths. Both are class names on `styled()` / Babel-mapped hosts.

| Path | Classes | Runtime | Extra install |
| --- | --- | --- | --- |
| Loops | `animate-spin`, `animate-pulse`, `animate-bounce`, `animate-ping` | React Native `Animated` | none |
| Enter / exit / layout | `uw-entering-*`, `uw-exiting-*`, `uw-layout-*` or `nw-*` | Reanimated 4 | `react-native-reanimated` |

`uw-` and `nw-` are aliases.

## Loops

```tsx
<View className="h-4 w-4 rounded-full bg-indigo-600 animate-spin" />
<Text className="text-zinc-500 animate-pulse">Loading</Text>
```

`animate-none` disables a loop. Pair with `duration-*`, `ease-*`, `transition-*` (`duration-300`, `ease-in-out`, `transition-all`).

## Enter / exit / layout

```bash
npx expo install react-native-reanimated
```

```tsx
<View className="rounded-xl bg-indigo-600 p-3 uw-entering-fade-in uw-entering-duration-400 uw-exiting-fade-out uw-layout-linear-transition uw-layout-springify" />
```

`styled()` maps tokens onto Reanimated `entering` / `exiting` / `layout` and wraps the host with `createAnimatedComponent`. If Reanimated is missing, tokens are ignored.

### Presets

Entering: `fade-in`, `fade-in-left`, `fade-in-right`, `fade-in-up`, `fade-in-down`, `slide-in-left`, `slide-in-right`, `slide-in-up`, `slide-in-down`, `zoom-in`, `zoom-in-left`, `zoom-in-right`, `bounce-in`, `bounce-in-up`, `flip-in-y-left`, `stretch-in-x`, `roll-in-left`, `pinwheel-in`

Exiting: `fade-out`, `fade-out-left`, `fade-out-right`, `slide-out-left`, `slide-out-right`, `zoom-out`, `bounce-out`, `flip-out-y-right`, `stretch-out-y`, `roll-out-right`, `pinwheel-out`

Layout: `linear-transition`, `fading-transition`, `jumping-transition`, `curved-transition`, `sequenced-transition`, `entry-exit-transition`

Write as `uw-entering-<preset>` or `nw-entering-<preset>`.

### Modifiers

Scope modifiers to the same axis:

```
uw-entering-fade-in
uw-entering-duration-300
uw-entering-delay-150
uw-entering-ease-out
uw-layout-linear-transition
uw-layout-springify
uw-layout-damping-15
uw-layout-stiffness-120
```

Easing values: `linear`, `in`, `out`, `in-out`, `bounce`.

## Lists

Put motion classes on **each row**, not on the list chrome. Keep a stable `key` / `keyExtractor`. Changing `key` remounts and retriggers entering.

```tsx
const ROW =
  "uw-entering-slide-in-left uw-entering-duration-300 uw-exiting-fade-out uw-layout-linear-transition uw-layout-springify";

<FlatList
  className="flex-1 bg-white dark:bg-zinc-950"
  contentContainerClassName="p-4 gap-2"
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View className={`rounded-xl bg-zinc-100 p-3 ${ROW}`}>{/* … */}</View>
  )}
/>
```

## Manual helpers

```ts
import { translateClassNameToReanimated, getReanimated } from "nitro-wind";

const recipe = translateClassNameToReanimated("animate-spin duration-300");
```

Prefer class names on styled hosts. Docs: https://nitro-wind.mintlify.app/guide/animations
