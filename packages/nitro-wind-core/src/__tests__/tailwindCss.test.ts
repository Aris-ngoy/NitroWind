import { afterEach, describe, expect, test } from "bun:test";
import { parseClassName } from "../parser";
import { flattenTailwindCss, flattenTailwindSources, normalizeThemeColor } from "../tailwindCss";
import { applyThemeTokens, resetThemeTokens } from "../theme";
import { DEFAULT_STYLE_CONTEXT } from "../types";

afterEach(() => {
	resetThemeTokens();
});

describe("flattenTailwindCss", () => {
	test("maps @theme color, spacing, radius, text, and breakpoint namespaces", () => {
		const tokens = flattenTailwindCss(`
      @import "tailwindcss";
      @theme {
        --color-brand-500: #4F46E5;
        --color-primary: #16a34a;
        --spacing-18: 4.5rem;
        --radius-4xl: 2rem;
        --text-xxs: 10px;
        --text-xxs--line-height: 14px;
        --breakpoint-xs: 400px;
      }
    `);
		expect(tokens.colors?.["brand-500"]).toBe("#4F46E5");
		expect(tokens.colors?.primary).toBe("#16a34a");
		expect(tokens.spacing?.["18"]).toBe(72);
		expect(tokens.radius?.["4xl"]).toBe(32);
		expect(tokens.fontSize?.xxs).toBe(10);
		expect(tokens.fontSize?.["xxs--line-height"]).toBeUndefined();
		expect(tokens.breakpoints?.xs).toBe(400);
	});

	test("converts oklch theme colors for React Native", () => {
		const tokens = flattenTailwindCss(`
      @theme {
        --color-mint-500: oklch(0.72 0.11 178);
      }
    `);
		expect(tokens.colors?.["mint-500"]).toMatch(/^#[0-9a-f]{6}$/i);
	});

	test("treats --color-*: initial as a palette replace", () => {
		const tokens = flattenTailwindCss(`
      @theme {
        --color-*: initial;
        --color-brand: #111111;
      }
    `);
		expect(tokens.replaceColors).toBe(true);
		expect(tokens.colors?.brand).toBe("#111111");
	});

	test("reads @theme inline and stacked theme blocks", () => {
		const tokens = flattenTailwindCss(`
      @theme inline {
        --color-brand: #4F46E5;
      }
      @theme {
        --spacing-18: 4.5rem;
      }
    `);
		expect(tokens.colors?.brand).toBe("#4F46E5");
		expect(tokens.spacing?.["18"]).toBe(72);
	});
});

describe("normalizeThemeColor", () => {
	test("keeps hex and rgb, converts hsl", () => {
		expect(normalizeThemeColor("#4F46E5")).toBe("#4F46E5");
		expect(normalizeThemeColor("rgb(79, 70, 229)")).toBe("rgb(79,70,229)");
		expect(normalizeThemeColor("hsl(250, 80%, 50%)")).toMatch(/^#/i);
	});
});

describe("flattenTailwindSources", () => {
	test("merges v4 CSS tokens with a v3 JS config", () => {
		const tokens = flattenTailwindSources({
			css: "@theme { --color-brand: #4F46E5; }",
			config: { theme: { extend: { colors: { primary: "#16a34a" } } } },
		});
		expect(tokens.colors?.brand).toBe("#4F46E5");
		expect(tokens.colors?.primary).toBe("#16a34a");
	});
});

describe("apply @theme tokens", () => {
	test("bg-mint-500 and p-18 resolve after registering CSS theme", () => {
		applyThemeTokens(
			flattenTailwindCss(`
        @theme {
          --color-mint-500: #4ade80;
          --spacing-18: 4.5rem;
        }
      `),
		);
		expect(parseClassName("bg-mint-500", DEFAULT_STYLE_CONTEXT)).toEqual({
			backgroundColor: "#4ade80",
		});
		expect(parseClassName("p-18", DEFAULT_STYLE_CONTEXT)).toEqual({ padding: 72 });
	});
});
