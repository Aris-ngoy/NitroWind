# NitroWind

**High-performance Tailwind CSS engine for React Native, powered by Nitro Modules**

`nitro-wind` brings the familiar Tailwind utility-class API to React Native with a native C++ core. It delivers near-zero JavaScript style resolution, a JS fallback for Expo Go, and excellent performance while keeping Tailwind's developer experience.

**Fully free and open source** under the MIT license.

## Packages

```
packages/
  nitro-wind/          Main React Native library (C++ Nitro HybridObject + JS API)
  nitro-wind-core/     Shared tokenizer, parser, theme tokens, JS engine
  nitro-wind-cli/      Theme generation and className validation
apps/
  expo-example/        Expo SDK 57 (JS fallback)
  bare-example/        React Native 0.86 (native C++ engine)
  compare-example/     StyleSheet vs nitro-wind vs NativeWind vs Uniwind
benchmarks/            JS engine throughput suite
docs/                  VitePress documentation
```

## Getting started

```bash
bun install
bun run check
bun test packages/nitro-wind-core packages/nitro-wind
bun run bench
```

### Native codegen

```bash
cd packages/nitro-wind
bunx nitrogen
```

### Example apps

```bash
cd apps/bare-example && bun run ios
cd apps/expo-example && bun run start
cd apps/compare-example && bun run start
```

## Public API

```tsx
import { View, Text } from "react-native";
import { styled, useStyle, NitroWindProvider } from "nitro-wind";

const StyledView = styled(View);

function Example() {
  const { style } = useStyle("p-4 bg-red-500 dark:bg-blue-600 ios:p-6");

  return (
    <NitroWindProvider theme="dark">
      <StyledView className="flex-1 items-center justify-center">
        <Text className="text-white text-xl font-bold">Hello nitro-wind</Text>
      </StyledView>
    </NitroWindProvider>
  );
}
```

## License

MIT — free for everyone, forever.
