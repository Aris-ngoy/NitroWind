import type { StyleContext } from "nitro-wind-core";
import { computeStyle } from "./engine";
import { useNitroWind } from "./provider";

export function useStyle(className?: string, overrides: Partial<StyleContext> = {}) {
	const { context } = useNitroWind();
	if (!className) {
		return { style: undefined, animation: undefined, native: false, flat: {} };
	}
	return computeStyle(className, { ...context, ...overrides });
}
