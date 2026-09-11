import type { HybridObject } from "react-native-nitro-modules";

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

export enum AppearanceOverride {
	Unspecified = 0,
	Light = 1,
	Dark = 2,
}

export interface TransitionOrigin {
	x: number;
	y: number;
}

export interface NativeThemeTransition extends HybridObject<{ ios: "swift"; android: "c++" }> {
	prepareTransition(
		preset: ThemeTransitionPreset,
		targetTheme: string,
		durationMs?: number,
		origin?: TransitionOrigin,
	): void;
	animateTransition(
		appearance: AppearanceOverride,
		preAnimationCallback: () => void,
	): void;
	cancelTransition(): void;
	isAvailable(): boolean;
}
