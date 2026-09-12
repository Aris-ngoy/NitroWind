import { useSyncExternalStore } from "react";
import { useNitroWindStore } from "./provider";

declare const process: { env?: Record<string, string | undefined> } | undefined;

export type CSSVariableValue = string | number;
export type CSSVariables = Record<string, CSSVariableValue>;

const cssVariablesStore: Record<string, CSSVariables> = {
	light: {},
	dark: {},
};

const listeners = new Set<() => void>();
let warnedOnce = false;

function notifyListeners(): void {
	for (const listener of listeners) {
		listener();
	}
}

export function subscribeCSSVariables(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function updateCSSVariables(theme: string, variables: CSSVariables): void {
	if (!cssVariablesStore[theme]) {
		cssVariablesStore[theme] = {};
	}

	for (const [key, val] of Object.entries(variables)) {
		if (!key.startsWith("--")) {
			if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
				console.error(`CSS variable name must start with "--", instead got: ${key}`);
			}
			continue;
		}
		cssVariablesStore[theme][key] = val;
	}

	notifyListeners();
}

export interface VariableLookupContext {
	scopedTheme?: string | null;
	variables?: CSSVariables | null;
}

function resolveSingleVariable(
	name: string,
	activeTheme: string,
	context?: VariableLookupContext,
): CSSVariableValue | undefined {
	if (context?.variables && name in context.variables) {
		return context.variables[name];
	}

	const targetTheme = context?.scopedTheme ?? activeTheme;
	const themeVars = cssVariablesStore[targetTheme];
	if (themeVars && name in themeVars) {
		return themeVars[name];
	}

	// Fallback to light or dark if defined
	if (targetTheme !== "light" && cssVariablesStore.light && name in cssVariablesStore.light) {
		return cssVariablesStore.light[name];
	}
	if (targetTheme !== "dark" && cssVariablesStore.dark && name in cssVariablesStore.dark) {
		return cssVariablesStore.dark[name];
	}

	// Fallback across any theme in the store
	for (const themeKey of Object.keys(cssVariablesStore)) {
		if (themeKey !== targetTheme && cssVariablesStore[themeKey] && name in cssVariablesStore[themeKey]) {
			return cssVariablesStore[themeKey][name];
		}
	}

	return undefined;
}

function warnMissingVariable(name: string): void {
	if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production" && !warnedOnce) {
		warnedOnce = true;
		console.warn(
			`NitroWind: We couldn't find your CSS variable '${name}'. Make sure it's defined via updateCSSVariables() or in ScopedVariables.`,
		);
	}
}

export function getCSSVariable(
	name: string,
	context?: VariableLookupContext,
): CSSVariableValue | undefined;
export function getCSSVariable(
	name: string[],
	context?: VariableLookupContext,
): (CSSVariableValue | undefined)[];
export function getCSSVariable(
	name: string | string[],
	context?: VariableLookupContext,
): CSSVariableValue | undefined | (CSSVariableValue | undefined)[] {
	// Import current theme dynamically or fallback
	const { getActiveTheme } = require("./provider");
	const activeTheme = getActiveTheme ? getActiveTheme() : "light";

	if (Array.isArray(name)) {
		return name.map((n) => {
			const val = resolveSingleVariable(n, activeTheme, context);
			if (val === undefined) warnMissingVariable(n);
			return val;
		});
	}

	const val = resolveSingleVariable(name, activeTheme, context);
	if (val === undefined) warnMissingVariable(name);
	return val;
}

export function useCSSVariable(name: string): CSSVariableValue | undefined;
export function useCSSVariable(name: string[]): (CSSVariableValue | undefined)[];
export function useCSSVariable(
	name: string | string[],
): CSSVariableValue | undefined | (CSSVariableValue | undefined)[] {
	const store = useNitroWindStore();
	const env = store.get();
	const activeTheme = env.scopedTheme ?? env.theme;
	const scopedVariables = env.scopedVariables;

	const lookupContext: VariableLookupContext = {
		scopedTheme: env.scopedTheme,
		variables: scopedVariables,
	};

	// Subscribe to global CSS variable updates and theme store updates
	useSyncExternalStore(subscribeCSSVariables, () => cssVariablesStore, () => cssVariablesStore);
	useSyncExternalStore(store.subscribe, () => store.get().theme, () => store.get().theme);

	if (Array.isArray(name)) {
		return name.map((n) => resolveSingleVariable(n, activeTheme, lookupContext));
	}

	return resolveSingleVariable(name, activeTheme, lookupContext);
}
