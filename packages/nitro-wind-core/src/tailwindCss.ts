import { type TailwindThemeConfig, flattenTailwindTheme, parseLength } from "./tailwindConfig";
import type { ThemeTokenScale } from "./theme";

const COLOR_NAMESPACES = ["color", "background-color", "text-color", "border-color"] as const;
const SKIP_IMPORTS = new Set(["tailwindcss", "uniwind", "nitro-wind"]);

function stripComments(source: string): string {
	return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

function extractBraceBlock(
	source: string,
	openIndex: number,
): { inner: string; end: number } | null {
	if (source[openIndex] !== "{") return null;
	let depth = 0;
	for (let i = openIndex; i < source.length; i++) {
		const ch = source[i];
		if (ch === "{") depth++;
		else if (ch === "}") {
			depth--;
			if (depth === 0) return { inner: source.slice(openIndex + 1, i), end: i + 1 };
		}
	}
	return null;
}

function extractThemeBlocks(source: string): string[] {
	const cleaned = stripComments(source);
	const blocks: string[] = [];
	const re = /@theme\b/g;
	let match: RegExpExecArray | null = re.exec(cleaned);
	while (match) {
		const brace = cleaned.indexOf("{", match.index);
		if (brace === -1) break;
		const block = extractBraceBlock(cleaned, brace);
		if (!block) break;
		blocks.push(block.inner);
		re.lastIndex = block.end;
		match = re.exec(cleaned);
	}
	return blocks;
}

export function extractAtConfigPath(source: string): string | undefined {
	const match = stripComments(source).match(/@config\s+["']([^"']+)["']/);
	return match?.[1];
}

export function extractLocalCssImports(source: string): string[] {
	const cleaned = stripComments(source);
	const imports: string[] = [];
	const re = /@import\s+(?:url\()?["']([^"']+)["']\)?/g;
	let match: RegExpExecArray | null = re.exec(cleaned);
	while (match) {
		const spec = match[1];
		if (!spec) {
			match = re.exec(cleaned);
			continue;
		}
		const bare = spec.split("?")[0]?.replace(/^~/, "") ?? spec;
		const pkg = bare.split("/")[0];
		if (pkg && SKIP_IMPORTS.has(pkg)) {
			match = re.exec(cleaned);
			continue;
		}
		if (bare.startsWith(".") || bare.endsWith(".css")) imports.push(bare);
		match = re.exec(cleaned);
	}
	return imports;
}

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value));
}

function toHexByte(value: number): string {
	return Math.round(clamp01(value) * 255)
		.toString(16)
		.padStart(2, "0");
}

function linearToSrgb(value: number): number {
	const abs = Math.abs(value);
	return abs > 0.0031308 ? Math.sign(value) * (1.055 * abs ** (1 / 2.4) - 0.055) : 12.92 * value;
}

function oklabToHex(L: number, a: number, b: number, alpha?: number): string {
	const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = L - 0.0894841775 * a - 1.291485548 * b;
	const l = l_ ** 3;
	const m = m_ ** 3;
	const s = s_ ** 3;
	const r = linearToSrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
	const g = linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
	const blue = linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
	if (alpha != null && alpha < 1) {
		return `rgba(${Math.round(clamp01(r) * 255)},${Math.round(clamp01(g) * 255)},${Math.round(clamp01(blue) * 255)},${alpha})`;
	}
	return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(blue)}`;
}

function parseAlpha(raw: string | undefined): number | undefined {
	if (raw == null) return undefined;
	const trimmed = raw.trim();
	if (trimmed.endsWith("%")) return Number.parseFloat(trimmed) / 100;
	const n = Number.parseFloat(trimmed);
	return Number.isFinite(n) ? n : undefined;
}

function parseOklch(value: string): string | undefined {
	const match = value.match(
		/^oklch\(\s*([-\d.]+%?)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([-\d.]+%?))?\s*\)$/i,
	);
	if (!match) return undefined;
	let L = Number.parseFloat(match[1] ?? "");
	if ((match[1] ?? "").endsWith("%")) L /= 100;
	const C = Number.parseFloat(match[2] ?? "");
	const h = Number.parseFloat(match[3] ?? "");
	if (![L, C, h].every(Number.isFinite)) return undefined;
	const hr = (h * Math.PI) / 180;
	return oklabToHex(L, C * Math.cos(hr), C * Math.sin(hr), parseAlpha(match[4]));
}

function parseHsl(value: string): string | undefined {
	const match = value.match(
		/^hsla?\(\s*([-\d.]+)(?:deg)?[\s,]+([-\d.]+)%[\s,]+([-\d.]+)%(?:\s*[,/]\s*([-\d.]+%?))?\s*\)$/i,
	);
	if (!match) return undefined;
	const h = Number.parseFloat(match[1] ?? "");
	const s = Number.parseFloat(match[2] ?? "") / 100;
	const l = Number.parseFloat(match[3] ?? "") / 100;
	if (![h, s, l].every(Number.isFinite)) return undefined;
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	let r = 0;
	let g = 0;
	let b = 0;
	if (h < 60) {
		r = c;
		g = x;
	} else if (h < 120) {
		r = x;
		g = c;
	} else if (h < 180) {
		g = c;
		b = x;
	} else if (h < 240) {
		g = x;
		b = c;
	} else if (h < 300) {
		r = x;
		b = c;
	} else {
		r = c;
		b = x;
	}
	const alpha = parseAlpha(match[4]);
	if (alpha != null && alpha < 1) {
		return `rgba(${Math.round((r + m) * 255)},${Math.round((g + m) * 255)},${Math.round((b + m) * 255)},${alpha})`;
	}
	return `#${toHexByte(r + m)}${toHexByte(g + m)}${toHexByte(b + m)}`;
}

