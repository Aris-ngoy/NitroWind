import { type StyleContext, classNameContextNeeds } from "nitro-wind-core";
import { useSyncExternalStore } from "react";
import { computeStyle } from "./engine";
import { getWindowSize, subscribeWindowSize } from "./layout";
import { useNitroWindStore } from "./provider";
import { noopSubscribe } from "./store";

const NO_OVERRIDES: Partial<StyleContext> = Object.freeze({});
const EMPTY_RESULT = {
	style: undefined,
	animation: undefined,
	native: false,
} as const;

function hasOverrides(overrides?: Partial<StyleContext>): boolean {
	return overrides != null && overrides !== NO_OVERRIDES;
}

export function useStyle(className?: string, overrides?: Partial<StyleContext>) {
	const needs = classNameContextNeeds(className ?? "");
	const store = useNitroWindStore();
	const subscribeEnv =
		needs.colorScheme || needs.interaction || needs.group || hasOverrides(overrides);
	const env = useSyncExternalStore(
		subscribeEnv ? store.subscribe : noopSubscribe,
		store.get,
		store.get,
	);
	const layout = useSyncExternalStore(
		needs.layout ? subscribeWindowSize : noopSubscribe,
		getWindowSize,
		getWindowSize,
	);

	if (!className) return EMPTY_RESULT;
	if (!subscribeEnv && !needs.layout) {
		if (needs.platform || needs.rtl) {
			return computeStyle(className, env.context);
		}
		return computeStyle(className);
	}

	const context: StyleContext = needs.layout
		? { ...env.context, width: layout.width, height: layout.height, ...overrides }
		: { ...env.context, ...overrides };
	return computeStyle(className, context);
}
