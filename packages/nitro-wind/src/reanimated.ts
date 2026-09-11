import { type AnimationMeta, DURATION, parseAnimation } from "nitro-wind-core";
import { type ComponentType, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, type ViewStyle } from "react-native";

export interface ReanimatedRecipe {
	name: AnimationMeta["name"];
	durationMs: number;
	easing: AnimationMeta["easing"];
	transition: boolean;
	repeat: number;
	reverse: boolean;
}

export interface ReanimatedModifierConfig {
	duration?: number;
	delay?: number;
	easing?: "linear" | "in" | "out" | "in-out" | "bounce";
	springify?: boolean;
	damping?: number;
	stiffness?: number;
	mass?: number;
}

export interface ParsedReanimatedAnimations {
	enteringPreset?: string;
	enteringModifiers?: ReanimatedModifierConfig;
	exitingPreset?: string;
	exitingModifiers?: ReanimatedModifierConfig;
	layoutPreset?: string;
	layoutModifiers?: ReanimatedModifierConfig;
	hasReanimatedProps: boolean;
}

const ENTERING_PRESETS: Record<string, string> = {
	"fade-in": "FadeIn",
	"fade-in-right": "FadeInRight",
	"fade-in-left": "FadeInLeft",
	"fade-in-up": "FadeInUp",
	"fade-in-down": "FadeInDown",

	"slide-in-right": "SlideInRight",
	"slide-in-left": "SlideInLeft",
	"slide-in-up": "SlideInUp",
	"slide-in-down": "SlideInDown",

	"zoom-in": "ZoomIn",
	"zoom-in-rotate": "ZoomInRotate",
	"zoom-in-left": "ZoomInLeft",
	"zoom-in-right": "ZoomInRight",
	"zoom-in-up": "ZoomInUp",
	"zoom-in-down": "ZoomInDown",
	"zoom-in-easy-up": "ZoomInEasyUp",
	"zoom-in-easy-down": "ZoomInEasyDown",

	"bounce-in": "BounceIn",
	"bounce-in-down": "BounceInDown",
	"bounce-in-up": "BounceInUp",
	"bounce-in-left": "BounceInLeft",
	"bounce-in-right": "BounceInRight",

	"flip-in-x-up": "FlipInXUp",
	"flip-in-x-down": "FlipInXDown",
	"flip-in-y-left": "FlipInYLeft",
	"flip-in-y-right": "FlipInYRight",
	"flip-in-easy-x": "FlipInEasyX",
	"flip-in-easy-y": "FlipInEasyY",

	"stretch-in-x": "StretchInX",
	"stretch-in-y": "StretchInY",

	"rotate-in-down-left": "RotateInDownLeft",
	"rotate-in-down-right": "RotateInDownRight",
	"rotate-in-up-left": "RotateInUpLeft",
	"rotate-in-up-right": "RotateInUpRight",

	"roll-in-left": "RollInLeft",
	"roll-in-right": "RollInRight",
	"pinwheel-in": "PinwheelIn",
	"light-speed-in-right": "LightSpeedInRight",
	"light-speed-in-left": "LightSpeedInLeft",
};

const EXITING_PRESETS: Record<string, string> = {
	"fade-out": "FadeOut",
	"fade-out-right": "FadeOutRight",
	"fade-out-left": "FadeOutLeft",
	"fade-out-up": "FadeOutUp",
	"fade-out-down": "FadeOutDown",

	"slide-out-right": "SlideOutRight",
	"slide-out-left": "SlideOutLeft",
	"slide-out-up": "SlideOutUp",
	"slide-out-down": "SlideOutDown",

	"zoom-out": "ZoomOut",
	"zoom-out-rotate": "ZoomOutRotate",
	"zoom-out-left": "ZoomOutLeft",
	"zoom-out-right": "ZoomOutRight",
	"zoom-out-up": "ZoomOutUp",
	"zoom-out-down": "ZoomOutDown",
	"zoom-out-easy-up": "ZoomOutEasyUp",
	"zoom-out-easy-down": "ZoomOutEasyDown",

	"bounce-out": "BounceOut",
	"bounce-out-down": "BounceOutDown",
	"bounce-out-up": "BounceOutUp",
	"bounce-out-left": "BounceOutLeft",
	"bounce-out-right": "BounceOutRight",

	"flip-out-x-up": "FlipOutXUp",
	"flip-out-x-down": "FlipOutXDown",
	"flip-out-y-left": "FlipOutYLeft",
	"flip-out-y-right": "FlipOutYRight",
	"flip-out-easy-x": "FlipOutEasyX",
	"flip-out-easy-y": "FlipOutEasyY",

	"stretch-out-x": "StretchOutX",
	"stretch-out-y": "StretchOutY",

	"rotate-out-down-left": "RotateOutDownLeft",
	"rotate-out-down-right": "RotateOutDownRight",
	"rotate-out-up-left": "RotateOutUpLeft",
	"rotate-out-up-right": "RotateOutUpRight",

	"roll-out-left": "RollOutLeft",
	"roll-out-right": "RollOutRight",
	"pinwheel-out": "PinwheelOut",
	"light-speed-out-right": "LightSpeedOutRight",
	"light-speed-out-left": "LightSpeedOutLeft",
};

