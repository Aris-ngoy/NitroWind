import { describe, expect, mock, test } from "bun:test";
import React from "react";
import TestRenderer from "react-test-renderer";

// styled.tsx had no dedicated tests before this file. Its dispatch was
// restructured to inline the fully-static branch directly into the outer
// component instead of delegating to a separate ContextFreeStyled component
// (see the comment in styled.tsx) — these tests exist to verify that
// restructuring renders the same observable output as before for each of
// the three render shapes (static / dynamic / interactive), not just that
// the dispatcher's internal branch it happens to take is the expected one.
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
	// Constructed unconditionally by reanimated.ts's useAnimatedClassName for
	// every InteractiveStyled instance, animated or not (see the `!recipe.name`
	// early-return there) — needed even for a non-animated interactive test.
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
		loop: () => ({ start: () => {}, stop: () => {} }),
		timing: () => ({ start: () => {}, stop: () => {} }),
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

const { styled } = await import("../styled");
const { NitroWindProvider } = await import("../provider");

interface BoxProps {
	className?: string;
	style?: unknown;
	testID?: string;
	onPressIn?: () => void;
	onPressOut?: () => void;
	disabled?: boolean;
}

function Box(props: BoxProps) {
	return React.createElement("View", props);
}

const StyledBox = styled(Box);

function render(element: React.ReactElement) {
	let renderer: TestRenderer.ReactTestRenderer | undefined;
	TestRenderer.act(() => {
		renderer = TestRenderer.create(element);
	});
	if (!renderer) throw new Error("render failed");
	return renderer;
}

// findByProps does a partial-props match against every instance in the tree,
// composite and host alike — a query like {testID: "box"} matches the
// StyledBox wrapper, the Box function component, AND the "View" host node,
// since all three receive that prop. Query by host type instead: there is
// exactly one "View" per test tree here.
function findView(renderer: TestRenderer.ReactTestRenderer) {
	const box = renderer.root.findByType(Box);
	return box.findByType("View" as unknown as React.ComponentType);
}

describe("styled() render shapes", () => {
	test("fully static className resolves via the inlined branch, no extra fiber", () => {
		const renderer = render(<StyledBox className="p-4 bg-red-500" />);
		expect(findView(renderer).props.style).toEqual({ padding: 16, backgroundColor: "#ef4444" });

		// The dispatcher itself must be the only fiber between the caller and the
		// underlying Box — no intermediate wrapper component for the static case.
		const instance = renderer.root.findByType(StyledBox as unknown as React.ComponentType);
		const boxInstance = renderer.root.findByType(Box);
		expect(instance.children.includes(boxInstance)).toBe(true);
		expect(instance.children.length).toBe(1);

		renderer.unmount();
	});

	test("static className merges an explicit style prop as an array, existing style wins position", () => {
		const explicitStyle = { margin: 4 };
		const renderer = render(<StyledBox className="p-4 bg-red-500" style={explicitStyle} />);
		expect(findView(renderer).props.style).toEqual([
			{ padding: 16, backgroundColor: "#ef4444" },
			explicitStyle,
		]);
		renderer.unmount();
	});

	test("no className passes the raw style prop through unchanged", () => {
		const explicitStyle = { margin: 4 };
		const renderer = render(<StyledBox style={explicitStyle} />);
		expect(findView(renderer).props.style).toBe(explicitStyle);
		renderer.unmount();
	});

	test("colorScheme-dependent className routes to the Dynamic shape and tracks theme", () => {
		function App({ theme }: { theme: "light" | "dark" }) {
			return (
				<NitroWindProvider theme={theme}>
					<StyledBox className="bg-white dark:bg-black" />
				</NitroWindProvider>
			);
		}

		const renderer = render(<App theme="light" />);
		expect(findView(renderer).props.style).toEqual({ backgroundColor: "#ffffff" });

		TestRenderer.act(() => {
			renderer.update(<App theme="dark" />);
		});
		expect(findView(renderer).props.style).toEqual({ backgroundColor: "#000000" });

		renderer.unmount();
	});

	test("interactive className routes to the Interactive shape and responds to press", () => {
		const renderer = render(<StyledBox className="active:opacity-50" />);

		expect(findView(renderer).props.style).toEqual({});

		TestRenderer.act(() => {
			findView(renderer).props.onPressIn();
		});
		expect(findView(renderer).props.style).toEqual({ opacity: 0.5 });

		TestRenderer.act(() => {
			findView(renderer).props.onPressOut();
		});
		expect(findView(renderer).props.style).toEqual({});

		renderer.unmount();
	});

	test("a colorScheme-only className does not re-render on an unrelated interaction change", () => {
		let renderCount = 0;
		function TrackedBox(props: BoxProps) {
			renderCount++;
			return <Box {...props} />;
		}
		const StyledTracked = styled(TrackedBox);

		function App() {
			return (
				<StyledBox className="active:opacity-50" testID="outer">
					<StyledTracked className="dark:bg-black" testID="inner" />
				</StyledBox>
			);
		}

		function findViewByTestId(renderer: TestRenderer.ReactTestRenderer, testID: string) {
			// Two "View" host nodes exist here (outer + inner), so findView's
			// single-match helper doesn't apply — pick the one with this testID.
			const views = renderer.root.findAllByType("View" as unknown as React.ComponentType);
			const match = views.find((view) => (view.props as { testID?: string }).testID === testID);
			if (!match) throw new Error(`no View with testID ${testID}`);
			return match;
		}

		const renderer = render(<App />);
		const outer = findViewByTestId(renderer, "outer") as unknown as {
			props: { onPressIn: () => void; onPressOut: () => void };
		};
		const initialRenderCount = renderCount;
		expect(initialRenderCount).toBeGreaterThan(0);

		// Pressing the outer element mounts InteractionProvider's nested store,
		// which the inner colorScheme-only element's DynamicStyled subscribes to
		// directly via useSyncExternalStore (it's a descendant, so it resolves
		// to that nested store, not the top-level one) — this subscription is
		// exactly what used to force every colorScheme-only descendant to
		// re-render on every press, independent of any parent-reference-equality
		// bailout React might otherwise apply.
		TestRenderer.act(() => {
			outer.props.onPressIn();
		});
		TestRenderer.act(() => {
			outer.props.onPressOut();
		});
		expect(renderCount).toBe(initialRenderCount);

		// A real theme change must still re-render it.
		TestRenderer.act(() => {
			renderer.update(
				<NitroWindProvider theme="dark">
					<App />
				</NitroWindProvider>,
			);
		});
		expect(renderCount).toBeGreaterThan(initialRenderCount);

		renderer.unmount();
	});
});
