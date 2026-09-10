import {
	BREAKPOINTS,
	DURATION,
	FONT_SIZE,
	FONT_WEIGHT,
	LINE_HEIGHT,
	OPACITY,
	RADIUS,
	SPACING,
	Z_INDEX,
	applyAlpha,
	resolveColor,
} from "./theme";
import { tokenize } from "./tokenizer";
import type { AnimationMeta, StyleContext, StyleRecord, StyleValue } from "./types";

const SPACING_PROPS: Record<string, string[]> = {
	p: ["padding"],
	px: ["paddingHorizontal"],
	py: ["paddingVertical"],
	pt: ["paddingTop"],
	pb: ["paddingBottom"],
	pl: ["paddingLeft"],
	pr: ["paddingRight"],
	ps: ["paddingStart"],
	pe: ["paddingEnd"],
	m: ["margin"],
	mx: ["marginHorizontal"],
	my: ["marginVertical"],
	mt: ["marginTop"],
	mb: ["marginBottom"],
	ml: ["marginLeft"],
	mr: ["marginRight"],
	ms: ["marginStart"],
	me: ["marginEnd"],
	gap: ["gap"],
	"gap-x": ["columnGap"],
	"gap-y": ["rowGap"],
	inset: ["top", "right", "bottom", "left"],
	"inset-x": ["left", "right"],
	"inset-y": ["top", "bottom"],
	top: ["top"],
	right: ["right"],
	bottom: ["bottom"],
	left: ["left"],
	start: ["start"],
	end: ["end"],
	w: ["width"],
	h: ["height"],
	"min-w": ["minWidth"],
	"min-h": ["minHeight"],
	"max-w": ["maxWidth"],
	"max-h": ["maxHeight"],
	basis: ["flexBasis"],
};

const COLOR_PROPS: Record<string, string> = {
	bg: "backgroundColor",
	text: "color",
	border: "borderColor",
	"border-t": "borderTopColor",
	"border-r": "borderRightColor",
	"border-b": "borderBottomColor",
	"border-l": "borderLeftColor",
	tint: "tintColor",
	shadow: "shadowColor",
	decoration: "textDecorationColor",
};

