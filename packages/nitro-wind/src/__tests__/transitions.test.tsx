import { beforeEach, describe, expect, mock, test } from "bun:test";
import React from "react";
import TestRenderer from "react-test-renderer";
import type { NativeThemeTransitionApi } from "../transitions";

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
		create: (s: unknown) => s,
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
			stop: () => {},
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
	NitroWind,
	NitroWindProvider,
	ThemeTransitionOverlay,
	ThemeTransitionPreset,
	AppearanceOverride,
	Uniwind,
	resolveThemeBackground,
	requestThemeTransition,
	isReanimatedAvailable,
	setGlobalTransitionHandler,
	getNativeThemeTransition,
	cancelActiveThemeTransition,
	setNativeThemeTransitionForTesting,
} = await import("../index");

describe("ThemeTransitionPreset enum", () => {
	test("defines all 15 theme transition presets with correct numeric values", () => {
		expect(ThemeTransitionPreset.None).toBe(0);
		expect(ThemeTransitionPreset.Fade).toBe(1);
		expect(ThemeTransitionPreset.SlideRightToLeft).toBe(2);
		expect(ThemeTransitionPreset.SlideLeftToRight).toBe(3);
		expect(ThemeTransitionPreset.CircleTopRight).toBe(4);
		expect(ThemeTransitionPreset.CircleTopLeft).toBe(5);
		expect(ThemeTransitionPreset.CircleBottomRight).toBe(6);
		expect(ThemeTransitionPreset.CircleBottomLeft).toBe(7);
		expect(ThemeTransitionPreset.CircleCenter).toBe(8);
		expect(ThemeTransitionPreset.Blur).toBe(9);
		expect(ThemeTransitionPreset.BlurRightToLeft).toBe(10);
		expect(ThemeTransitionPreset.BlurLeftToRight).toBe(11);
		expect(ThemeTransitionPreset.CircleFromOrigin).toBe(12);
		expect(ThemeTransitionPreset.SlideFromOrigin).toBe(13);
		expect(ThemeTransitionPreset.BlurFromOrigin).toBe(14);
	});
});

describe("resolveThemeBackground", () => {
	test("resolves light and dark defaults", () => {
		expect(resolveThemeBackground("light")).toBe("#ffffff");
		expect(resolveThemeBackground("dark")).toBe("#09090b");
	});

	test("resolves named theme colors", () => {
		expect(resolveThemeBackground("coffee")).toBe("#1f1610");
		expect(resolveThemeBackground("emerald")).toBe("#022c22");
		expect(resolveThemeBackground("ocean")).toBe("#082f49");
		expect(resolveThemeBackground("rose")).toBe("#4c0519");
		expect(resolveThemeBackground("purple")).toBe("#3b0764");
	});

	test("falls back gracefully for unknown themes", () => {
		expect(resolveThemeBackground("custom-unregistered")).toBe("#ffffff");
	});
});

describe("NitroWind and Uniwind public API", () => {
	test("Uniwind is an alias of NitroWind", () => {
		expect(Uniwind).toBe(NitroWind);
		expect(typeof NitroWind.setTheme).toBe("function");
		expect(typeof NitroWind.getTheme).toBe("function");
		expect(typeof Uniwind.setTheme).toBe("function");
		expect(typeof Uniwind.getTheme).toBe("function");
	});

	test("setTheme updates getTheme value", () => {
		NitroWind.setTheme("dark");
		expect(NitroWind.getTheme()).toBe("dark");
		expect(Uniwind.getTheme()).toBe("dark");

		Uniwind.setTheme("coffee");
		expect(NitroWind.getTheme()).toBe("coffee");
		expect(Uniwind.getTheme()).toBe("coffee");

		NitroWind.setTheme("light", { preset: ThemeTransitionPreset.Fade, duration: 300 });
		expect(NitroWind.getTheme()).toBe("light");
	});

	test("ThemeTransitionOverlay mounts safely inside provider", () => {
		let renderer: TestRenderer.ReactTestRenderer | undefined;
		TestRenderer.act(() => {
			renderer = TestRenderer.create(
				<NitroWindProvider>
					<ThemeTransitionOverlay />
				</NitroWindProvider>,
			);
		});

		expect(renderer).toBeDefined();
		TestRenderer.act(() => {
			renderer?.unmount();
		});
	});
});

