import { afterEach, describe, expect, test } from "bun:test";
import { parseClassName, resetThemeTokens } from "nitro-wind-core";
import { DEFAULT_STYLE_CONTEXT } from "nitro-wind-core";
import {
	applyThemeTokens,
	loadTailwindConfig,
	loadTailwindCss,
	serializeThemePayload,
} from "../themeConfig";

afterEach(() => {
	resetThemeTokens();
});

describe("loadTailwindConfig", () => {
	test("registers theme.extend.colors as utilities", () => {
		loadTailwindConfig({
			theme: {
				extend: {
					colors: {
						brand: { 500: "#4F46E5", DEFAULT: "#4F46E5" },
					},
				},
			},
		});
		expect(parseClassName("bg-brand-500", DEFAULT_STYLE_CONTEXT)).toEqual({
			backgroundColor: "#4F46E5",
		});
		expect(parseClassName("bg-brand", DEFAULT_STYLE_CONTEXT)).toEqual({
			backgroundColor: "#4F46E5",
		});
	});

	test("serializeThemePayload writes RESET and color rows", () => {
		const payload = serializeThemePayload(
			{
				colors: { "brand-500": "#4F46E5" },
				spacing: { "18": 72 },
				replaceColors: false,
			},
			true,
		);
		expect(payload).toContain("RESET");
		expect(payload).toContain("C\tbrand-500\t#4F46E5");
		expect(payload).toContain("S\t18\t72");
	});

	test("loadTailwindCss registers v4 @theme utilities", () => {
		loadTailwindCss(`
      @theme {
        --color-mint-500: #4ade80;
        --spacing-18: 4.5rem;
      }
    `);
		expect(parseClassName("bg-mint-500", DEFAULT_STYLE_CONTEXT)).toEqual({
			backgroundColor: "#4ade80",
		});
		expect(parseClassName("p-18", DEFAULT_STYLE_CONTEXT)).toEqual({ padding: 72 });
	});

	test("applyThemeTokens is idempotent for the same tokens", () => {
		const tokens = {
			colors: { primary: "#16a34a" },
		};
		applyThemeTokens(tokens, true);
		applyThemeTokens(tokens, true);
		expect(parseClassName("text-primary", DEFAULT_STYLE_CONTEXT)).toEqual({
			color: "#16a34a",
		});
	});
});
