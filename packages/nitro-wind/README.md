# nitro-wind

**High-performance Tailwind CSS engine for React Native, powered by Nitro Modules.**

`nitro-wind` brings the familiar Tailwind utility-class API to React Native with a native C++ core. It delivers near-zero JavaScript style resolution, a JS fallback for Expo Go, and a MIT-licensed developer experience.

```tsx
import { NitroWindProvider, styled, useStyle } from "nitro-wind";
import { View, Text } from "react-native";

const Box = styled(View);

export function Example() {
	const style = useStyle("p-4 bg-red-500 dark:bg-blue-600 ios:p-6");

	return (
		<NitroWindProvider theme="dark">
			<Box className="flex-1 items-center justify-center">
				<Text className="text-white text-xl font-bold">Hello nitro-wind</Text>
			</Box>
		</NitroWindProvider>
	);
}
```

## Install

```bash
bun add nitro-wind react-native-nitro-modules
```

For Expo Go, the pure JavaScript engine is used automatically. Custom development builds and bare React Native apps can use the C++ Nitro HybridObject.

Optional Babel plugin (rewrites `react-native` `View`/`Text` imports so they accept `className`, and hoists invariant static `className`s into `StyleSheet.create`):

```js
module.exports = {
	plugins: ["nitro-wind/babel"],
};
```

## License

MIT
