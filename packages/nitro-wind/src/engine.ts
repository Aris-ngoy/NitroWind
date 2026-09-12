import {
	type AnimationMeta,
	DEFAULT_STYLE_CONTEXT,
	JsStyleEngine,
	type StyleContext,
	type StyleResult,
	contextBitmask,
} from "nitro-wind-core";
import type { StyleEngine as StyleEngineSpec } from "./specs/styleEngine.nitro";

const jsEngine = new JsStyleEngine();
const NO_OVERRIDES: Partial<StyleContext> = Object.freeze({});
const RESULT_CACHE_LIMIT = 4096;
const DEFAULT_CONTEXT_MASK = contextBitmask(DEFAULT_STYLE_CONTEXT);

export type PublicStyleResult = StyleResult & { native: boolean };

let nativeEngine: StyleEngineSpec | null | undefined;
let lastClassName = "";
let lastContextRef: Partial<StyleContext> | undefined;
let lastResult: PublicStyleResult | undefined;

const staticL1 = new Map<string, PublicStyleResult>();
const contextCache = new Map<number, Map<string, PublicStyleResult>>();

function nativeModuleInstalled(): boolean {
	try {
		const { TurboModuleRegistry } = require("react-native") as typeof import("react-native");
		return TurboModuleRegistry.get("NitroModules") != null;
	} catch {
		return false;
	}
}

function getNativeEngine(): StyleEngineSpec | null {
	if (nativeEngine !== undefined) return nativeEngine;
	nativeEngine = null;
	if (!nativeModuleInstalled()) return null;
	try {
		type NitroModulesModule = typeof import("react-native-nitro-modules");
		const { NitroModules } = require("react-native-nitro-modules") as NitroModulesModule;
		if (!NitroModules.hasHybridObject("StyleEngine")) return null;
		nativeEngine = NitroModules.createHybridObject<StyleEngineSpec>("StyleEngine");
	} catch {
		nativeEngine = null;
	}
	return nativeEngine;
}

export function isNativeEngineAvailable(): boolean {
	return getNativeEngine() != null;
}

export function toNativeContext(context: StyleContext) {
	return {
		colorScheme: context.colorScheme,
		platform: context.platform,
		width: context.width,
		height: context.height,
		isRTL: context.isRTL,
		pressed: context.pressed,
		hovered: context.hovered,
		focused: context.focused,
		disabled: context.disabled,
		groupActive: context.groupActive,
		groupFocus: context.groupFocus,
		groupHover: context.groupHover,
	};
}

function isEmptyPartial(context: Partial<StyleContext>): boolean {
	for (const key in context) {
		if (context[key as keyof StyleContext] !== undefined) return false;
	}
	return true;
}

function isCompleteContext(context: Partial<StyleContext>): context is StyleContext {
	return (
		context.colorScheme != null &&
		context.platform != null &&
		typeof context.width === "number" &&
		typeof context.height === "number" &&
		typeof context.isRTL === "boolean" &&
		typeof context.pressed === "boolean" &&
		typeof context.hovered === "boolean" &&
		typeof context.focused === "boolean" &&
		typeof context.disabled === "boolean" &&
		typeof context.groupActive === "boolean" &&
		typeof context.groupFocus === "boolean" &&
		typeof context.groupHover === "boolean"
	);
}

function resolveContext(context: Partial<StyleContext>): StyleContext {
	if (context === NO_OVERRIDES || context === DEFAULT_STYLE_CONTEXT || isEmptyPartial(context)) {
		return DEFAULT_STYLE_CONTEXT;
	}
	if (isCompleteContext(context)) return context;
	return { ...DEFAULT_STYLE_CONTEXT, ...context };
}

function resetPublicCache(): void {
	staticL1.clear();
	contextCache.clear();
	lastClassName = "";
	lastContextRef = undefined;
	lastResult = undefined;
}

function toPublicAnimation(animation: {
	name?: string;
	durationMs: number;
	easing: string;
	transition: boolean;
}): AnimationMeta {
	return {
		name: (animation.name as AnimationMeta["name"]) ?? null,
		durationMs: animation.durationMs,
		easing: animation.easing as AnimationMeta["easing"],
		transition: animation.transition,
	};
}

