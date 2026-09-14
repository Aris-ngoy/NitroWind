import {
	type ThemeTransitionOptions,
	ThemeTransitionPreset,
	type TransitionOrigin,
} from "nitro-wind-core";
import {
	AppearanceOverride,
	type NativeThemeTransition,
} from "./specs/NativeThemeTransition.nitro";

export { AppearanceOverride };
import {
	type ComponentType,
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	Dimensions,
	Platform,
	Animated as RNAnimated,
	Easing as RNEasing,
	StyleSheet,
	View,
} from "react-native";
import { getReanimated } from "./reanimated";

export { ThemeTransitionPreset, type ThemeTransitionOptions, type TransitionOrigin };

export interface ActiveTransition {
	id: number;
	fromTheme: string;
	toTheme: string;
	preset: ThemeTransitionPreset;
	duration: number;
	origin?: TransitionOrigin;
	overlayColor?: string;
	onCommit?: () => void;
	onComplete?: () => void;
}

let nextTransitionId = 1;
let globalStartTransition: ((transition: Omit<ActiveTransition, "id">) => void) | null = null;
let inFlightTransition: ActiveTransition | null = null;

export function setGlobalTransitionHandler(
	handler: ((transition: Omit<ActiveTransition, "id">) => void) | null,
): void {
	globalStartTransition = handler;
}

export type NativeThemeTransitionApi = Pick<
	NativeThemeTransition,
	"prepareTransition" | "animateTransition" | "cancelTransition" | "isAvailable"
>;

let nativeThemeTransition: NativeThemeTransitionApi | null | undefined = undefined;

function nativeModuleInstalled(): boolean {
	try {
		const { TurboModuleRegistry } = require("react-native") as typeof import("react-native");
		return TurboModuleRegistry.get("NitroModules") != null;
	} catch {
		return false;
	}
}

export function getNativeThemeTransition(): NativeThemeTransitionApi | null {
	if (nativeThemeTransition !== undefined) return nativeThemeTransition;
	nativeThemeTransition = null;
	if (Platform.OS !== "ios" && Platform.OS !== "android") return null;
	if (!nativeModuleInstalled()) return null;
	try {
		type NitroModulesModule = typeof import("react-native-nitro-modules");
		const { NitroModules } = require("react-native-nitro-modules") as NitroModulesModule;
		if (!NitroModules.hasHybridObject("NativeThemeTransition")) return null;
		const obj = NitroModules.createHybridObject<NativeThemeTransition>("NativeThemeTransition");
		if (obj?.isAvailable()) {
			nativeThemeTransition = obj;
		}
	} catch {
		nativeThemeTransition = null;
	}
	return nativeThemeTransition;
}

export function setNativeThemeTransitionForTesting(
	instance: NativeThemeTransitionApi | null | undefined,
): void {
	nativeThemeTransition = instance;
}

export function cancelActiveThemeTransition(): void {
	const native = getNativeThemeTransition();
	if (native) {
		native.cancelTransition();
	}
}

function resolveAppearanceOverride(theme: string): AppearanceOverride {
	if (
		theme === "dark" ||
		theme.includes("dark") ||
		theme.includes("night") ||
		theme.includes("black")
	) {
		return AppearanceOverride.Dark;
	}
	if (theme === "light") {
		return AppearanceOverride.Light;
	}
	return AppearanceOverride.Unspecified;
}

export function requestThemeTransition(transition: Omit<ActiveTransition, "id">): boolean {
	console.log(
		`[NitroWind] requestThemeTransition: preset=${transition.preset} native=${Boolean(getNativeThemeTransition())} globalHandler=${Boolean(globalStartTransition)}`,
	);
	if (Platform.OS === "web") {
		return runWebViewTransition(transition);
	}

	const native = getNativeThemeTransition();
	if (native) {
		const override = resolveAppearanceOverride(transition.toTheme);
		const duration = transition.duration ?? 400;
		try {
			native.prepareTransition(transition.preset, transition.toTheme, duration, transition.origin);
			native.animateTransition(override, () => {
				transition.onCommit?.();
				transition.onComplete?.();
			});
			return true;
		} catch {
			native.cancelTransition();
		}
	}

	if (globalStartTransition) {
		globalStartTransition(transition);
		return true;
	}
	return false;
}