const EXACT: Record<string, StyleRecord> = {
	flex: { display: "flex", flexDirection: "column" },
	hidden: { display: "none" },
	"flex-1": { flex: 1 },
	"flex-auto": { flexGrow: 1, flexShrink: 1, flexBasis: "auto" },
	"flex-none": { flexGrow: 0, flexShrink: 0, flexBasis: "auto" },
	"flex-row": { flexDirection: "row" },
	"flex-row-reverse": { flexDirection: "row-reverse" },
	"flex-col": { flexDirection: "column" },
	"flex-col-reverse": { flexDirection: "column-reverse" },
	"flex-wrap": { flexWrap: "wrap" },
	"flex-nowrap": { flexWrap: "nowrap" },
	"flex-wrap-reverse": { flexWrap: "wrap-reverse" },
	grow: { flexGrow: 1 },
	"grow-0": { flexGrow: 0 },
	shrink: { flexShrink: 1 },
	"shrink-0": { flexShrink: 0 },
	"items-start": { alignItems: "flex-start" },
	"items-end": { alignItems: "flex-end" },
	"items-center": { alignItems: "center" },
	"items-stretch": { alignItems: "stretch" },
	"items-baseline": { alignItems: "baseline" },
	"justify-start": { justifyContent: "flex-start" },
	"justify-end": { justifyContent: "flex-end" },
	"justify-center": { justifyContent: "center" },
	"justify-between": { justifyContent: "space-between" },
	"justify-around": { justifyContent: "space-around" },
	"justify-evenly": { justifyContent: "space-evenly" },
	"content-start": { alignContent: "flex-start" },
	"content-end": { alignContent: "flex-end" },
	"content-center": { alignContent: "center" },
	"content-between": { alignContent: "space-between" },
	"content-around": { alignContent: "space-around" },
	"content-stretch": { alignContent: "stretch" },
	"self-auto": { alignSelf: "auto" },
	"self-start": { alignSelf: "flex-start" },
	"self-end": { alignSelf: "flex-end" },
	"self-center": { alignSelf: "center" },
	"self-stretch": { alignSelf: "stretch" },
	"self-baseline": { alignSelf: "baseline" },
	absolute: { position: "absolute" },
	relative: { position: "relative" },
	static: { position: "static" },
	"overflow-hidden": { overflow: "hidden" },
	"overflow-visible": { overflow: "visible" },
	"overflow-scroll": { overflow: "scroll" },
	"overflow-auto": { overflow: "visible" },
	italic: { fontStyle: "italic" },
	"not-italic": { fontStyle: "normal" },
	underline: { textDecorationLine: "underline" },
	"line-through": { textDecorationLine: "line-through" },
	"no-underline": { textDecorationLine: "none" },
	uppercase: { textTransform: "uppercase" },
	lowercase: { textTransform: "lowercase" },
	capitalize: { textTransform: "capitalize" },
	"normal-case": { textTransform: "none" },
	"text-left": { textAlign: "left" },
	"text-center": { textAlign: "center" },
	"text-right": { textAlign: "right" },
	"text-justify": { textAlign: "justify" },
	"text-auto": { textAlign: "auto" },
	truncate: { overflow: "hidden" },
	"border-solid": { borderStyle: "solid" },
	"border-dashed": { borderStyle: "dashed" },
	"border-dotted": { borderStyle: "dotted" },
	border: { borderWidth: 1 },
	"border-0": { borderWidth: 0 },
	"border-2": { borderWidth: 2 },
	"border-4": { borderWidth: 4 },
	"border-8": { borderWidth: 8 },
	"border-t": { borderTopWidth: 1 },
	"border-r": { borderRightWidth: 1 },
	"border-b": { borderBottomWidth: 1 },
	"border-l": { borderLeftWidth: 1 },
	"border-x": { borderLeftWidth: 1, borderRightWidth: 1 },
	"border-y": { borderTopWidth: 1, borderBottomWidth: 1 },
	rounded: { borderRadius: RADIUS.DEFAULT ?? 4 },
	"rounded-none": { borderRadius: 0 },
	"rounded-full": { borderRadius: RADIUS.full ?? 9999 },
	"pointer-events-none": { pointerEvents: "none" },
	"pointer-events-auto": { pointerEvents: "auto" },
	"pointer-events-box-none": { pointerEvents: "box-none" },
	"pointer-events-box-only": { pointerEvents: "box-only" },
	"z-auto": { zIndex: 0 },
	"w-full": { width: "100%" },
	"h-full": { height: "100%" },
	"w-screen": { width: "100%" },
	"h-screen": { height: "100%" },
	"w-auto": { width: "auto" },
	"h-auto": { height: "auto" },
	"min-w-full": { minWidth: "100%" },
	"min-h-full": { minHeight: "100%" },
	"max-w-full": { maxWidth: "100%" },
	"max-h-full": { maxHeight: "100%" },
	"aspect-square": { aspectRatio: 1 },
	"aspect-video": { aspectRatio: 16 / 9 },
	"object-cover": { resizeMode: "cover" },
	"object-contain": { resizeMode: "contain" },
	"object-stretch": { resizeMode: "stretch" },
	"object-center": { resizeMode: "center" },
	"object-repeat": { resizeMode: "repeat" },
	"shadow-sm": {
		shadowColor: "#000000",
		shadowOffsetWidth: 0,
		shadowOffsetHeight: 1,
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 1,
	},
	shadow: {
		shadowColor: "#000000",
		shadowOffsetWidth: 0,
		shadowOffsetHeight: 2,
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 3,
	},
	"shadow-md": {
		shadowColor: "#000000",
		shadowOffsetWidth: 0,
		shadowOffsetHeight: 4,
		shadowOpacity: 0.18,
		shadowRadius: 6,
		elevation: 4,
	},
	"shadow-lg": {
		shadowColor: "#000000",
		shadowOffsetWidth: 0,
		shadowOffsetHeight: 8,
		shadowOpacity: 0.22,
		shadowRadius: 10,
		elevation: 8,
	},
	"shadow-xl": {
		shadowColor: "#000000",
		shadowOffsetWidth: 0,
		shadowOffsetHeight: 12,
		shadowOpacity: 0.25,
		shadowRadius: 16,
		elevation: 12,
	},
	"shadow-2xl": {
		shadowColor: "#000000",
		shadowOffsetWidth: 0,
		shadowOffsetHeight: 16,
		shadowOpacity: 0.3,
		shadowRadius: 24,
		elevation: 16,
	},
	"shadow-none": {
		shadowColor: "transparent",
		shadowOffsetWidth: 0,
		shadowOffsetHeight: 0,
		shadowOpacity: 0,
		shadowRadius: 0,
		elevation: 0,
	},
};