const LAYOUT_PRESETS: Record<string, string> = {
	"linear-transition": "LinearTransition",
	"fading-transition": "FadingTransition",
	"jumping-transition": "JumpingTransition",
	"curved-transition": "CurvedTransition",
	"sequenced-transition": "SequencedTransition",
	"entry-exit-transition": "EntryExitTransition",
};

function toPascalCase(str: string): string {
	return str
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}

function parseModifier(
	action: string,
	target: ReanimatedModifierConfig,
): boolean {
	if (action.startsWith("duration-")) {
		const rest = action.slice("duration-".length);
		const val = rest in DURATION ? DURATION[rest] : Number.parseFloat(rest);
		if (Number.isFinite(val)) {
			target.duration = val;
			return true;
		}
	} else if (action.startsWith("delay-")) {
		const rest = action.slice("delay-".length);
		const val = rest in DURATION ? DURATION[rest] : Number.parseFloat(rest);
		if (Number.isFinite(val)) {
			target.delay = val;
			return true;
		}
	} else if (action.startsWith("ease-")) {
		const rest = action.slice("ease-".length);
		if (rest === "linear" || rest === "in" || rest === "out" || rest === "in-out" || rest === "bounce") {
			target.easing = rest;
			return true;
		}
	} else if (action === "springify") {
		target.springify = true;
		return true;
	} else if (action.startsWith("damping-")) {
		const val = Number.parseFloat(action.slice("damping-".length));
		if (Number.isFinite(val)) {
			target.damping = val;
			return true;
		}
	} else if (action.startsWith("stiffness-")) {
		const val = Number.parseFloat(action.slice("stiffness-".length));
		if (Number.isFinite(val)) {
			target.stiffness = val;
			return true;
		}
	} else if (action.startsWith("mass-")) {
		const val = Number.parseFloat(action.slice("mass-".length));
		if (Number.isFinite(val)) {
			target.mass = val;
			return true;
		}
	}
	return false;
}

export function parseReanimatedAnimations(className?: string): ParsedReanimatedAnimations {
	const result: ParsedReanimatedAnimations = {
		hasReanimatedProps: false,
	};
	if (!className) return result;

	const tokens = className.trim().split(/\s+/);
	for (const token of tokens) {
		let raw = token;
		if (raw.startsWith("!")) raw = raw.slice(1);
		// Strip variants if any (e.g. ios:uw-entering-fade-in)
		const colonIdx = raw.lastIndexOf(":");
		if (colonIdx >= 0) raw = raw.slice(colonIdx + 1);

		if (!raw.startsWith("uw-") && !raw.startsWith("nw-")) continue;
		const stripped = raw.slice(3); // remove "uw-" or "nw-"

		if (stripped.startsWith("entering-")) {
			const action = stripped.slice("entering-".length);
			result.enteringModifiers = result.enteringModifiers ?? {};
			if (!parseModifier(action, result.enteringModifiers)) {
				result.enteringPreset = ENTERING_PRESETS[action] ?? toPascalCase(action);
			}
			result.hasReanimatedProps = true;
		} else if (stripped.startsWith("exiting-")) {
			const action = stripped.slice("exiting-".length);
			result.exitingModifiers = result.exitingModifiers ?? {};
			if (!parseModifier(action, result.exitingModifiers)) {
				result.exitingPreset = EXITING_PRESETS[action] ?? toPascalCase(action);
			}
			result.hasReanimatedProps = true;
		} else if (stripped.startsWith("layout-")) {
			const action = stripped.slice("layout-".length);
			result.layoutModifiers = result.layoutModifiers ?? {};
			if (!parseModifier(action, result.layoutModifiers)) {
				result.layoutPreset = LAYOUT_PRESETS[action] ?? toPascalCase(action);
			}
			result.hasReanimatedProps = true;
		}
	}

	return result;
}