const THEME_BACKGROUNDS: Record<string, string> = {
	dark: "#09090b",
	light: "#ffffff",
	coffee: "#1f1610",
	ocean: "#082f49",
	emerald: "#022c22",
	rose: "#4c0519",
	purple: "#3b0764",
};

export function resolveThemeBackground(theme: string): string {
	if (theme in THEME_BACKGROUNDS) return THEME_BACKGROUNDS[theme] as string;
	if (theme.includes("dark") || theme.includes("night") || theme.includes("black")) {
		return "#09090b";
	}
	return "#ffffff";
}

function runWebViewTransition(transition: Omit<ActiveTransition, "id">): boolean {
	const doc =
		typeof globalThis !== "undefined"
			? (
					globalThis as unknown as {
						document?: {
							createElement: (tag: string) => {
								id: string;
								textContent: string;
								remove: () => void;
							};
							head: { appendChild: (node: unknown) => void };
							startViewTransition?: (callback: () => void) => { finished: Promise<void> };
						};
					}
				).document
			: undefined;

	if (!doc) return false;

	const duration = transition.duration || 350;
	const preset = transition.preset;

	if (preset === ThemeTransitionPreset.None) {
		transition.onCommit?.();
		transition.onComplete?.();
		return true;
	}

	if (typeof doc.startViewTransition !== "function") {
		transition.onCommit?.();
		transition.onComplete?.();
		return false;
	}

	const styleEl = doc.createElement("style");
	styleEl.id = `nw-transition-${Date.now()}`;

	let keyframes = "";
	let animationRule = "";

	switch (preset) {
		case ThemeTransitionPreset.Fade:
			keyframes = `
				@keyframes nw-fade-out { from { opacity: 1; } to { opacity: 0; } }
				@keyframes nw-fade-in { from { opacity: 0; } to { opacity: 1; } }
			`;
			animationRule = `
				::view-transition-old(root) { animation: ${duration}ms ease-out both nw-fade-out; }
				::view-transition-new(root) { animation: ${duration}ms ease-in both nw-fade-in; }
			`;
			break;
		case ThemeTransitionPreset.SlideRightToLeft:
			keyframes = `
				@keyframes nw-slide-rtl-old { from { transform: translateX(0); } to { transform: translateX(-100%); } }
				@keyframes nw-slide-rtl-new { from { transform: translateX(100%); } to { transform: translateX(0); } }
			`;
			animationRule = `
				::view-transition-old(root) { animation: ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) both nw-slide-rtl-old; }
				::view-transition-new(root) { animation: ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) both nw-slide-rtl-new; }
			`;
			break;
		case ThemeTransitionPreset.SlideLeftToRight:
			keyframes = `
				@keyframes nw-slide-ltr-old { from { transform: translateX(0); } to { transform: translateX(100%); } }
				@keyframes nw-slide-ltr-new { from { transform: translateX(-100%); } to { transform: translateX(0); } }
			`;
			animationRule = `
				::view-transition-old(root) { animation: ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) both nw-slide-ltr-old; }
				::view-transition-new(root) { animation: ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) both nw-slide-ltr-new; }
			`;
			break;
		case ThemeTransitionPreset.CircleTopRight:
			keyframes = `
				@keyframes nw-circle-tr {
					from { clip-path: circle(0% at top right); }
					to { clip-path: circle(150% at top right); }
				}
			`;
			animationRule = `
				::view-transition-old(root) { z-index: 1; }
				::view-transition-new(root) { z-index: 2; animation: ${duration}ms ease-out both nw-circle-tr; }
			`;
			break;
		case ThemeTransitionPreset.CircleTopLeft:
			keyframes = `
				@keyframes nw-circle-tl {
					from { clip-path: circle(0% at top left); }
					to { clip-path: circle(150% at top left); }
				}
			`;
			animationRule = `
				::view-transition-old(root) { z-index: 1; }
				::view-transition-new(root) { z-index: 2; animation: ${duration}ms ease-out both nw-circle-tl; }
			`;
			break;
		case ThemeTransitionPreset.CircleBottomRight:
			keyframes = `
				@keyframes nw-circle-br {
					from { clip-path: circle(0% at bottom right); }
					to { clip-path: circle(150% at bottom right); }
				}
			`;
			animationRule = `
				::view-transition-old(root) { z-index: 1; }
				::view-transition-new(root) { z-index: 2; animation: ${duration}ms ease-out both nw-circle-br; }
			`;
			break;
		case ThemeTransitionPreset.CircleBottomLeft:
			keyframes = `
				@keyframes nw-circle-bl {
					from { clip-path: circle(0% at bottom left); }
					to { clip-path: circle(150% at bottom left); }
				}
			`;
			animationRule = `
				::view-transition-old(root) { z-index: 1; }
				::view-transition-new(root) { z-index: 2; animation: ${duration}ms ease-out both nw-circle-bl; }
			`;
			break;
		case ThemeTransitionPreset.CircleCenter:
			keyframes = `
				@keyframes nw-circle-center {
					from { clip-path: circle(0% at center); }
					to { clip-path: circle(150% at center); }
				}
			`;
			animationRule = `
				::view-transition-old(root) { z-index: 1; }
				::view-transition-new(root) { z-index: 2; animation: ${duration}ms ease-out both nw-circle-center; }
			`;
			break;
		case ThemeTransitionPreset.CircleFromOrigin: {
			const ox = transition.origin ? `${transition.origin.x}px` : "50%";
			const oy = transition.origin ? `${transition.origin.y}px` : "50%";
			keyframes = `
				@keyframes nw-circle-origin {
					from { clip-path: circle(0% at ${ox} ${oy}); }
					to { clip-path: circle(150% at ${ox} ${oy}); }
				}
			`;
			animationRule = `
				::view-transition-old(root) { z-index: 1; }
				::view-transition-new(root) { z-index: 2; animation: ${duration}ms ease-out both nw-circle-origin; }
			`;
			break;
		}
		case ThemeTransitionPreset.SlideFromOrigin: {
			const ox = transition.origin ? transition.origin.x : 0.5;
			keyframes = `
				@keyframes nw-slide-origin {
					from { clip-path: inset(0 calc(100% - ${ox}px) 0 ${ox}px); }
					to { clip-path: inset(0 0 0 0); }
				}
			`;
			animationRule = `
				::view-transition-old(root) { z-index: 1; }
				::view-transition-new(root) { z-index: 2; animation: ${duration}ms ease-out both nw-slide-origin; }
			`;
			break;
		}
		case ThemeTransitionPreset.BlurFromOrigin: {
			const ox = transition.origin ? transition.origin.x : 0.5;
			keyframes = `
				@keyframes nw-blur-origin-old {
					from { filter: blur(0px); clip-path: inset(0 0 0 0); }
					to { filter: blur(10px); clip-path: inset(0 calc(100% - ${ox}px) 0 ${ox}px); }
				}
				@keyframes nw-blur-origin-new {
					from { filter: blur(10px); }
					to { filter: blur(0px); }
				}
			`;
			animationRule = `
				::view-transition-old(root) { z-index: 1; animation: ${duration}ms ease-out both nw-blur-origin-old; }
				::view-transition-new(root) { z-index: 2; animation: ${duration}ms ease-in both nw-blur-origin-new; }
			`;
			break;
		}
		case ThemeTransitionPreset.Blur:
		case ThemeTransitionPreset.BlurRightToLeft:
		case ThemeTransitionPreset.BlurLeftToRight:
			keyframes = `
				@keyframes nw-blur-out { from { filter: blur(0px); opacity: 1; } to { filter: blur(20px); opacity: 0; } }
				@keyframes nw-blur-in { from { filter: blur(20px); opacity: 0; } to { filter: blur(0px); opacity: 1; } }
			`;
			animationRule = `
				::view-transition-old(root) { animation: ${duration}ms ease-out both nw-blur-out; }
				::view-transition-new(root) { animation: ${duration}ms ease-in both nw-blur-in; }
			`;
			break;
	}

	styleEl.textContent = `${keyframes}\n${animationRule}`;
	doc.head.appendChild(styleEl);

	const viewTransition = doc.startViewTransition(() => {
		transition.onCommit?.();
		transition.onComplete?.();
	});

	viewTransition.finished
		.catch(() => {})
		.finally(() => {
			styleEl.remove();
		});

	return true;
}