const FRACTIONS: Record<string, string> = {
	"1/2": "50%",
	"1/3": "33.333333%",
	"2/3": "66.666667%",
	"1/4": "25%",
	"2/4": "50%",
	"3/4": "75%",
	"1/5": "20%",
	"2/5": "40%",
	"3/5": "60%",
	"4/5": "80%",
	"1/6": "16.666667%",
	"5/6": "83.333333%",
	full: "100%",
};

function parseArbitrary(raw: string): StyleValue | undefined {
	if (!raw.startsWith("[") || !raw.endsWith("]")) return undefined;
	const inner = raw.slice(1, -1).replace(/_/g, " ");
	if (inner.endsWith("px")) {
		const n = Number.parseFloat(inner.slice(0, -2));
		return Number.isFinite(n) ? n : inner;
	}
	if (inner.endsWith("rem")) {
		const n = Number.parseFloat(inner.slice(0, -3));
		return Number.isFinite(n) ? n * 16 : inner;
	}
	if (inner.endsWith("%")) return inner;
	const n = Number.parseFloat(inner);
	if (Number.isFinite(n) && /^-?\d+(\.\d+)?$/.test(inner)) return n;
	return inner;
}

function splitOpacity(utility: string): { base: string; alpha?: number } {
	const slash = utility.lastIndexOf("/");
	if (slash <= 0) return { base: utility };
	const suffix = utility.slice(slash + 1);
	const alpha = OPACITY[suffix] ?? Number.parseFloat(suffix) / 100;
	if (!Number.isFinite(alpha)) return { base: utility };
	return { base: utility.slice(0, slash), alpha };
}

function longestPrefix(utility: string, prefixes: string[]): string | undefined {
	let best: string | undefined;
	for (const prefix of prefixes) {
		if (utility === prefix || utility.startsWith(`${prefix}-`)) {
			if (!best || prefix.length > best.length) best = prefix;
		}
	}
	return best;
}

function assign(target: StyleRecord, patch: StyleRecord): void {
	for (const [key, value] of Object.entries(patch)) {
		target[key] = value;
	}
}

function resolveSpacingValue(value: string): StyleValue | undefined {
	if (value === "auto") return "auto";
	if (value in FRACTIONS) return FRACTIONS[value];
	if (value in SPACING) return SPACING[value];
	const arbitrary = parseArbitrary(value);
	return arbitrary;
}

function applyColor(
	target: StyleRecord,
	prop: string,
	colorToken: string,
	alpha?: number,
): boolean {
	const color = resolveColor(colorToken);
	if (!color) return false;
	target[prop] = alpha == null ? color : applyAlpha(color, alpha);
	return true;
}

