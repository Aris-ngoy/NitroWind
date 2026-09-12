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

/**
 * Uniwind's real public surface (`useResolveClassNames`, `useUniwind`, `Uniwind`
 * core) has no synchronous, headless resolve function — see node_modules/uniwind/
 * src/index.ts. There is nothing to probe: a prior version of this module tried
 * `mod.resolveClassNames` / `mod.getStyles`, neither of which uniwind exports, so
 * it always returned null and the benchmark that called it was timing a failed
 * property lookup, not Uniwind. `engines/uniwind/Screen.tsx` calls the real hook
 * directly; this flag lets the benchmark UI skip Uniwind honestly instead.
 */
export const UNIWIND_METRO_PIPELINE_LIVE = false;
