import { BREAKPOINTS } from "./theme";
import { tokenize } from "./tokenizer";

export interface ClassNameContextNeeds {
	colorScheme: boolean;
	platform: boolean;
	rtl: boolean;
	layout: boolean;
	interaction: boolean;
	group: boolean;
}

const NONE: ClassNameContextNeeds = Object.freeze({
	colorScheme: false,
	platform: false,
	rtl: false,
	layout: false,
	interaction: false,
	group: false,
});

const cache = new Map<string, ClassNameContextNeeds>();

function needsEnv(needs: ClassNameContextNeeds): boolean {
	return (
		needs.colorScheme ||
		needs.platform ||
		needs.rtl ||
		needs.layout ||
		needs.interaction ||
		needs.group
	);
}

export function classNameContextNeeds(className: string): ClassNameContextNeeds {
	if (!className) return NONE;
	const cached = cache.get(className);
	if (cached) return cached;

	if (!className.includes(":") && !/(?:^|\s)group(?:\s|$)/.test(className)) {
		cache.set(className, NONE);
		return NONE;
	}

	const needs: ClassNameContextNeeds = {
		colorScheme: false,
		platform: false,
		rtl: false,
		layout: false,
		interaction: false,
		group: false,
	};

	for (const token of tokenize(className)) {
		if (token.utility === "group") needs.group = true;
		for (const variant of token.variants) {
			switch (variant) {
				case "dark":
				case "light":
					needs.colorScheme = true;
					break;
				case "ios":
				case "android":
				case "web":
					needs.platform = true;
					break;
				case "rtl":
				case "ltr":
					needs.rtl = true;
					break;
				case "active":
				case "pressed":
				case "hover":
				case "focus":
				case "disabled":
					needs.interaction = true;
					break;
				case "group":
				case "group-active":
				case "group-pressed":
				case "group-focus":
				case "group-hover":
					needs.group = true;
					break;
				default:
					if (variant in BREAKPOINTS) needs.layout = true;
			}
		}
	}

	const frozen = needsEnv(needs) ? Object.freeze(needs) : NONE;
	cache.set(className, frozen);
	return frozen;
}

export function classNameIsContextFree(className: string): boolean {
	return classNameContextNeeds(className) === NONE;
}

export function classNameIsAotCompilable(className: string): boolean {
	if (!className || !classNameIsContextFree(className)) return false;
	if (className.includes("animate-") || className.includes("transition")) return false;
	return true;
}