export function resolveUtility(utility: string): StyleRecord | null {
	if (!utility) return null;
	const { base, alpha } = splitOpacity(utility);

	const exact = EXACT[base];
	if (exact) return { ...exact };

	if (base.startsWith("rounded-")) {
		const rest = base.slice("rounded-".length);
		const directional: Record<string, string[]> = {
			t: ["borderTopLeftRadius", "borderTopRightRadius"],
			b: ["borderBottomLeftRadius", "borderBottomRightRadius"],
			l: ["borderTopLeftRadius", "borderBottomLeftRadius"],
			r: ["borderTopRightRadius", "borderBottomRightRadius"],
			tl: ["borderTopLeftRadius"],
			tr: ["borderTopRightRadius"],
			bl: ["borderBottomLeftRadius"],
			br: ["borderBottomRightRadius"],
		};
		const parts = rest.split("-");
		const maybeDir = parts[0];
		if (maybeDir && maybeDir in directional && parts.length >= 1) {
			const sizeKey = parts.length === 1 ? "DEFAULT" : parts.slice(1).join("-");
			const size = sizeKey === "DEFAULT" ? RADIUS.DEFAULT : RADIUS[sizeKey];
			if (size != null) {
				const out: StyleRecord = {};
				for (const key of directional[maybeDir] ?? []) out[key] = size;
				return out;
			}
		}
		const size = RADIUS[rest];
		if (size != null) return { borderRadius: size };
	}

	if (base.startsWith("text-")) {
		const rest = base.slice(5);
		if (rest in FONT_SIZE) return { fontSize: FONT_SIZE[rest] as number };
		const out: StyleRecord = {};
		if (applyColor(out, "color", rest, alpha)) return out;
		const arbitrary = parseArbitrary(rest);
		if (typeof arbitrary === "number") return { fontSize: arbitrary };
		if (typeof arbitrary === "string" && arbitrary.startsWith("#")) return { color: arbitrary };
	}

	if (base.startsWith("font-")) {
		const rest = base.slice(5);
		if (rest in FONT_WEIGHT) return { fontWeight: FONT_WEIGHT[rest] as string };
	}

	if (base.startsWith("leading-")) {
		const rest = base.slice(8);
		if (rest in LINE_HEIGHT) return { lineHeight: LINE_HEIGHT[rest] as number };
	}

	if (base.startsWith("tracking-")) {
		const tracking: Record<string, number> = {
			tighter: -0.8,
			tight: -0.4,
			normal: 0,
			wide: 0.4,
			wider: 0.8,
			widest: 1.6,
		};
		const rest = base.slice(9);
		if (rest in tracking) return { letterSpacing: tracking[rest] as number };
	}

	if (base.startsWith("opacity-")) {
		const rest = base.slice(8);
		if (rest in OPACITY) return { opacity: OPACITY[rest] as number };
	}

	if (base.startsWith("z-")) {
		const rest = base.slice(2);
		if (rest in Z_INDEX) return { zIndex: Z_INDEX[rest] as number };
		const n = Number.parseInt(rest, 10);
		if (Number.isFinite(n)) return { zIndex: n };
	}

	if (base.startsWith("border-")) {
		const rest = base.slice(7);
		const widthMatch = rest.match(/^(t|r|b|l|x|y|s|e)?-?(\d+)$/);
		if (widthMatch) {
			const dir = widthMatch[1];
			const n = Number(widthMatch[2]);
			if (dir == null) return { borderWidth: n };
			if (dir === "t") return { borderTopWidth: n };
			if (dir === "r") return { borderRightWidth: n };
			if (dir === "b") return { borderBottomWidth: n };
			if (dir === "l") return { borderLeftWidth: n };
			if (dir === "x") return { borderLeftWidth: n, borderRightWidth: n };
			if (dir === "y") return { borderTopWidth: n, borderBottomWidth: n };
		}
		const out: StyleRecord = {};
		if (applyColor(out, "borderColor", rest, alpha)) return out;
	}

	const colorPrefix = longestPrefix(base, Object.keys(COLOR_PROPS));
	if (colorPrefix) {
		const rest = base.slice(colorPrefix.length + 1);
		const prop = COLOR_PROPS[colorPrefix];
		if (prop && rest) {
			const out: StyleRecord = {};
			const arbitrary = parseArbitrary(rest);
			if (typeof arbitrary === "string") {
				out[prop] = alpha == null ? arbitrary : applyAlpha(arbitrary, alpha);
				return out;
			}
			if (applyColor(out, prop, rest, alpha)) return out;
		}
	}

	const spacingPrefix = longestPrefix(base, Object.keys(SPACING_PROPS));
	if (spacingPrefix) {
		const rest = base.slice(spacingPrefix.length + 1);
		const props = SPACING_PROPS[spacingPrefix];
		if (props && rest) {
			const value = resolveSpacingValue(rest);
			if (value !== undefined) {
				const out: StyleRecord = {};
				for (const prop of props) out[prop] = value;
				return out;
			}
		}
	}

	if (base.startsWith("translate-x-") || base.startsWith("translate-y-")) {
		const axis = base.startsWith("translate-x-") ? "translateX" : "translateY";
		const rest = base.slice(axis === "translateX" ? 12 : 12);
		const value = resolveSpacingValue(rest);
		if (value !== undefined) return { [axis]: value };
	}

	if (base.startsWith("scale-")) {
		const rest = base.slice(6);
		const n = Number.parseFloat(rest) / 100;
		if (Number.isFinite(n)) return { scale: n };
	}

	if (base.startsWith("rotate-")) {
		const rest = base.slice(7);
		const n = Number.parseFloat(rest);
		if (Number.isFinite(n)) return { rotate: `${n}deg` };
	}

	if (base.startsWith("aspect-[")) {
		const arbitrary = parseArbitrary(base.slice("aspect-".length));
		if (typeof arbitrary === "string" && arbitrary.includes("/")) {
			const [a, b] = arbitrary.split("/").map(Number);
			if (a && b) return { aspectRatio: a / b };
		}
		if (typeof arbitrary === "number") return { aspectRatio: arbitrary };
	}

	return null;
}

