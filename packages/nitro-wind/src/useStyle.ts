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
	const subscribeInteractionOrGroup = needs.interaction || needs.group || hasOverrides(overrides);
	const subscribeEnv = needs.colorScheme || subscribeInteractionOrGroup;

	// A colorScheme-only className shares the store with interaction/group
	// state: InteractionProvider/GroupProvider mount a new nested store on
	// every press or group-state change, and useSyncExternalStore re-renders
	// this component whenever getSnapshot's return value isn't Object.is-equal
	// to what it returned last time. Returning the whole snapshot object means
	// a brand-new reference on every unrelated interaction/group change, even
	// though nothing this className reads has changed — narrowing to just
	// `theme` (a primitive string) lets React's own Object.is check correctly
	// treat an unrelated change as a no-op. Only safe when interaction/group
	// don't ALSO matter here — if they do, this component needs the full
	// snapshot's re-render on those changes too, so it keeps the wide one.
	const narrowToTheme = needs.colorScheme && !subscribeInteractionOrGroup;
	// Typed as returning unknown: this call's return value is never read (see
	// below), only its role in useSyncExternalStore's own re-render decision
	// matters, so the two branches don't need a shared concrete return type.
	const getEnvSnapshot: () => unknown = narrowToTheme ? () => store.get().theme : store.get;
	useSyncExternalStore(
		subscribeEnv ? store.subscribe : noopSubscribe,
		getEnvSnapshot,
		getEnvSnapshot,
	);
	// The narrowed getSnapshot above only exists to make useSyncExternalStore's
	// re-render decision correctly ignore irrelevant changes; its return value
	// is otherwise unused. The context this hook actually needs to resolve a
	// style always comes from a direct read here, which reflects the same
	// current value regardless of which getSnapshot ran.
	const env = store.get();

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
