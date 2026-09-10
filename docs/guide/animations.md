# Animations

Utility classes such as `animate-spin`, `animate-pulse`, `animate-bounce`, `transition-*`, `duration-*`, and `ease-*` are parsed by the engine.

`styled()` uses React Native's `Animated` API so animations work without extra dependencies.

For Reanimated 4, import the translation helpers:

```ts
import { translateClassNameToReanimated, getReanimated } from "nitro-wind";

const recipe = translateClassNameToReanimated("animate-spin duration-300");
```

The recipe maps onto `withRepeat` / `withTiming` / shared values when `react-native-reanimated` is installed (optional peer dependency).
