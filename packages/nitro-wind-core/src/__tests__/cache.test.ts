import { describe, expect, test } from "bun:test";
import { cacheKey, fnv1a64 } from "../cache";
import { DEFAULT_STYLE_CONTEXT } from "../types";

describe("cacheKey", () => {
	test("returns a 64-bit bigint", () => {
		const key = cacheKey("p-4 bg-red-500", DEFAULT_STYLE_CONTEXT);
		expect(typeof key).toBe("bigint");
		expect(key).toBe(key & 0xffffffffffffffffn);
	});

	test("is stable for the same className and context", () => {
		expect(cacheKey("flex-1 items-center", DEFAULT_STYLE_CONTEXT)).toBe(
			cacheKey("flex-1 items-center", DEFAULT_STYLE_CONTEXT),
		);
	});

	test("changes when the context bitmask changes", () => {
		const light = cacheKey("bg-white dark:bg-black", {
			...DEFAULT_STYLE_CONTEXT,
			colorScheme: "light",
		});
		const dark = cacheKey("bg-white dark:bg-black", {
			...DEFAULT_STYLE_CONTEXT,
			colorScheme: "dark",
		});
		expect(dark).not.toBe(light);
	});

	test("fnv1a64 uses the FNV-1a 64-bit offset and is ASCII-stable", () => {
		expect(fnv1a64("")).toBe(14695981039346656037n);
		expect(fnv1a64("p-4")).not.toBe(fnv1a64("p-8"));
	});
});
