export type ColorScheme = "light" | "dark" | (string & {});
export type PlatformName = "ios" | "android" | "web";

export enum ThemeTransitionPreset {
	None = 0,
	Fade = 1,
	SlideRightToLeft = 2,
	SlideLeftToRight = 3,
	CircleTopRight = 4,
	CircleTopLeft = 5,
	CircleBottomRight = 6,
	CircleBottomLeft = 7,
	CircleCenter = 8,
	Blur = 9,
	BlurRightToLeft = 10,
	BlurLeftToRight = 11,
	CircleFromOrigin = 12,
	SlideFromOrigin = 13,
	BlurFromOrigin = 14,
}

export interface TransitionOrigin {
	x: number;
	y: number;
}

export interface ThemeTransitionOptions {
	preset?: ThemeTransitionPreset;
	duration?: number;
	origin?: TransitionOrigin;
}

export interface StyleContext {
	colorScheme: ColorScheme;
	platform: PlatformName;
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

export type StyleValue = string | number;
export type StyleRecord = Record<string, StyleValue>;

export interface ClassToken {
	raw: string;
	variants: string[];
	utility: string;
	important: boolean;
}

export interface AnimationMeta {
	name: "none" | "spin" | "ping" | "pulse" | "bounce" | null;
	durationMs: number;
	easing: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
	transition: boolean;
}

export const DEFAULT_STYLE_CONTEXT: StyleContext = {
	colorScheme: "light",
	platform: "ios",
	width: 390,
	height: 844,
	isRTL: false,
	pressed: false,
	hovered: false,
	focused: false,
	disabled: false,
	groupActive: false,
	groupFocus: false,
	groupHover: false,
};

export const CONTEXT_BITS = {
	DARK: 1 << 0,
	IOS: 1 << 1,
	ANDROID: 1 << 2,
	WEB: 1 << 3,
	RTL: 1 << 4,
	PRESSED: 1 << 5,
	HOVERED: 1 << 6,
	FOCUSED: 1 << 7,
	DISABLED: 1 << 8,
	GROUP_ACTIVE: 1 << 9,
	GROUP_FOCUS: 1 << 10,
	GROUP_HOVER: 1 << 11,
} as const;

export function contextBitmask(context: StyleContext): number {
	let bits = 0;
	if (context.colorScheme === "dark") bits |= CONTEXT_BITS.DARK;
	if (context.platform === "ios") bits |= CONTEXT_BITS.IOS;
	if (context.platform === "android") bits |= CONTEXT_BITS.ANDROID;
	if (context.platform === "web") bits |= CONTEXT_BITS.WEB;
	if (context.isRTL) bits |= CONTEXT_BITS.RTL;
	if (context.pressed) bits |= CONTEXT_BITS.PRESSED;
	if (context.hovered) bits |= CONTEXT_BITS.HOVERED;
	if (context.focused) bits |= CONTEXT_BITS.FOCUSED;
	if (context.disabled) bits |= CONTEXT_BITS.DISABLED;
	if (context.groupActive) bits |= CONTEXT_BITS.GROUP_ACTIVE;
	if (context.groupFocus) bits |= CONTEXT_BITS.GROUP_FOCUS;
	if (context.groupHover) bits |= CONTEXT_BITS.GROUP_HOVER;
	const bucket = Math.min(0xffff, Math.max(0, Math.floor(context.width / 32)));
	return bits | (bucket << 16);
}