function getPresetShapeStyle(
	preset: ThemeTransitionPreset,
	radius: number,
	diameter: number,
	width: number,
	height: number,
	color: string,
	origin?: TransitionOrigin,
) {
	switch (preset) {
		case ThemeTransitionPreset.CircleCenter:
			return {
				position: "absolute" as const,
				top: (height - diameter) / 2,
				left: (width - diameter) / 2,
				width: diameter,
				height: diameter,
				borderRadius: radius,
				backgroundColor: color,
			};
		case ThemeTransitionPreset.CircleFromOrigin: {
			const cx = origin ? origin.x : width / 2;
			const cy = origin ? origin.y : height / 2;
			return {
				position: "absolute" as const,
				top: cy - radius,
				left: cx - radius,
				width: diameter,
				height: diameter,
				borderRadius: radius,
				backgroundColor: color,
			};
		}
		case ThemeTransitionPreset.CircleTopRight:
			return {
				position: "absolute" as const,
				top: -radius,
				right: -radius,
				width: diameter,
				height: diameter,
				borderRadius: radius,
				backgroundColor: color,
			};
		case ThemeTransitionPreset.CircleTopLeft:
			return {
				position: "absolute" as const,
				top: -radius,
				left: -radius,
				width: diameter,
				height: diameter,
				borderRadius: radius,
				backgroundColor: color,
			};
		case ThemeTransitionPreset.CircleBottomRight:
			return {
				position: "absolute" as const,
				bottom: -radius,
				right: -radius,
				width: diameter,
				height: diameter,
				borderRadius: radius,
				backgroundColor: color,
			};
		case ThemeTransitionPreset.CircleBottomLeft:
			return {
				position: "absolute" as const,
				bottom: -radius,
				left: -radius,
				width: diameter,
				height: diameter,
				borderRadius: radius,
				backgroundColor: color,
			};
		default:
			return {
				...(StyleSheet.absoluteFill as unknown as Record<string, unknown>),
				backgroundColor: color,
			};
	}
}

