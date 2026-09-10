import type { HybridObject } from "react-native-nitro-modules";

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

export interface StyleEngine extends HybridObject<{ ios: "c++"; android: "c++" }> {
	compute(className: string, context: StyleContext): Record<string, string | number>;
	computeBatch(classNames: string[], context: StyleContext): Record<string, string | number>[];
	setThemeName(name: string): void;
	clearCache(): void;
	getCacheSize(): number;
}