function applyModifiers(
	builder: unknown,
	modifiers?: ReanimatedModifierConfig,
	reanimatedModule?: Record<string, unknown>,
): unknown {
	if (!builder) return builder;
	let b: Record<string, unknown>;
	if (typeof builder === "function") {
		const fn = builder as {
			createInstance?: () => Record<string, unknown>;
		} & (new () => Record<string, unknown>);
		if (typeof fn.createInstance === "function") {
			b = fn.createInstance();
		} else {
			try {
				b = new fn();
			} catch {
				b = (builder as () => Record<string, unknown>)();
			}
		}
	} else if (typeof builder === "object") {
		b = builder as Record<string, unknown>;
	} else {
		return builder;
	}

	if (!modifiers) return b;

	if (typeof b.duration === "function" && modifiers.duration !== undefined) {
		b = (b.duration as (n: number) => Record<string, unknown>)(modifiers.duration);
	}
	if (typeof b.delay === "function" && modifiers.delay !== undefined) {
		b = (b.delay as (n: number) => Record<string, unknown>)(modifiers.delay);
	}
	if (typeof b.springify === "function" && modifiers.springify) {
		b = (b.springify as () => Record<string, unknown>)();
	}
	if (typeof b.damping === "function" && modifiers.damping !== undefined) {
		b = (b.damping as (n: number) => Record<string, unknown>)(modifiers.damping);
	}
	if (typeof b.stiffness === "function" && modifiers.stiffness !== undefined) {
		b = (b.stiffness as (n: number) => Record<string, unknown>)(modifiers.stiffness);
	}
	if (typeof b.mass === "function" && modifiers.mass !== undefined) {
		b = (b.mass as (n: number) => Record<string, unknown>)(modifiers.mass);
	}
	if (typeof b.easing === "function" && modifiers.easing !== undefined) {
		const reanimatedEasing = (reanimatedModule?.Easing ?? Easing) as {
			linear: unknown;
			ease: unknown;
			bounce: unknown;
			in?: (e: unknown) => unknown;
			out?: (e: unknown) => unknown;
			inOut?: (e: unknown) => unknown;
		};
		let easingFn: unknown;
		switch (modifiers.easing) {
			case "linear":
				easingFn = reanimatedEasing.linear;
				break;
			case "in":
				easingFn = reanimatedEasing.in ? reanimatedEasing.in(reanimatedEasing.ease) : reanimatedEasing.ease;
				break;
			case "out":
				easingFn = reanimatedEasing.out ? reanimatedEasing.out(reanimatedEasing.ease) : reanimatedEasing.ease;
				break;
			case "in-out":
				easingFn = reanimatedEasing.inOut ? reanimatedEasing.inOut(reanimatedEasing.ease) : reanimatedEasing.ease;
				break;
			case "bounce":
				easingFn = reanimatedEasing.bounce;
				break;
		}
		if (easingFn) {
			b = (b.easing as (e: unknown) => Record<string, unknown>)(easingFn);
		}
	}
	return b;
}

export function buildReanimatedProps(
	className?: string,
	customReanimatedModule?: unknown,
): { entering?: unknown; exiting?: unknown; layout?: unknown } {
	const parsed = parseReanimatedAnimations(className);
	if (!parsed.hasReanimatedProps) return {};

	const reanimated = (customReanimatedModule ?? getReanimated()) as Record<string, unknown> | null;
	if (!reanimated) return {};

	const result: { entering?: unknown; exiting?: unknown; layout?: unknown } = {};

	if (parsed.enteringPreset && reanimated[parsed.enteringPreset]) {
		result.entering = applyModifiers(
			reanimated[parsed.enteringPreset],
			parsed.enteringModifiers,
			reanimated,
		);
	}
	if (parsed.exitingPreset && reanimated[parsed.exitingPreset]) {
		result.exiting = applyModifiers(
			reanimated[parsed.exitingPreset],
			parsed.exitingModifiers,
			reanimated,
		);
	}
	if (parsed.layoutPreset && reanimated[parsed.layoutPreset]) {
		result.layout = applyModifiers(
			reanimated[parsed.layoutPreset],
			parsed.layoutModifiers,
			reanimated,
		);
	}

	return result;
}

