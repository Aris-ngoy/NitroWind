import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { styles } from "../../catalog";

export const uniwindFallback = {
	screen: styles.screen,
	row: styles.row,
	avatar: styles.avatar,
	name: styles.name,
	meta: styles.meta,
};

export function mergeResolvedStyle<T extends ViewStyle | TextStyle>(
	resolved: object | undefined,
	fallback: T,
): StyleProp<T> {
	if (resolved == null) return fallback;
	if (Array.isArray(resolved) && resolved.length === 0) return fallback;
	if (
		typeof resolved === "object" &&
		!Array.isArray(resolved) &&
		Object.keys(resolved).length === 0
	) {
		return fallback;
	}
	return [resolved as T, fallback];
}

export function resolveUniwindSync(className: string): ViewStyle | TextStyle | null {
	try {
		const mod = require("uniwind") as {
			resolveClassNames?: (className: string) => ViewStyle | TextStyle;
			getStyles?: (className: string) => ViewStyle | TextStyle;
		};
		if (typeof mod.resolveClassNames === "function") {
			return mod.resolveClassNames(className);
		}
		if (typeof mod.getStyles === "function") {
			return mod.getStyles(className);
		}
	} catch {
		return null;
	}
	return null;
}
