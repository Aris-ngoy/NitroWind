import {
	applyThemeTokens as applyCoreThemeTokens,
	flattenTailwindCss,
	flattenTailwindSources,
	flattenTailwindTheme,
	resetThemeTokens,
	type TailwindThemeConfig,
	type TailwindThemeSources,
	type ThemeTokenScale,
} from "nitro-wind-core";
import { registerNativeThemeTokens } from "./engine";

export type { TailwindThemeConfig, TailwindThemeSources, ThemeTokenScale };

function writeEntries(lines: string[], kind: string, values: Record<string, string | number> | undefined): void {
	if (!values) return;
	for (const [key, value] of Object.entries(values)) {
		lines.push(`${kind}\t${key}\t${value}`);
	}
}

export function serializeThemePayload(tokens: ThemeTokenScale, reset = false): string {
	const lines: string[] = reset ? ["RESET"] : [];
	if (tokens.replaceColors) lines.push("X\tcolors");
	if (tokens.replaceSpacing) lines.push("X\tspacing");
	if (tokens.replaceRadius) lines.push("X\tradius");
	if (tokens.replaceFontSize) lines.push("X\tfontSize");
	if (tokens.replaceBreakpoints) lines.push("X\tbreakpoints");
	writeEntries(lines, "C", tokens.colors);
	writeEntries(lines, "S", tokens.spacing);
	writeEntries(lines, "R", tokens.radius);
	writeEntries(lines, "F", tokens.fontSize);
	writeEntries(lines, "B", tokens.breakpoints);
	return lines.join("\n");
}

export function applyThemeTokens(tokens: ThemeTokenScale, reset = false): void {
	if (reset) resetThemeTokens();
	applyCoreThemeTokens(tokens);
	registerNativeThemeTokens(serializeThemePayload(tokens, reset));
}

export function loadTailwindConfig(config: TailwindThemeConfig | null | undefined): ThemeTokenScale {
	return loadTailwindTheme({ config });
}

export function loadTailwindCss(css: string | null | undefined): ThemeTokenScale {
	return loadTailwindTheme({ css });
}

export function loadTailwindTheme(sources: TailwindThemeSources): ThemeTokenScale {
	const tokens = flattenTailwindSources(sources);
	applyThemeTokens(tokens, true);
	return tokens;
}

export { flattenTailwindCss, flattenTailwindSources, flattenTailwindTheme };