describe("Transition lifecycle and presets", () => {
	beforeEach(() => {
		setGlobalTransitionHandler(null);
	});

	test("isReanimatedAvailable returns boolean", () => {
		expect(typeof isReanimatedAvailable()).toBe("boolean");
	});

	test("requestThemeTransition returns false when no overlay is mounted", () => {
		const handled = requestThemeTransition({
			fromTheme: "light",
			toTheme: "dark",
			preset: ThemeTransitionPreset.Fade,
			duration: 300,
		});
		expect(handled).toBe(false);
	});

	test("ThemeTransitionPreset.None immediately commits and completes", () => {
		let renderer: TestRenderer.ReactTestRenderer | undefined;
		TestRenderer.act(() => {
			renderer = TestRenderer.create(
				<NitroWindProvider>
					<ThemeTransitionOverlay />
				</NitroWindProvider>,
			);
		});

		let committed = false;
		let completed = false;

		TestRenderer.act(() => {
			const handled = requestThemeTransition({
				fromTheme: "light",
				toTheme: "dark",
				preset: ThemeTransitionPreset.None,
				duration: 300,
				onCommit: () => {
					committed = true;
				},
				onComplete: () => {
					completed = true;
				},
			});
			expect(handled).toBe(true);
		});

		expect(committed).toBe(true);
		expect(completed).toBe(true);

		TestRenderer.act(() => {
			renderer?.unmount();
		});
	});

	test("ThemeTransitionPreset.Fade commits at start to allow crossfade reveal", () => {
		let renderer: TestRenderer.ReactTestRenderer | undefined;
		TestRenderer.act(() => {
			renderer = TestRenderer.create(
				<NitroWindProvider>
					<ThemeTransitionOverlay />
				</NitroWindProvider>,
			);
		});

		let committed = false;
		let completed = false;

		TestRenderer.act(() => {
			const handled = requestThemeTransition({
				fromTheme: "light",
				toTheme: "coffee",
				preset: ThemeTransitionPreset.Fade,
				duration: 300,
				onCommit: () => {
					committed = true;
				},
				onComplete: () => {
					completed = true;
				},
			});
			expect(handled).toBe(true);
		});

		expect(committed).toBe(true);
		expect(completed).toBe(true);

		TestRenderer.act(() => {
			renderer?.unmount();
		});
	});

	test("Circle and Slide presets trigger onCommit and onComplete", () => {
		const presetsToTest = [
			ThemeTransitionPreset.CircleCenter,
			ThemeTransitionPreset.CircleTopRight,
			ThemeTransitionPreset.CircleTopLeft,
			ThemeTransitionPreset.CircleBottomRight,
			ThemeTransitionPreset.CircleBottomLeft,
			ThemeTransitionPreset.SlideRightToLeft,
			ThemeTransitionPreset.SlideLeftToRight,
			ThemeTransitionPreset.Blur,
			ThemeTransitionPreset.BlurRightToLeft,
			ThemeTransitionPreset.BlurLeftToRight,
			ThemeTransitionPreset.CircleFromOrigin,
			ThemeTransitionPreset.SlideFromOrigin,
			ThemeTransitionPreset.BlurFromOrigin,
		];

		for (const preset of presetsToTest) {
			let renderer: TestRenderer.ReactTestRenderer | undefined;
			TestRenderer.act(() => {
				renderer = TestRenderer.create(
					<NitroWindProvider>
						<ThemeTransitionOverlay />
					</NitroWindProvider>,
				);
			});

			let committed = false;
			let completed = false;

			TestRenderer.act(() => {
				const handled = requestThemeTransition({
					fromTheme: "light",
					toTheme: "emerald",
					preset,
					duration: 200,
					onCommit: () => {
						committed = true;
					},
					onComplete: () => {
						completed = true;
					},
				});
				expect(handled).toBe(true);
			});

			expect(committed).toBe(true);
			expect(completed).toBe(true);

			TestRenderer.act(() => {
				renderer?.unmount();
			});
		}
	});

	test("Rapid theme transitions commit previous transition if not yet committed", () => {
		let renderer: TestRenderer.ReactTestRenderer | undefined;
		TestRenderer.act(() => {
			renderer = TestRenderer.create(
				<NitroWindProvider>
					<ThemeTransitionOverlay />
				</NitroWindProvider>,
			);
		});

		let firstCommitted = false;
		let secondCommitted = false;
		let secondCompleted = false;

		TestRenderer.act(() => {
			requestThemeTransition({
				fromTheme: "light",
				toTheme: "coffee",
				preset: ThemeTransitionPreset.CircleCenter,
				duration: 500,
				onCommit: () => {
					firstCommitted = true;
				},
			});

			requestThemeTransition({
				fromTheme: "coffee",
				toTheme: "ocean",
				preset: ThemeTransitionPreset.CircleCenter,
				duration: 500,
				onCommit: () => {
					secondCommitted = true;
				},
				onComplete: () => {
					secondCompleted = true;
				},
			});
		});

		expect(firstCommitted).toBe(true);
		expect(secondCommitted).toBe(true);
		expect(secondCompleted).toBe(true);

		TestRenderer.act(() => {
			renderer?.unmount();
		});
	});
});

