# Public API

## `NitroWindProvider`

Provides theme, platform, and group/interaction context. Window size is not in this context — `useStyle` subscribes to dimensions only when the className has breakpoint variants.

## `useStyle(className)`

Returns `{ style, animation, native }`. `style` is already inflated (`shadowOffset`, `transform`) and `animation` is already parsed — callers do not inflate or re-tokenize. Invariant classNames skip theme and layout subscriptions.

## `styled(Component)`

Adds a `className` prop, merges with `style`, forwards refs, and enables `group-*` variants when the `group` class is present.

## Babel plugin (`nitro-wind/babel`)

Rewrites `react-native` `View`/`Text` imports to `nitro-wind` and hoists invariant static `className` literals into `StyleSheet.create`.

## Pre-styled components

`View`, `Text`, `Pressable`, `Image`, `ScrollView`, `TextInput`, `TouchableOpacity`, and `FlatList` can be imported from `nitro-wind`.

## Engine

- `computeStyle(className, context)` — native Nitro path with JS fallback
- `computeStaticStyle(className)` — inflated style dictionary for Babel `StyleSheet.create` hoisting
- `isNativeEngineAvailable()`
- `clearEngineCache()`
- `setEngineThemeName(name)`