export function normalizeThemeColor(value: string): string {
	const trimmed = value.trim().replace(/\s+/g, " ");
	if (trimmed === "transparent" || trimmed === "inherit" || trimmed === "currentColor")
		return trimmed;
	if (trimmed.startsWith("#") || trimmed.startsWith("rgb")) return trimmed.replace(/\s+/g, "");
	return parseOklch(trimmed) ?? parseHsl(trimmed) ?? trimmed;
}

function parseDeclarations(block: string): Array<{ name: string; value: string }> {
	const decls: Array<{ name: string; value: string }> = [];
	let i = 0;
	while (i < block.length) {
		const start = block.indexOf("--", i);
		if (start === -1) break;
		const colon = block.indexOf(":", start);
		if (colon === -1) break;
		const name = block.slice(start, colon).trim();
		let depth = 0;
		let j = colon + 1;
		for (; j < block.length; j++) {
			const ch = block[j];
			if (ch === "(") depth++;
			else if (ch === ")") depth = Math.max(0, depth - 1);
			else if (ch === ";" && depth === 0) break;
		}
		const value = block.slice(colon + 1, j).trim();
		if (name) decls.push({ name, value });
		i = j + 1;
	}
	return decls;
}

function namespaceSuffix(name: string, namespace: string): string | undefined {
	const prefix = `--${namespace}-`;
	if (name === `--${namespace}`) return "DEFAULT";
	if (!name.startsWith(prefix)) return undefined;
	const suffix = name.slice(prefix.length);
	if (!suffix || suffix.includes("--")) return undefined;
	return suffix === "*" ? undefined : suffix;
}

function emptyScale(): ThemeTokenScale {
	return {
		colors: {},
		spacing: {},
		radius: {},
		fontSize: {},
		breakpoints: {},
	};
}

export function flattenTailwindCss(source: string): ThemeTokenScale {
	const tokens = emptyScale();
	for (const block of extractThemeBlocks(source)) {
		for (const { name, value } of parseDeclarations(block)) {
			if (name === "--color-*" && value === "initial") {
				tokens.replaceColors = true;
				tokens.colors = {};
				continue;
			}
			if (name === "--spacing-*" && value === "initial") {
				tokens.replaceSpacing = true;
				tokens.spacing = {};
				continue;
			}
			if (name === "--radius-*" && value === "initial") {
				tokens.replaceRadius = true;
				tokens.radius = {};
				continue;
			}
			if ((name === "--text-*" || name === "--font-size-*") && value === "initial") {
				tokens.replaceFontSize = true;
				tokens.fontSize = {};
				continue;
			}
			if (name === "--breakpoint-*" && value === "initial") {
				tokens.replaceBreakpoints = true;
				tokens.breakpoints = {};
				continue;
			}

			for (const ns of COLOR_NAMESPACES) {
				const suffix = namespaceSuffix(name, ns);
				if (suffix) {
					tokens.colors = tokens.colors ?? {};
					tokens.colors[suffix] = normalizeThemeColor(value);
				}
			}

			const spacing = namespaceSuffix(name, "spacing");
			if (spacing) {
				const parsed = parseLength(value);
				if (parsed != null) {
					tokens.spacing = tokens.spacing ?? {};
					tokens.spacing[spacing] = parsed;
				}
			}

			const radius = namespaceSuffix(name, "radius");
			if (radius) {
				const parsed = parseLength(value);
				if (parsed != null) {
					tokens.radius = tokens.radius ?? {};
					tokens.radius[radius] = parsed;
				}
			}

			const text = namespaceSuffix(name, "text") ?? namespaceSuffix(name, "font-size");
			if (text) {
				const parsed = parseLength(value);
				if (parsed != null) {
					tokens.fontSize = tokens.fontSize ?? {};
					tokens.fontSize[text] = parsed;
				}
			}

			const breakpoint = namespaceSuffix(name, "breakpoint");
			if (breakpoint) {
				const parsed = parseLength(value);
				if (parsed != null) {
					tokens.breakpoints = tokens.breakpoints ?? {};
					tokens.breakpoints[breakpoint] = parsed;
				}
			}
		}
	}
	return tokens;
}

export function mergeThemeTokens(
	...scales: Array<ThemeTokenScale | null | undefined>
): ThemeTokenScale {
	const out = emptyScale();
	for (const scale of scales) {
		if (!scale) continue;
		if (scale.replaceColors) {
			out.colors = {};
			out.replaceColors = true;
		}
		if (scale.replaceSpacing) {
			out.spacing = {};
			out.replaceSpacing = true;
		}
		if (scale.replaceRadius) {
			out.radius = {};
			out.replaceRadius = true;
		}
		if (scale.replaceFontSize) {
			out.fontSize = {};
			out.replaceFontSize = true;
		}
		if (scale.replaceBreakpoints) {
			out.breakpoints = {};
			out.replaceBreakpoints = true;
		}
		out.colors = { ...out.colors, ...scale.colors };
		out.spacing = { ...out.spacing, ...scale.spacing };
		out.radius = { ...out.radius, ...scale.radius };
		out.fontSize = { ...out.fontSize, ...scale.fontSize };
		out.breakpoints = { ...out.breakpoints, ...scale.breakpoints };
	}
	return out;
}

export type TailwindThemeSources = {
	css?: string | null;
	config?: TailwindThemeConfig | null;
};

export function flattenTailwindSources(sources: TailwindThemeSources): ThemeTokenScale {
	return mergeThemeTokens(
		sources.css ? flattenTailwindCss(sources.css) : undefined,
		sources.config ? flattenTailwindTheme(sources.config) : undefined,
	);
}
