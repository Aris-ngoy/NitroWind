import { onThemeTokensChanged, resolveBreakpoint } from "./theme";
import { tokenize } from "./tokenizer";

export interface ClassNameContextNeeds {
	colorScheme: boolean;
	platform: boolean;
	rtl: boolean;
	layout: boolean;
	interaction: boolean;
	group: boolean;
	/** True when a token is an animation/transition utility (animate-*, transition,
	 * transition-*). Not folded into `needsEnv` — animation never needs the
	 * NitroWindStore subscription — but it does mean the className is not
	 * "context free": it needs the InteractiveStyled render shape's Animated.Value
	 * machinery, and it is not safe to hoist at build time. */
	animation: boolean;
}

const NONE: ClassNameContextNeeds = Object.freeze({
	colorScheme: false,
	platform: false,
	rtl: false,
	layout: false,
	interaction: false,
	group: false,
	animation: false,
});

const cache = new Map<string, ClassNameContextNeeds>();

onThemeTokensChanged(() => {
	cache.clear();
});

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

function needsAnything(needs: ClassNameContextNeeds): boolean {
	return needsEnv(needs) || needs.animation;
}

function isAnimationUtility(utility: string): boolean {
	return (
		utility.startsWith("animate-") ||
		utility === "transition" ||
		utility.startsWith("transition-") ||
		utility.startsWith("nw-entering-") ||
		utility.startsWith("nw-exiting-") ||
		utility.startsWith("nw-layout-") ||
		utility.startsWith("uw-entering-") ||
		utility.startsWith("uw-exiting-") ||
		utility.startsWith("uw-layout-")
	);
}

/**
 * The single interface for "what does this className need to resolve correctly."
 * `styled.tsx`'s render-shape dispatch, `useStyle.ts`'s subscription gating, and
 * `classNameIsAotCompilable`'s build-time eligibility check all read from this one
 * cached, tokenizer-based result instead of each re-deriving their own answer with
 * a different substring heuristic.
 */
export function classNameContextNeeds(className: string): ClassNameContextNeeds {
	if (!className) return NONE;
	const cached = cache.get(className);
	if (cached) return cached;

	if (
		!className.includes(":") &&
		!/(?:^|\s)group(?:\s|$)/.test(className) &&
		!className.includes("animate") &&
		!className.includes("transition") &&
		!className.includes("nw-entering") &&
		!className.includes("nw-exiting") &&
		!className.includes("nw-layout") &&
		!className.includes("uw-entering") &&
		!className.includes("uw-exiting") &&
		!className.includes("uw-layout")
	) {
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
		animation: false,
	};

	for (const token of tokenize(className)) {
		if (token.utility === "group") needs.group = true;
		if (isAnimationUtility(token.utility)) needs.animation = true;
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
					if (resolveBreakpoint(variant) != null) needs.layout = true;
					else needs.colorScheme = true;
			}
		}
	}

	const frozen = needsAnything(needs) ? Object.freeze(needs) : NONE;
	cache.set(className, frozen);
	return frozen;
}

export function classNameIsContextFree(className: string): boolean {
	return classNameContextNeeds(className) === NONE;
}

/**
 * Whether it is safe to precompute this className's style at build time and
 * reuse the result for the process lifetime, on every platform, forever.
 *
 * Context-free is necessary but not sufficient. Unknown prefixes are treated
 * as custom theme names (`premium:`, `ocean:`) and need color scheme. This
 * still requires zero variants of any kind before hoisting, matching
 * `packages/nitro-wind/babel.js`'s independently-written conservative check.
 * The two cannot share code (babel.js is plain CommonJS), so agreement is
 * enforced by the parity test in
 * `packages/nitro-wind/src/__tests__/babel.test.ts`.
 */
export function classNameIsAotCompilable(className: string): boolean {
	if (!className || !classNameIsContextFree(className)) return false;
	for (const token of tokenize(className)) {
		if (token.variants.length > 0) return false;
	}
	return true;
}

/**
 * Whether every variant in this className is a platform variant (ios/android/
 * web) and nothing else needs runtime resolution — no colorScheme, rtl,
 * layout, interaction, group, or animation. `Platform.OS` never changes
 * within a running app instance, so when the target platform is known at
 * build time (Metro passes it to Babel via `api.caller`), a className meeting
 * this contract can be resolved to a single value once, at transform time,
 * with no runtime selector needed — unlike `classNameIsAotCompilable`, which
 * requires zero variants of any kind.
 *
 * Deliberately mutually exclusive with `classNameIsAotCompilable`: this
 * returns false for a variant-free className (that's the other function's
 * job) and requires at least one platform variant to actually be present.
 *
 * `packages/nitro-wind/babel.js` has its own independently-written twin of
 * this check for the same cross-runtime reason `classNameIsAotCompilable`
 * does — agreement is enforced by the parity test in
 * `packages/nitro-wind/src/__tests__/babel.test.ts`, not shared code.
 */
export function classNameIsPlatformOnlyVariant(className: string): boolean {
	if (!className) return false;
	const needs = classNameContextNeeds(className);
	return (
		needs.platform &&
		!needs.colorScheme &&
		!needs.rtl &&
		!needs.layout &&
		!needs.interaction &&
		!needs.group &&
		!needs.animation
	);
}