const animatedComponentCache = new WeakMap<ComponentType<unknown>, unknown>();

export function getOrCreateAnimatedComponent<P extends object>(
	Component: ComponentType<P>,
	customReanimatedModule?: unknown,
): ComponentType<P> {
	const reanimated = (customReanimatedModule ?? getReanimated()) as {
		createAnimatedComponent?: (c: ComponentType<P>) => ComponentType<P>;
	} | null;

	if (reanimated?.createAnimatedComponent) {
		let cached = animatedComponentCache.get(Component as ComponentType<unknown>);
		if (!cached) {
			cached = reanimated.createAnimatedComponent(Component);
			animatedComponentCache.set(Component as ComponentType<unknown>, cached);
		}
		return cached as ComponentType<P>;
	}
	return Component;
}

export function translateAnimation(meta: AnimationMeta): ReanimatedRecipe {
	return {
		name: meta.name,
		durationMs: meta.name === "spin" || meta.name === "ping" ? 1000 : meta.durationMs,
		easing: meta.easing,
		transition: meta.transition,
		repeat: -1,
		reverse: meta.name === "pulse" || meta.name === "bounce",
	};
}

export function translateClassNameToReanimated(className?: string): ReanimatedRecipe {
	return translateAnimation(parseAnimation(className ?? ""));
}

export function translateTransition(meta: AnimationMeta): {
	duration: number;
	easing: AnimationMeta["easing"];
} {
	return { duration: meta.durationMs, easing: meta.easing };
}

function easingFor(name: AnimationMeta["easing"]) {
	switch (name) {
		case "linear":
			return Easing.linear;
		case "ease-in":
			return Easing.in(Easing.ease);
		case "ease-out":
			return Easing.out(Easing.ease);
		default:
			return Easing.inOut(Easing.ease);
	}
}

export function useAnimatedClassName(
	animation: AnimationMeta | undefined,
	baseStyle?: ViewStyle,
): ViewStyle | Animated.WithAnimatedValue<ViewStyle> | undefined {
	const recipe = useMemo(
		() =>
			animation == null
				? translateAnimation({ name: null, durationMs: 150, easing: "ease", transition: false })
				: translateAnimation(animation),
		[animation],
	);
	const progress = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (!recipe.name || recipe.name === "none") {
			progress.setValue(0);
			return;
		}
		const loop = Animated.loop(
			Animated.timing(progress, {
				toValue: 1,
				duration: recipe.durationMs,
				easing: easingFor(recipe.easing),
				useNativeDriver: true,
			}),
			{ resetBeforeIteration: !recipe.reverse },
		);
		loop.start();
		return () => loop.stop();
	}, [progress, recipe.durationMs, recipe.easing, recipe.name, recipe.reverse]);

	if (!recipe.name || recipe.name === "none") {
		return baseStyle;
	}

	const animated: Animated.WithAnimatedValue<ViewStyle> = { ...(baseStyle ?? {}) };
	if (recipe.name === "spin") {
		animated.transform = [
			...(Array.isArray(baseStyle?.transform) ? baseStyle.transform : []),
			{
				rotate: progress.interpolate({
					inputRange: [0, 1],
					outputRange: ["0deg", "360deg"],
				}),
			},
		];
	} else if (recipe.name === "pulse") {
		animated.opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] });
		animated.transform = [
			...(Array.isArray(baseStyle?.transform) ? baseStyle.transform : []),
			{
				scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }),
			},
		];
	} else if (recipe.name === "bounce") {
		animated.transform = [
			...(Array.isArray(baseStyle?.transform) ? baseStyle.transform : []),
			{
				translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }),
			},
		];
	} else if (recipe.name === "ping") {
		animated.opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
		animated.transform = [
			...(Array.isArray(baseStyle?.transform) ? baseStyle.transform : []),
			{
				scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }),
			},
		];
	}
	return animated;
}

export function getReanimated(): unknown | null {
	try {
		return require("react-native-reanimated");
	} catch {
		return null;
	}
}