function computeUncached(className: string, resolved: StyleContext): PublicStyleResult {
	const native = getNativeEngine();
	if (native) {
		try {
			const computed = native.compute(className, toNativeContext(resolved));
			return {
				style: computed.style,
				animation: toPublicAnimation(computed.animation),
				native: true,
			};
		} catch {
			// Fall through to the JS engine (Expo Go / missing native binary).
		}
	}
	const computed = jsEngine.compute(className, resolved);
	return {
		style: computed.style,
		animation: computed.animation,
		native: false,
	};
}

export function computeStyle(
	className: string,
	context?: Partial<StyleContext>,
): PublicStyleResult {
	if (lastResult !== undefined && className === lastClassName && context === lastContextRef) {
		return lastResult;
	}

	const isDefault =
		context == null ||
		context === NO_OVERRIDES ||
		context === DEFAULT_STYLE_CONTEXT ||
		isEmptyPartial(context);

	if (isDefault) {
		const hit = staticL1.get(className);
		if (hit !== undefined) {
			lastClassName = className;
			lastContextRef = context;
			lastResult = hit;
			return hit;
		}
		const computed = computeUncached(className, DEFAULT_STYLE_CONTEXT);
		if (staticL1.size >= RESULT_CACHE_LIMIT) {
			staticL1.clear();
		}
		staticL1.set(className, computed);
		lastClassName = className;
		lastContextRef = context;
		lastResult = computed;
		return computed;
	}

	const resolved = isCompleteContext(context) ? context : resolveContext(context);
	const mask = contextBitmask(resolved);

	if (mask === DEFAULT_CONTEXT_MASK) {
		const hit = staticL1.get(className);
		if (hit !== undefined) {
			lastClassName = className;
			lastContextRef = context;
			lastResult = hit;
			return hit;
		}
		const computed = computeUncached(className, resolved);
		if (staticL1.size >= RESULT_CACHE_LIMIT) {
			staticL1.clear();
		}
		staticL1.set(className, computed);
		lastClassName = className;
		lastContextRef = context;
		lastResult = computed;
		return computed;
	}

	let maskMap = contextCache.get(mask);
	if (!maskMap) {
		maskMap = new Map<string, PublicStyleResult>();
		contextCache.set(mask, maskMap);
	}
	const hit = maskMap.get(className);
	if (hit !== undefined) {
		lastClassName = className;
		lastContextRef = context;
		lastResult = hit;
		return hit;
	}
	const computed = computeUncached(className, resolved);
	if (maskMap.size >= RESULT_CACHE_LIMIT) {
		maskMap.clear();
	}
	maskMap.set(className, computed);
	lastClassName = className;
	lastContextRef = context;
	lastResult = computed;
	return computed;
}

export function setEngineThemeName(name: string): void {
	jsEngine.setThemeName(name);
	getNativeEngine()?.setThemeName(name);
	resetPublicCache();
}

export function clearEngineCache(): void {
	jsEngine.clearCache();
	getNativeEngine()?.clearCache();
	resetPublicCache();
}

export function computeStaticStyle(className: string): PublicStyleResult["style"] {
	return computeStyle(className).style;
}

/**
 * Like `computeStaticStyle`, but for a className whose only variants are
 * platform variants (ios/android/web) — resolved with the given platform
 * baked into the context instead of `DEFAULT_STYLE_CONTEXT`'s fixed "ios".
 * Called by code the Babel plugin generates (see babel.js's
 * platformOnlyVariantEligible) for a build that has resolved to a single
 * target platform, so the variant never needs to be selected at render time.
 * Every other context field stays at its default — safe only because the
 * plugin only takes this path when nitro-wind-core's
 * classNameIsPlatformOnlyVariant has already confirmed no other axis is in
 * play for this className.
 */
export function computeStaticStyleForPlatform(
	className: string,
	platform: StyleContext["platform"],
): PublicStyleResult["style"] {
	return computeStyle(className, { platform }).style;
}
