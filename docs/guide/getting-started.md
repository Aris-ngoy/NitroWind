# Getting started

Install the library and Nitro Modules:

```bash
bun add nitro-wind react-native-nitro-modules
```

Wrap your tree with `NitroWindProvider` and use `styled()` or `useStyle()`:

```tsx
import { View, Text } from "react-native";
import { NitroWindProvider, styled, useStyle } from "nitro-wind";

const Box = styled(View);

export function App() {
	const { style } = useStyle("p-4 bg-red-500 dark:bg-blue-600");

	return (
		<NitroWindProvider>
			<Box className="flex-1 items-center justify-center">
				<Text style={style}>Hello nitro-wind</Text>
			</Box>
		</NitroWindProvider>
	);
}
```

## Expo Go

Expo Go cannot load custom native code. `nitro-wind` automatically uses the pure JavaScript engine from `nitro-wind-core` when the Nitro HybridObject is unavailable.

## Bare React Native / dev clients

Run Nitrogen codegen after cloning:

```bash
bun run codegen
```

Then build the iOS or Android app as usual. The C++ `StyleEngine` HybridObject is autolinked by Nitro.

## Example apps

- `apps/expo-example` — Expo Go / JS fallback showcase
- `apps/bare-example` — native C++ engine on React Native 0.86
- `apps/compare-example` — the same 120-row list and resolve bench on nitro-wind, NativeWind, and Uniwind. NativeWind and Uniwind have no headless resolve API, so Resolve Speed only reports nitro-wind; Rendering compares all three.
