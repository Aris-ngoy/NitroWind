# Public API

## `NitroWindProvider`

Provides theme, window size, platform, and group/interaction context.

## `useStyle(className)`

Returns `{ style, flat, animation, native }`.

## `styled(Component)`

Adds a `className` prop, merges with `style`, forwards refs, and enables `group-*` variants when the `group` class is present.

## Pre-styled components

`View`, `Text`, `Pressable`, `Image`, `ScrollView`, `TextInput`, `TouchableOpacity`, and `FlatList` can be imported from `nitro-wind`.

## Engine

- `computeStyle(className, context)` — native Nitro path with JS fallback
- `isNativeEngineAvailable()`
- `clearEngineCache()`
- `setEngineThemeName(name)`