type SharedValue = { value: number };
type AnimatedStyle = Record<string, unknown>;
type TimingCallback = (finished?: boolean) => void;
type TimingFn = (
	toValue: number,
	config?: { duration?: number; easing?: unknown },
	callback?: TimingCallback,
) => number;
type EasingFunction = (value: number) => number;
type EasingLike = {
	out?: (easing: EasingFunction) => EasingFunction;
	cubic?: EasingFunction;
};
type RunOnJS = <T extends (...args: never[]) => unknown>(fn: T) => T;

interface ReanimatedApi {
	View: ComponentType<Record<string, unknown>>;
	useSharedValue: (initialValue: number) => SharedValue;
	useAnimatedStyle: (updater: () => AnimatedStyle) => AnimatedStyle;
	withTiming: TimingFn;
	Easing?: EasingLike;
	runOnJS?: RunOnJS;
}

interface ReanimatedLike extends Omit<ReanimatedApi, "View"> {
	default?: ReanimatedApi;
	View?: ComponentType<Record<string, unknown>>;
}

export function isReanimatedAvailable(): boolean {
	const reanimated = getReanimated() as ReanimatedLike | null;
	if (!reanimated) return false;
	const useSharedValue = reanimated.useSharedValue ?? reanimated.default?.useSharedValue;
	const useAnimatedStyle = reanimated.useAnimatedStyle ?? reanimated.default?.useAnimatedStyle;
	const withTiming = reanimated.withTiming ?? reanimated.default?.withTiming;
	return (
		typeof useSharedValue === "function" &&
		typeof useAnimatedStyle === "function" &&
		typeof withTiming === "function"
	);
}

