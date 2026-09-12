import { describe, expect, mock, test } from "bun:test";
import React, { useState } from "react";
import TestRenderer from "react-test-renderer";

mock.module("react-native", () => ({
	Appearance: {
		getColorScheme: () => "light",
		addChangeListener: () => ({ remove: () => {} }),
	},
	Dimensions: {
		get: () => ({ width: 390, height: 844 }),
	},
	I18nManager: { isRTL: false },
	Platform: { OS: "ios" },
	Pressable: "Pressable",
	View: "View",
	Text: "Text",
	FlatList: "FlatList",
	ScrollView: "ScrollView",
	TextInput: "TextInput",
	TouchableOpacity: "TouchableOpacity",
	TouchableHighlight: "TouchableHighlight",
	TouchableWithoutFeedback: "TouchableWithoutFeedback",
	TouchableNativeFeedback: "TouchableNativeFeedback",
	Image: "Image",
	ImageBackground: "ImageBackground",
	Switch: "Switch",
	ActivityIndicator: "ActivityIndicator",
	Button: "Button",
	RefreshControl: "RefreshControl",
	KeyboardAvoidingView: "KeyboardAvoidingView",
	Modal: "Modal",
	SafeAreaView: "SafeAreaView",
	SectionList: "SectionList",
	VirtualizedList: "VirtualizedList",
	StyleSheet: {
		absoluteFill: {
			position: "absolute",
			left: 0,
			right: 0,
			top: 0,
			bottom: 0,
		},
		create: (styles: unknown) => styles,
	},
	Animated: {
		Value: class {
			private v: number;
			constructor(v: number) {
				this.v = v;
			}
			setValue(v: number) {
				this.v = v;
			}
			interpolate(config: unknown) {
				return { __interpolated: true, config };
			}
		},
		timing: () => ({ start: (cb?: () => void) => cb?.(), stop: () => {} }),
		View: "Animated.View",
	},
	Easing: {
		linear: "linear",
		in: (fn: unknown) => fn,
		out: (fn: unknown) => fn,
		inOut: (fn: unknown) => fn,
		ease: "ease",
		cubic: "cubic",
	},
}));

const { GroupProvider, InteractionProvider, NitroWindProvider, useNitroWind } = await import(
	"../provider"
);

describe("NitroWind providers and stores", () => {
	test("nested GroupProvider and InteractionProvider update without setState during render errors", () => {
		const consoleErrors: string[] = [];
		const originalError = console.error;
		console.error = (...args: unknown[]) => {
			consoleErrors.push(args.map(String).join(" "));
			originalError(...args);
		};

		let setGroupActive: (val: boolean) => void = () => {};
		let observedGroupActive: boolean | undefined;
		let observedPressed: boolean | undefined;

		function Child() {
			const ctx = useNitroWind();
			observedGroupActive = ctx.group.active;
			observedPressed = ctx.interaction.pressed;
			return React.createElement("Text", null, String(ctx.group.active));
		}

		function TestParent() {
			const [active, setActive] = useState(false);
			setGroupActive = setActive;

			const group = { active, focus: false, hover: false };
			const interaction = { pressed: active };

			return React.createElement(
				GroupProvider,
				{ value: group },
				React.createElement(
					InteractionProvider,
					{ value: interaction },
					React.createElement(Child),
				),
			);
		}

		let renderer: TestRenderer.ReactTestRenderer | undefined;
		try {
			TestRenderer.act(() => {
				renderer = TestRenderer.create(
					React.createElement(NitroWindProvider, null, React.createElement(TestParent)),
				);
			});

			expect(observedGroupActive).toBe(false);
			expect(observedPressed).toBe(false);

			TestRenderer.act(() => {
				setGroupActive(true);
			});

			expect(observedGroupActive).toBe(true);
			expect(observedPressed).toBe(true);

			// Check that no "Cannot update a component ... while rendering a different component" error occurred
			const react19Error = consoleErrors.find((err) => err.includes("Cannot update a component"));
			expect(react19Error).toBeUndefined();
		} finally {
			console.error = originalError;
			renderer?.unmount();
		}
	});

	test("NitroWindProvider dynamically updates themeProp without console errors", () => {
		const consoleErrors: string[] = [];
		const originalError = console.error;
		console.error = (...args: unknown[]) => {
			consoleErrors.push(args.map(String).join(" "));
			originalError(...args);
		};

		let setTheme: (theme: "light" | "dark") => void = () => {};
		let observedTheme: string | undefined;

		function Child() {
			const ctx = useNitroWind();
			observedTheme = ctx.theme;
			return React.createElement("Text", null, ctx.theme);
		}

		function App() {
			const [theme, setAppTheme] = useState<"light" | "dark">("light");
			setTheme = setAppTheme;

			return React.createElement(NitroWindProvider, { theme }, React.createElement(Child));
		}

		let renderer: TestRenderer.ReactTestRenderer | undefined;
		try {
			TestRenderer.act(() => {
				renderer = TestRenderer.create(React.createElement(App));
			});

			expect(observedTheme).toBe("light");

			TestRenderer.act(() => {
				setTheme("dark");
			});

			expect(observedTheme).toBe("dark");

			const react19Error = consoleErrors.find((err) => err.includes("Cannot update a component"));
			expect(react19Error).toBeUndefined();
		} finally {
			console.error = originalError;
			renderer?.unmount();
		}
	});
});
