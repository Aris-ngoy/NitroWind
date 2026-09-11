import { describe, expect, mock, test } from "bun:test";
import React from "react";
import ReactTestRenderer, { act } from "react-test-renderer";

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
		timing: () => ({
			start: (cb?: () => void) => cb?.(),
		}),
		parallel: (animations: unknown[]) => ({
			start: (cb?: () => void) => cb?.(),
		}),
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

const {
	classToColor,
	classToStyle,
	getAccentColor,
	isClassProperty,
	isColorClassProperty,
	isStyleProperty,
	useAccentColor,
} = await import("../accents");

const {
	ActivityIndicator,
	FlatList,
	ScrollView,
	Switch,
	TextInput,
	View,
} = await import("../components");

const {
	LayoutDirection,
	NitroWind,
	NitroWindProvider,
	ScopedTheme,
	ScopedVariables,
	Uniwind,
	useUniwind,
} = await import("../index");

const { useStyle } = await import("../useStyle");

const {
	getCSSVariable,
	updateCSSVariables,
	useCSSVariable,
} = await import("../variables");

const { useResolveClassNames, withNitroWind, withUniwind } = await import("../withNitroWind");

describe("accents utility functions", () => {
	test("property name converters and predicates", () => {
		expect(classToStyle("className")).toBe("style");
		expect(classToStyle("contentContainerClassName")).toBe(
			"contentContainerStyle",
		);
		expect(classToStyle("columnWrapperClassName")).toBe("columnWrapperStyle");

		expect(classToColor("colorClassName")).toBe("color");
		expect(classToColor("placeholderTextColorClassName")).toBe(
			"placeholderTextColor",
		);
		expect(classToColor("cursorColorClassName")).toBe("cursorColor");

		expect(isColorClassProperty("placeholderTextColorClassName")).toBe(true);
		expect(isColorClassProperty("cursorColorClassName")).toBe(true);
		expect(isColorClassProperty("tintColorClassName")).toBe(true);
		expect(isColorClassProperty("colorClassName")).toBe(true);
		expect(isColorClassProperty("contentContainerClassName")).toBe(false);

		expect(isClassProperty("className")).toBe(true);
		expect(isClassProperty("contentContainerClassName")).toBe(true);
		expect(isClassProperty("style")).toBe(false);

		expect(isStyleProperty("style")).toBe(true);
		expect(isStyleProperty("contentContainerStyle")).toBe(true);
		expect(isStyleProperty("className")).toBe(false);
	});

	test("getAccentColor extracts accentColor and color utilities", () => {
		expect(getAccentColor("accent-red-500")).toBe("#ef4444");
		expect(getAccentColor("accent-blue-600")).toBe("#2563eb");
		expect(getAccentColor("text-emerald-500")).toBe("#10b981");
		expect(getAccentColor("")).toBeUndefined();
		expect(getAccentColor(undefined)).toBeUndefined();
	});

	test("useAccentColor hook returns resolved color in render", () => {
		let resolvedColor: string | undefined;
		function TestComp() {
			resolvedColor = useAccentColor("accent-indigo-500");
			return null;
		}

		act(() => {
			ReactTestRenderer.create(<TestComp />);
		});
		expect(resolvedColor).toBe("#6366f1");
	});
});

describe("CSS variables store & hooks", () => {
	test("updateCSSVariables and getCSSVariable round trip", () => {
		updateCSSVariables("dark", {
			"--brand-primary": "#a855f7",
			"--brand-secondary": "#ec4899",
		});
		updateCSSVariables("light", {
			"--brand-primary": "#7c3aed",
		});

		expect(
			getCSSVariable("--brand-primary", { scopedTheme: "dark" }),
		).toBe("#a855f7");
		expect(
			getCSSVariable("--brand-primary", { scopedTheme: "light" }),
		).toBe("#7c3aed");
		expect(
			getCSSVariable(["--brand-primary", "--brand-secondary"], {
				scopedTheme: "dark",
			}),
		).toEqual(["#a855f7", "#ec4899"]);
	});

	test("useCSSVariable hook reads variables and respects ScopedVariables", () => {
		updateCSSVariables("light", {
			"--card-bg": "#ffffff",
		});

		let readBg: unknown;
		let scopedBg: unknown;

		function Child() {
			readBg = useCSSVariable("--card-bg");
			return null;
		}

		function ScopedChild() {
			scopedBg = useCSSVariable("--card-bg");
			return null;
		}

		act(() => {
			ReactTestRenderer.create(
				<NitroWindProvider theme="light">
					<Child />
					<ScopedVariables variables={{ "--card-bg": "#f1f5f9" }}>
						<ScopedChild />
					</ScopedVariables>
				</NitroWindProvider>,
			);
		});

		expect(readBg).toBe("#ffffff");
		expect(scopedBg).toBe("#f1f5f9");
	});
});

describe("ScopedTheme and LayoutDirection", () => {
	test("ScopedTheme overrides theme for subtree", () => {
		let parentTheme: string | undefined;
		let childTheme: string | undefined;

		function ParentComp() {
			const u = useUniwind();
			parentTheme = u.theme;
			return null;
		}

		function ChildComp() {
			const u = useUniwind();
			childTheme = u.theme;
			return null;
		}

		act(() => {
			ReactTestRenderer.create(
				<NitroWindProvider theme="light">
					<ParentComp />
					<ScopedTheme theme="dark">
						<ChildComp />
					</ScopedTheme>
				</NitroWindProvider>,
			);
		});

		expect(parentTheme).toBe("light");
		expect(childTheme).toBe("dark");
	});

	test("LayoutDirection propagates RTL to useStyle context", () => {
		let resolvedRtlStyle: unknown;

		function RTLComp() {
			const { style } = useStyle("rtl:mr-4 ltr:ml-4");
			resolvedRtlStyle = style;
			return null;
		}

		act(() => {
			ReactTestRenderer.create(
				<NitroWindProvider theme="light">
					<LayoutDirection rtl={true}>
						<RTLComp />
					</LayoutDirection>
				</NitroWindProvider>,
			);
		});

		expect(resolvedRtlStyle).toEqual({ marginRight: 16 });
	});
});

