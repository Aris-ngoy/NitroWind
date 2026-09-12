import type { StyleContext } from "nitro-wind-core";
import { computeStyle } from "./engine";
import { useStyle } from "./useStyle";

declare const process: { env?: Record<string, string | undefined> } | undefined;

export const classToStyle = (s: string): string =>
	s === "className" ? "style" : s.replace(/ClassName$/, "Style");

export const classToColor = (s: string): string => s.replace(/ClassName$/, "");

export const isColorClassProperty = (s: string): boolean =>
	s !== "colorsClassName" &&
	s.endsWith("ClassName") &&
	(s.toLowerCase().includes("color") ||
		s.endsWith("ColorClassName") ||
		s.endsWith("backgroundColorClassName"));

export const isClassProperty = (s: string): boolean => s === "className" || s.endsWith("ClassName");

export const isStyleProperty = (s: string): boolean => s === "style" || s.endsWith("Style");

let warnedAccent = false;

export function getAccentColor(
	className?: string,
	context?: Partial<StyleContext>,
): string | undefined {
	if (!className || typeof className !== "string" || className.trim() === "") {
		return undefined;
	}
	const resolved = computeStyle(className, context);
	const style = resolved.style as Record<string, unknown> | undefined;
	const accent =
		(style?.accentColor as string | undefined) ??
		(style?.color as string | undefined) ??
		(style?.tintColor as string | undefined);

	if (
		typeof process !== "undefined" &&
		process.env?.NODE_ENV !== "production" &&
		!accent &&
		!warnedAccent
	) {
		warnedAccent = true;
		console.warn(
			`NitroWind: className '${className}' was provided to extract accentColor but no color was found. Make sure the className includes a color utility (e.g., 'accent-red-500', 'accent-blue-600'). See https://docs.uniwind.dev/class-names#the-accent-prefix`,
		);
	}
	return accent;
}

export function useAccentColor(
	className?: string,
	overrides?: Partial<StyleContext>,
): string | undefined {
	if (!className || typeof className !== "string" || className.trim() === "") {
		return undefined;
	}
	const resolved = useStyle(className, overrides);
	const style = resolved.style as Record<string, unknown> | undefined;
	const accent =
		(style?.accentColor as string | undefined) ??
		(style?.color as string | undefined) ??
		(style?.tintColor as string | undefined);

	if (
		typeof process !== "undefined" &&
		process.env?.NODE_ENV !== "production" &&
		!accent &&
		!warnedAccent
	) {
		warnedAccent = true;
		console.warn(
			`NitroWind: className '${className}' was provided to extract accentColor but no color was found. Make sure the className includes a color utility (e.g., 'accent-red-500', 'accent-blue-600'). See https://docs.uniwind.dev/class-names#the-accent-prefix`,
		);
	}
	return accent;
}

export function resolveAccentColorFromStyle(styleObj: unknown): string | undefined {
	if (!styleObj || typeof styleObj !== "object") return undefined;
	const s = styleObj as Record<string, unknown>;
	return (
		(s.accentColor as string | undefined) ??
		(s.color as string | undefined) ??
		(s.tintColor as string | undefined)
	);
}
