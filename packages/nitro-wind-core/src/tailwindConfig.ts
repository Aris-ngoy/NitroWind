import { COLORS, type ThemeTokenScale } from "./theme";

export type TailwindThemeConfig = {
	theme?: {
		colors?: unknown;
		spacing?: unknown;
		borderRadius?: unknown;
		fontSize?: unknown;
		screens?: unknown;
		extend?: {
			colors?: unknown;
			spacing?: unknown;
			borderRadius?: unknown;
			fontSize?: unknown;
			screens?: unknown;
		};
	};
};

type ThemePathFn = (path: string) => unknown;

function themePath(path: string): unknown {
	const parts = path.split(".");
	if (parts[0] === "colors") {
		let current: unknown = COLORS;
		for (const part of parts.slice(1)) {
			if (!current || typeof current !== "object") return undefined;
			current = (current as Record<string, unknown>)[part];
		}
		return current;
	}
	return undefined;
}

function resolveMaybeFn(value: unknown): unknown {
	if (typeof value !== "function") return value;
	const theme = themePath as ThemePathFn;
	return value({ colors: COLORS, theme });
}

export function parseLength(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	if (trimmed.endsWith("rem")) {
		const n = Number.parseFloat(trimmed);
		return Number.isFinite(n) ? n * 16 : undefined;
	}
	if (trimmed.endsWith("px")) {
		const n = Number.parseFloat(trimmed);
		return Number.isFinite(n) ? n : undefined;
	}
	const n = Number.parseFloat(trimmed);
	return Number.isFinite(n) ? n : undefined;
}

export function flattenColors(input: unknown, prefix = ""): Record<string, string> {
	if (typeof input === "string") {
		return prefix ? { [prefix]: input } : {};
	}
	if (!input || typeof input !== "object") return {};
	const out: Record<string, string> = {};
	for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
		if (key === "DEFAULT" && typeof value === "string" && prefix) {
			out[prefix] = value;
			continue;
		}
		const next = prefix ? `${prefix}-${key}` : key;
		if (typeof value === "string") {
			out[next] = value;
		} else if (value && typeof value === "object") {
			Object.assign(out, flattenColors(value, next));
		}
	}
	return out;
}

function flattenLengths(input: unknown): Record<string, number> {
	if (!input || typeof input !== "object") return {};
	const out: Record<string, number> = {};
	for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
		const token = key === "DEFAULT" ? "DEFAULT" : key;
		const parsed = parseLength(value);
		if (parsed != null) out[token] = parsed;
	}
	return out;
}

function flattenFontSizes(input: unknown): Record<string, number> {
	if (!input || typeof input !== "object") return {};
	const out: Record<string, number> = {};
	for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
		const raw = Array.isArray(value) ? value[0] : value;
		const parsed = parseLength(raw);
		if (parsed != null) out[key] = parsed;
	}
	return out;
}

function flattenScreens(input: unknown): Record<string, number> {
	if (!input || typeof input !== "object") return {};
	const out: Record<string, number> = {};
	for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
		if (typeof value === "string" || typeof value === "number") {
			const parsed = parseLength(value);
			if (parsed != null) out[key] = parsed;
			continue;
		}
		if (value && typeof value === "object" && "min" in value) {
			const parsed = parseLength((value as { min?: unknown }).min);
			if (parsed != null) out[key] = parsed;
		}
	}
	return out;
}

export function flattenTailwindTheme(
	config: TailwindThemeConfig | null | undefined,
): ThemeTokenScale {
	const theme = config?.theme ?? {};
	const extend = theme.extend ?? {};

	const colors: Record<string, string> = {};
	if (theme.colors != null) Object.assign(colors, flattenColors(resolveMaybeFn(theme.colors)));
	if (extend.colors != null) Object.assign(colors, flattenColors(resolveMaybeFn(extend.colors)));

	const spacing: Record<string, number> = {};
	if (theme.spacing != null) Object.assign(spacing, flattenLengths(resolveMaybeFn(theme.spacing)));
	if (extend.spacing != null)
		Object.assign(spacing, flattenLengths(resolveMaybeFn(extend.spacing)));

	const radius: Record<string, number> = {};
	if (theme.borderRadius != null)
		Object.assign(radius, flattenLengths(resolveMaybeFn(theme.borderRadius)));
	if (extend.borderRadius != null)
		Object.assign(radius, flattenLengths(resolveMaybeFn(extend.borderRadius)));

	const fontSize: Record<string, number> = {};
	if (theme.fontSize != null)
		Object.assign(fontSize, flattenFontSizes(resolveMaybeFn(theme.fontSize)));
	if (extend.fontSize != null)
		Object.assign(fontSize, flattenFontSizes(resolveMaybeFn(extend.fontSize)));

	const breakpoints: Record<string, number> = {};
	if (theme.screens != null)
		Object.assign(breakpoints, flattenScreens(resolveMaybeFn(theme.screens)));
	if (extend.screens != null)
		Object.assign(breakpoints, flattenScreens(resolveMaybeFn(extend.screens)));

	return {
		colors,
		spacing,
		radius,
		fontSize,
		breakpoints,
		replaceColors: theme.colors != null,
		replaceSpacing: theme.spacing != null,
		replaceRadius: theme.borderRadius != null,
		replaceFontSize: theme.fontSize != null,
		replaceBreakpoints: theme.screens != null,
	};
}