describe("Uniwind and NitroWind public singleton", () => {
	test("hasAdaptiveThemes updates when switching to system vs explicit theme", () => {
		expect(Uniwind.themes).toEqual(["light", "dark"]);

		Uniwind.setTheme("dark");
		expect(Uniwind.currentTheme).toBe("dark");
		expect(Uniwind.hasAdaptiveThemes).toBe(false);

		Uniwind.setTheme("system");
		expect(Uniwind.hasAdaptiveThemes).toBe(true);
	});

	test("updateCSSVariables via Uniwind facade", () => {
		Uniwind.updateCSSVariables("dark", {
			"--test-var": 42,
		});
		expect(Uniwind.getCSSVariable("--test-var")).toBeDefined();
	});
});

describe("Components with accent and *ClassName props", () => {
	test("TextInput auto-extracts placeholderTextColorClassName and cursorColorClassName", () => {
		let tree: ReactTestRenderer.ReactTestRenderer | undefined;
		act(() => {
			tree = ReactTestRenderer.create(
				<TextInput
					className="p-2"
					placeholderTextColorClassName="accent-gray-400"
					cursorColorClassName="accent-blue-500"
				/>,
			);
		});

		const input = tree?.root.findByType("TextInput");
		expect(input.props.placeholderTextColor).toBe("#9ca3af");
		expect(input.props.cursorColor).toBe("#3b82f6");
	});

	test("Explicit color prop wins over *ClassName", () => {
		let tree: ReactTestRenderer.ReactTestRenderer | undefined;
		act(() => {
			tree = ReactTestRenderer.create(
				<TextInput
					placeholderTextColor="#ff0000"
					placeholderTextColorClassName="accent-gray-400"
				/>,
			);
		});

		const input = tree?.root.findByType("TextInput");
		expect(input.props.placeholderTextColor).toBe("#ff0000");
	});

	test("ScrollView merges contentContainerClassName into contentContainerStyle", () => {
		let tree: ReactTestRenderer.ReactTestRenderer | undefined;
		act(() => {
			tree = ReactTestRenderer.create(
				<ScrollView
					contentContainerClassName="p-4"
					contentContainerStyle={{ margin: 10 }}
				/>,
			);
		});

		const scroll = tree?.root.findByType("ScrollView");
		expect(scroll.props.contentContainerStyle).toEqual([
			{ padding: 16 },
			{ margin: 10 },
		]);
	});

	test("Switch auto-extracts trackColorOnClassName and trackColorOffClassName", () => {
		let tree: ReactTestRenderer.ReactTestRenderer | undefined;
		act(() => {
			tree = ReactTestRenderer.create(
				<Switch
					trackColorOnClassName="accent-emerald-500"
					trackColorOffClassName="accent-gray-300"
					thumbColorClassName="accent-white"
				/>,
			);
		});

		const sw = tree?.root.findByType("Switch");
		expect(sw.props.trackColor).toEqual({
			true: "#10b981",
			false: "#d1d5db",
		});
		expect(sw.props.thumbColor).toBe("#ffffff");
	});

	test("ActivityIndicator auto-extracts colorClassName", () => {
		let tree: ReactTestRenderer.ReactTestRenderer | undefined;
		act(() => {
			tree = ReactTestRenderer.create(
				<ActivityIndicator colorClassName="accent-purple-600" />,
			);
		});

		const indicator = tree?.root.findByType("ActivityIndicator");
		expect(indicator.props.color).toBe("#9333ea");
	});

	test("Components with endFillColorClassName", () => {
		let tree: ReactTestRenderer.ReactTestRenderer | undefined;
		act(() => {
			tree = ReactTestRenderer.create(
				<ScrollView endFillColorClassName="accent-emerald-500" />,
			);
		});

		const rendered = tree?.root.findByType("ScrollView" as any);
		expect(rendered.props.endFillColor).toBe("#10b981");
	});

	test("withNitroWind and withUniwind manual mapping mode", () => {
		expect(withUniwind).toBe(withNitroWind);

		interface CustomCardProps {
			titleStyle?: unknown;
			titleClassName?: string;
			accentColor?: string;
			accentClassName?: string;
		}

		function CustomCard(props: CustomCardProps) {
			return <View style={props.titleStyle as any} />;
		}

		const WrappedCard = withNitroWind(CustomCard, {
			titleStyle: { fromClassName: "titleClassName" },
			accentColor: {
				fromClassName: "accentClassName",
				styleProperty: "accentColor",
			},
		});

		let tree: ReactTestRenderer.ReactTestRenderer | undefined;
		act(() => {
			tree = ReactTestRenderer.create(
				<WrappedCard
					titleClassName="p-6"
					accentClassName="accent-rose-500"
				/>,
			);
		});

		const rendered = tree?.root.findByType(CustomCard);
		expect(rendered.props.titleStyle).toEqual({ padding: 24 });
		expect(rendered.props.accentColor).toBe("#f43f5e");
	});

	test("useResolveClassNames resolves class names synchronously into style", () => {
		let resolved: Record<string, unknown> | undefined;
		function TestComp() {
			resolved = useResolveClassNames("p-4 bg-emerald-500");
			return null;
		}

		act(() => {
			ReactTestRenderer.create(<TestComp />);
		});
		expect(resolved).toEqual({
			padding: 16,
			backgroundColor: "#10b981",
		});
	});
});
