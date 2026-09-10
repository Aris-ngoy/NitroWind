import { type AnimationMeta, parseAnimation } from "nitro-wind-core";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, type ViewStyle } from "react-native";

export interface ReanimatedRecipe {
	name: AnimationMeta["name"];
	durationMs: number;
	easing: AnimationMeta["easing"];
	transition: boolean;
	repeat: number;
	reverse: boolean;
}

export function translateClassNameToReanimated(className?: string): ReanimatedRecipe {
	const meta = parseAnimation(className ?? "");
	return {
		name: meta.name,
		durationMs: meta.name === "spin" || meta.name === "ping" ? 1000 : meta.durationMs,
		easing: meta.easing,
		transition: meta.transition,
		repeat: -1,
		reverse: meta.name === "pulse" || meta.name === "bounce",
	};
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
	className: string | undefined,
	baseStyle?: ViewStyle,
): ViewStyle | Animated.WithAnimatedValue<ViewStyle> | undefined {
	const recipe = useMemo(() => translateClassNameToReanimated(className), [className]);
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
