import { BREAKPOINTS } from "./theme";
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
		utility.startsWith("animate-") || utility === "transition" || utility.startsWith("transition-")
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
		!className.includes("transition")
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
					if (variant in BREAKPOINTS) needs.layout = true;
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
 * Context-free is necessary but not sufficient: a className with a variant
 * `classNameContextNeeds` doesn't recognize (a typo, or a future utility) reads
 * as context-free here because `parseClassName` skips any token with an
 * unmatched variant — but that is a coincidental property of the parser's
 * current skip-on-mismatch behavior, not a general guarantee. Baking that
 * inference permanently into hoisted build output would go silently stale if
 * the parser ever changed. So this additionally requires zero variants of any
 * kind, matching `packages/nitro-wind/babel.js`'s independently-written but
 * intentionally identical conservative check — the two cannot literally share
 * code (babel.js runs as plain CommonJS with no build step of its own and
 * cannot `require` this package's TypeScript source), so agreement between
 * them is enforced by the parity test in
 * `packages/nitro-wind/src/__tests__/babel.test.ts` instead.
 */
export function classNameIsAotCompilable(className: string): boolean {
	if (!className || !classNameIsContextFree(className)) return false;
	for (const token of tokenize(className)) {
		if (token.variants.length > 0) return false;
	}
	return true;
}
