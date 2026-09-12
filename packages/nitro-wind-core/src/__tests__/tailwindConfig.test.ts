import { afterEach, describe, expect, test } from "bun:test";
import { classNameContextNeeds } from "../contextNeeds";
import { parseClassName } from "../parser";
import { flattenTailwindTheme, parseLength } from "../tailwindConfig";
import { applyThemeTokens, resetThemeTokens } from "../theme";
import { DEFAULT_STYLE_CONTEXT } from "../types";

afterEach(() => {
	resetThemeTokens();
});

describe("parseLength", () => {
	test("converts rem, px, and raw numbers", () => {
		expect(parseLength("4.5rem")).toBe(72);
		expect(parseLength("18px")).toBe(18);
		expect(parseLength(24)).toBe(24);
		expect(parseLength("32")).toBe(32);
	});
});

describe("flattenTailwindTheme", () => {
	test("flattens nested extend.colors including DEFAULT", () => {
		const tokens = flattenTailwindTheme({
			theme: {
				extend: {
					colors: {
						brand: {
							DEFAULT: "#4F46E5",
							500: "#4F46E5",
							600: "#4338CA",
						},
						primary: "#22c55e",
					},
				},
			},
		});
		expect(tokens.colors?.brand).toBe("#4F46E5");
		expect(tokens.colors?.["brand-500"]).toBe("#4F46E5");
		expect(tokens.colors?.["brand-600"]).toBe("#4338CA");
		expect(tokens.colors?.primary).toBe("#22c55e");
		expect(tokens.replaceColors).toBe(false);
	});

	test("resolves function-form colors from the default palette", () => {
		const tokens = flattenTailwindTheme({
			theme: {
				extend: {
					colors: ({ colors }: { colors: Record<string, unknown> }) => ({
						brand: colors.indigo,
					}),
				},
			},
		});
		expect(tokens.colors?.["brand-600"]).toBe("#4f46e5");
	});

	test("flattens spacing, radius, fontSize, and screens", () => {
		const tokens = flattenTailwindTheme({
			theme: {
				extend: {
					spacing: { 18: "4.5rem" },
					borderRadius: { "4xl": "2rem" },
					fontSize: { xxs: ["10px", { lineHeight: "14px" }] },
					screens: { xs: "400px" },
				},
			},
		});
		expect(tokens.spacing?.["18"]).toBe(72);
		expect(tokens.radius?.["4xl"]).toBe(32);
		expect(tokens.fontSize?.xxs).toBe(10);
		expect(tokens.breakpoints?.xs).toBe(400);
	});

	test("theme.colors without extend replaces the built-in palette", () => {
		const tokens = flattenTailwindTheme({
			theme: {
				colors: { brand: "#4F46E5" },
			},
		});
		expect(tokens.replaceColors).toBe(true);
		expect(tokens.colors?.brand).toBe("#4F46E5");
	});
});

describe("applyThemeTokens", () => {
	test("makes bg-brand-500 and bg-primary resolve", () => {
		applyThemeTokens(
			flattenTailwindTheme({
				theme: {
					extend: {
						colors: {
							brand: { 500: "#4F46E5" },
							primary: "#16a34a",
						},
					},
				},
			}),
		);
		expect(parseClassName("bg-brand-500", DEFAULT_STYLE_CONTEXT)).toEqual({
			backgroundColor: "#4F46E5",
		});
		expect(parseClassName("text-primary", DEFAULT_STYLE_CONTEXT)).toEqual({
			color: "#16a34a",
		});
		expect(parseClassName("bg-red-500", DEFAULT_STYLE_CONTEXT)).toEqual({
			backgroundColor: "#ef4444",
		});
	});

	test("extends spacing, radius, type, and custom screens", () => {
		applyThemeTokens(
			flattenTailwindTheme({
				theme: {
					extend: {
						spacing: { 18: "4.5rem" },
						borderRadius: { "4xl": "2rem" },
						fontSize: { xxs: "10px" },
						screens: { xs: "400px" },
					},
				},
			}),
		);
		expect(parseClassName("p-18", DEFAULT_STYLE_CONTEXT)).toEqual({ padding: 72 });
		expect(parseClassName("rounded-4xl", DEFAULT_STYLE_CONTEXT)).toEqual({
			borderRadius: 32,
		});
		expect(parseClassName("text-xxs", DEFAULT_STYLE_CONTEXT)).toEqual({ fontSize: 10 });
		const below = parseClassName("xs:p-4", { ...DEFAULT_STYLE_CONTEXT, width: 390 });
		expect(below.padding).toBeUndefined();
		const above = parseClassName("xs:p-4", { ...DEFAULT_STYLE_CONTEXT, width: 420 });
		expect(above.padding).toBe(16);
		expect(classNameContextNeeds("xs:p-4").layout).toBe(true);
	});

	test("theme.colors replaces built-in palettes", () => {
		applyThemeTokens(
			flattenTailwindTheme({
				theme: {
					colors: { brand: "#111111" },
				},
			}),
		);
		expect(parseClassName("bg-brand", DEFAULT_STYLE_CONTEXT)).toEqual({
			backgroundColor: "#111111",
		});
		expect(parseClassName("bg-red-500", DEFAULT_STYLE_CONTEXT)).toEqual({});
	});
});