function ReanimatedOverlayItem({
	active,
	onFinished,
}: {
	active: ActiveTransition;
	onFinished: () => void;
}) {
	const reanimated = getReanimated() as ReanimatedLike;
	const useSharedValue = reanimated.useSharedValue ?? reanimated.default?.useSharedValue;
	const useAnimatedStyle = reanimated.useAnimatedStyle ?? reanimated.default?.useAnimatedStyle;
	const withTiming = reanimated.withTiming ?? reanimated.default?.withTiming;
	if (!useSharedValue || !useAnimatedStyle || !withTiming) return null;
	const Easing = reanimated.Easing ?? reanimated.default?.Easing ?? RNEasing;
	const runOnJS = reanimated.runOnJS ?? reanimated.default?.runOnJS;
	const AnimatedView = reanimated.default?.View ?? reanimated.View ?? View;

	const progress = useSharedValue(0);

	const { width, height } = Dimensions.get("window");
	const maxDim = Math.hypot(width, height);
	const radius = maxDim;
	const diameter = radius * 2;

	useEffect(() => {
		void active.id;
		progress.value = 0;
		const duration = active.duration || 400;
		const cubic = Easing.cubic;
		const easingFn = Easing.out && cubic ? Easing.out(cubic) : undefined;
		progress.value = withTiming(1, { duration, easing: easingFn }, (finished) => {
			if (finished) {
				if (runOnJS) {
					runOnJS(onFinished)();
				} else {
					onFinished();
				}
			}
		});
	}, [active.id, active.duration, onFinished, progress, withTiming, Easing, runOnJS]);

	const color =
		active.preset === ThemeTransitionPreset.Fade
			? (active.overlayColor ?? resolveThemeBackground(active.fromTheme))
			: (active.overlayColor ?? resolveThemeBackground(active.toTheme));

	const preset = active.preset;

	const animatedStyle = useAnimatedStyle(() => {
		const p = progress.value;

		switch (preset) {
			case ThemeTransitionPreset.Fade:
				return { opacity: 1 - p };
			case ThemeTransitionPreset.SlideRightToLeft:
				return {
					transform: [{ translateX: (1 - p) * width }],
				};
			case ThemeTransitionPreset.SlideLeftToRight:
				return {
					transform: [{ translateX: (p - 1) * width }],
				};
			case ThemeTransitionPreset.CircleTopRight:
			case ThemeTransitionPreset.CircleTopLeft:
			case ThemeTransitionPreset.CircleBottomRight:
			case ThemeTransitionPreset.CircleBottomLeft:
			case ThemeTransitionPreset.CircleCenter:
			case ThemeTransitionPreset.CircleFromOrigin:
				return {
					transform: [{ scale: Math.max(0.001, p) }],
				};
			case ThemeTransitionPreset.SlideFromOrigin: {
				const originX = active.origin ? active.origin.x : width / 2;
				const shift = (1 - p) * (originX < width / 2 ? width : -width);
				return {
					transform: [{ translateX: shift }],
				};
			}
			case ThemeTransitionPreset.Blur:
			case ThemeTransitionPreset.BlurRightToLeft:
			case ThemeTransitionPreset.BlurLeftToRight:
			case ThemeTransitionPreset.BlurFromOrigin: {
				const scale = 1 + 0.05 * (1 - Math.abs(p - 0.5) * 2);
				return {
					opacity: p < 0.5 ? p * 2 : 1,
					transform: [{ scale }],
				};
			}
			default:
				return { opacity: 1 - p };
		}
	});

	const shapeStyle = getPresetShapeStyle(
		preset,
		radius,
		diameter,
		width,
		height,
		color,
		active.origin,
	);

	return <AnimatedView style={[shapeStyle, animatedStyle]} />;
}