describe("Native Theme Transitions", () => {
	beforeEach(() => {
		setNativeThemeTransitionForTesting(undefined);
	});

	test("returns null when NativeThemeTransition is not installed", () => {
		expect(getNativeThemeTransition()).toBeNull();
	});

	test("uses NativeThemeTransition when available", () => {
		let preparedPreset: ThemeTransitionPreset | null = null;
		let preparedTheme: string | null = null;
		let preparedDuration = 0;
		let animatedAppearance: AppearanceOverride | null = null;
		let committed = false;
		let completed = false;
		let cancelled = false;

		const mockNative: NativeThemeTransitionApi = {
			isAvailable: () => true,
			prepareTransition: (preset, targetTheme, durationMs) => {
				preparedPreset = preset;
				preparedTheme = targetTheme;
				preparedDuration = durationMs ?? 0;
			},
			animateTransition: (appearance, preAnimationCallback) => {
				animatedAppearance = appearance;
				preAnimationCallback();
			},
			cancelTransition: () => {
				cancelled = true;
			},
		};

		setNativeThemeTransitionForTesting(mockNative);
		expect(getNativeThemeTransition()).toBe(mockNative);

		const handled = requestThemeTransition({
			fromTheme: "light",
			toTheme: "dark",
			preset: ThemeTransitionPreset.CircleCenter,
			duration: 350,
			onCommit: () => {
				committed = true;
			},
			onComplete: () => {
				completed = true;
			},
		});

		expect(handled).toBe(true);
		expect(preparedPreset).toBe(ThemeTransitionPreset.CircleCenter);
		expect(preparedTheme).toBe("dark");
		expect(preparedDuration).toBe(350);
		expect(animatedAppearance).toBe(2);
		expect(committed).toBe(true);
		expect(completed).toBe(true);

		cancelActiveThemeTransition();
		expect(cancelled).toBe(true);
	});

	test("falls back to JS overlay when native prepareTransition throws", () => {
		let jsCommitted = false;
		let jsCompleted = false;

		const mockNative = {
			isAvailable: () => true,
			prepareTransition: () => {
				throw new Error("Window snapshot unavailable");
			},
			animateTransition: () => {},
			cancelTransition: () => {},
		};

		setNativeThemeTransitionForTesting(mockNative);

		let renderer: TestRenderer.ReactTestRenderer | undefined;
		TestRenderer.act(() => {
			renderer = TestRenderer.create(
				<NitroWindProvider>
					<ThemeTransitionOverlay />
				</NitroWindProvider>,
			);
		});

		TestRenderer.act(() => {
			const handled = requestThemeTransition({
				fromTheme: "light",
				toTheme: "coffee",
				preset: ThemeTransitionPreset.Fade,
				duration: 250,
				onCommit: () => {
					jsCommitted = true;
				},
				onComplete: () => {
					jsCompleted = true;
				},
			});
			expect(handled).toBe(true);
		});

		expect(jsCommitted).toBe(true);
		expect(jsCompleted).toBe(true);

		TestRenderer.act(() => {
			renderer?.unmount();
		});
	});
});