export function variantMatches(variant: string, context: StyleContext): boolean {
	switch (variant) {
		case "dark":
			return context.colorScheme === "dark";
		case "light":
			return context.colorScheme === "light";
		case "ios":
			return context.platform === "ios";
		case "android":
			return context.platform === "android";
		case "web":
			return context.platform === "web";
		case "rtl":
			return context.isRTL;
		case "ltr":
			return !context.isRTL;
		case "active":
		case "pressed":
			return context.pressed;
		case "hover":
			return context.hovered;
		case "focus":
			return context.focused;
		case "disabled":
			return context.disabled;
		case "group":
			return true;
		case "group-active":
		case "group-pressed":
			return context.groupActive;
		case "group-focus":
			return context.groupFocus;
		case "group-hover":
			return context.groupHover;
		default:
			if (variant in BREAKPOINTS) {
				return context.width >= (BREAKPOINTS[variant] as number);
			}
			return false;
	}
}

export function parseAnimation(className: string): AnimationMeta {
	const meta: AnimationMeta = {
		name: null,
		durationMs: 150,
		easing: "ease",
		transition: false,
	};
	for (const token of tokenize(className)) {
		const u = token.utility;
		if (u === "animate-none") meta.name = "none";
		else if (u === "animate-spin") meta.name = "spin";
		else if (u === "animate-ping") meta.name = "ping";
		else if (u === "animate-pulse") meta.name = "pulse";
		else if (u === "animate-bounce") meta.name = "bounce";
		else if (u === "transition" || u.startsWith("transition-")) meta.transition = true;
		else if (u.startsWith("duration-")) {
			const rest = u.slice(9);
			if (rest in DURATION) meta.durationMs = DURATION[rest] as number;
		} else if (u === "ease-linear") meta.easing = "linear";
		else if (u === "ease-in") meta.easing = "ease-in";
		else if (u === "ease-out") meta.easing = "ease-out";
		else if (u === "ease-in-out") meta.easing = "ease-in-out";
	}
	return meta;
}

export function parseClassName(className: string, context: StyleContext): StyleRecord {
	const result: StyleRecord = {};
	for (const token of tokenize(className)) {
		if (token.variants.some((variant) => !variantMatches(variant, context))) {
			continue;
		}
		const patch = resolveUtility(token.utility);
		if (patch) assign(result, patch);
	}
	return result;
}