function RNAnimatedOverlayItem({
	active,
	onFinished,
}: {
	active: ActiveTransition;
	onFinished: () => void;
}) {
	const animProgress = useRef(new RNAnimated.Value(0)).current;

	const { width, height } = Dimensions.get("window");
	const maxDim = Math.hypot(width, height);
	const radius = maxDim;
	const diameter = radius * 2;

	useEffect(() => {
		void active.id;
		animProgress.setValue(0);
		const duration = active.duration || 400;
		const animation = RNAnimated.timing(animProgress, {
			toValue: 1,
			duration,
			easing: RNEasing.out(RNEasing.cubic),
			useNativeDriver: true,
		});
		animation.start((res) => {
			if (res === undefined || res?.finished) {
				onFinished();
			}
		});
		return () => {
			animation.stop();
		};
	}, [active.id, active.duration, animProgress, onFinished]);

	const color =
		active.preset === ThemeTransitionPreset.Fade
			? (active.overlayColor ?? resolveThemeBackground(active.fromTheme))
			: (active.overlayColor ?? resolveThemeBackground(active.toTheme));

	const shapeStyle = getPresetShapeStyle(
		active.preset,
		radius,
		diameter,
		width,
		height,
		color,
		active.origin,
	);

	let dynamicStyle: object | null = null;
	switch (active.preset) {
		case ThemeTransitionPreset.Fade:
			dynamicStyle = {
				opacity: animProgress.interpolate({
					inputRange: [0, 1],
					outputRange: [1, 0],
				}),
			};
			break;
		case ThemeTransitionPreset.SlideRightToLeft:
			dynamicStyle = {
				transform: [
					{
						translateX: animProgress.interpolate({
							inputRange: [0, 1],
							outputRange: [width, 0],
						}),
					},
				],
			};
			break;
		case ThemeTransitionPreset.SlideLeftToRight:
			dynamicStyle = {
				transform: [
					{
						translateX: animProgress.interpolate({
							inputRange: [0, 1],
							outputRange: [-width, 0],
						}),
					},
				],
			};
			break;
		case ThemeTransitionPreset.CircleTopRight:
		case ThemeTransitionPreset.CircleTopLeft:
		case ThemeTransitionPreset.CircleBottomRight:
		case ThemeTransitionPreset.CircleBottomLeft:
		case ThemeTransitionPreset.CircleCenter:
		case ThemeTransitionPreset.CircleFromOrigin:
			dynamicStyle = {
				transform: [
					{
						scale: animProgress.interpolate({
							inputRange: [0, 1],
							outputRange: [0.001, 1],
						}),
					},
				],
			};
			break;
		case ThemeTransitionPreset.SlideFromOrigin: {
			const originX = active.origin ? active.origin.x : width / 2;
			const initialTranslate = originX < width / 2 ? width : -width;
			dynamicStyle = {
				transform: [
					{
						translateX: animProgress.interpolate({
							inputRange: [0, 1],
							outputRange: [initialTranslate, 0],
						}),
					},
				],
			};
			break;
		}
		case ThemeTransitionPreset.Blur:
		case ThemeTransitionPreset.BlurRightToLeft:
		case ThemeTransitionPreset.BlurLeftToRight:
		case ThemeTransitionPreset.BlurFromOrigin:
			dynamicStyle = {
				opacity: animProgress.interpolate({
					inputRange: [0, 0.5, 1],
					outputRange: [0, 1, 1],
				}),
				transform: [
					{
						scale: animProgress.interpolate({
							inputRange: [0, 0.5, 1],
							outputRange: [1, 1.05, 1],
						}),
					},
				],
			};
			break;
		default:
			dynamicStyle = {
				opacity: animProgress.interpolate({
					inputRange: [0, 1],
					outputRange: [1, 0],
				}),
			};
	}

	return <RNAnimated.View style={[shapeStyle, dynamicStyle]} />;
}

export function ThemeTransitionOverlay(): ReactNode {
	const [active, setActive] = useState<ActiveTransition | null>(null);
	const activeRef = useRef<ActiveTransition | null>(null);
	activeRef.current = active;

	const onStart = useCallback((item: Omit<ActiveTransition, "id">) => {
		if (item.preset === ThemeTransitionPreset.None) {
			item.onCommit?.();
			item.onComplete?.();
			return;
		}

		// If a previous transition is in flight and hasn't committed, commit it
		if (inFlightTransition && inFlightTransition.preset !== ThemeTransitionPreset.Fade) {
			inFlightTransition.onCommit?.();
		}

		if (item.preset === ThemeTransitionPreset.Fade) {
			// For Fade, commit at start so new theme is rendered underneath while old theme dissolves away
			item.onCommit?.();
		}

		const id = nextTransitionId++;
		const activeItem: ActiveTransition = { ...item, id };
		inFlightTransition = activeItem;
		setActive(activeItem);
	}, []);

	useEffect(() => {
		setGlobalTransitionHandler(onStart);
		return () => {
			setGlobalTransitionHandler(null);
			inFlightTransition = null;
		};
	}, [onStart]);

	const handleFinished = useCallback(() => {
		const current = inFlightTransition ?? activeRef.current;
		if (current) {
			if (current.preset !== ThemeTransitionPreset.Fade) {
				current.onCommit?.();
			}
			current.onComplete?.();
			inFlightTransition = null;
		}
		setActive(null);
	}, []);

	if (!active) return null;

	const hasReanimated = isReanimatedAvailable();

	return (
		<View
			pointerEvents="none"
			style={[
				StyleSheet.absoluteFill,
				{
					zIndex: 999999,
					elevation: 999999,
				},
			]}
		>
			{hasReanimated ? (
				<ReanimatedOverlayItem active={active} onFinished={handleFinished} />
			) : (
				<RNAnimatedOverlayItem active={active} onFinished={handleFinished} />
			)}
		</View>
	);
}
