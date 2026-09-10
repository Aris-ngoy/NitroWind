import {
	DEFAULT_STYLE_CONTEXT,
	JsStyleEngine,
	type StyleContext,
	inflateStyle,
	parseAnimation,
} from "nitro-wind-core";
import type { StyleEngine as StyleEngineSpec } from "./specs/styleEngine.nitro";

const jsEngine = new JsStyleEngine();

let nativeEngine: StyleEngineSpec | null | undefined;

function getNativeEngine(): StyleEngineSpec | null {
	if (nativeEngine !== undefined) return nativeEngine;
	try {
		type NitroModulesModule = typeof import("react-native-nitro-modules");
		const { NitroModules } = require("react-native-nitro-modules") as NitroModulesModule;
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

export function computeStyle(className: string, context: Partial<StyleContext> = {}) {
	const resolved: StyleContext = { ...DEFAULT_STYLE_CONTEXT, ...context };
	const native = getNativeEngine();
	if (native) {
		try {
			const flat = native.compute(className, toNativeContext(resolved));
			return {
				flat,
				style: inflateStyle(flat),
				animation: parseAnimation(className),
				native: true as const,
			};
		} catch {
			// Fall through to the JS engine (Expo Go / missing native binary).
		}
	}
	return { ...jsEngine.compute(className, resolved), native: false as const };
}

export function setEngineThemeName(name: string): void {
	jsEngine.setThemeName(name);
	getNativeEngine()?.setThemeName(name);
}

export function clearEngineCache(): void {
	jsEngine.clearCache();
	getNativeEngine()?.clearCache();
}
