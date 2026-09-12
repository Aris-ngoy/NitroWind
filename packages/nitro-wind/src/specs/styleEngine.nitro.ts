import type { AnyMap, HybridObject } from "react-native-nitro-modules";

export interface StyleContext {
	colorScheme: string;
	platform: string;
	width: number;
	height: number;
	isRTL: boolean;
	pressed: boolean;
	hovered: boolean;
	focused: boolean;
	disabled: boolean;
	groupActive: boolean;
	groupFocus: boolean;
	groupHover: boolean;
}

export interface AnimationMeta {
	name?: string;
	durationMs: number;
	easing: string;
	transition: boolean;
}

export interface StyleResult {
	style: AnyMap;
	animation: AnimationMeta;
}

export interface StyleEngine extends HybridObject<{ ios: "c++"; android: "c++" }> {
	compute(className: string, context: StyleContext): StyleResult;
	computeBatch(classNames: string[], context: StyleContext): StyleResult[];
	setThemeName(name: string): void;
	registerThemeTokens(payload: string): void;
	clearCache(): void;
	getCacheSize(): number;
}
