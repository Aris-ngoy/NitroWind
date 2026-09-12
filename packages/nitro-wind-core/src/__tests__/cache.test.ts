import { describe, expect, test } from "bun:test";
import { StyleCache, fastCacheKey } from "../cache";
import { DEFAULT_STYLE_CONTEXT } from "../types";

describe("fastCacheKey", () => {
	test("is stable for the same className and context", () => {
		expect(fastCacheKey("flex-1 items-center", DEFAULT_STYLE_CONTEXT)).toBe(
			fastCacheKey("flex-1 items-center", DEFAULT_STYLE_CONTEXT),
		);
	});

	test("changes when the context bitmask changes", () => {
		const light = fastCacheKey("bg-white dark:bg-black", {
			...DEFAULT_STYLE_CONTEXT,
			colorScheme: "light",
		});
		const dark = fastCacheKey("bg-white dark:bg-black", {
			...DEFAULT_STYLE_CONTEXT,
			colorScheme: "dark",
		});
		expect(dark).not.toBe(light);
	});

	test("does not collide across a className/bitmask boundary", () => {
		// "1:ab" vs "12:b" -- guards the "${mask}:${className}" format against a
		// prefix ambiguity if a future bitmask ever grew a shared leading digit.
		const a = fastCacheKey("ab", { ...DEFAULT_STYLE_CONTEXT, width: 32 });
		const b = fastCacheKey("b", { ...DEFAULT_STYLE_CONTEXT, width: 384 });
		expect(a).not.toBe(b);
	});
});

describe("StyleCache", () => {
	test("returns undefined for a missing key", () => {
		const cache = new StyleCache<string>();
		expect(cache.get("missing")).toBeUndefined();
	});

	test("get/set/size/clear round-trip", () => {
		const cache = new StyleCache<{ padding: number }>();
		cache.set("a", { padding: 4 });
		cache.set("b", { padding: 8 });
		expect(cache.size).toBe(2);
		expect(cache.get("a")).toEqual({ padding: 4 });
		cache.clear();
		expect(cache.size).toBe(0);
		expect(cache.get("a")).toBeUndefined();
	});

	test("re-setting an existing key updates its value without growing size", () => {
		const cache = new StyleCache<number>();
		cache.set("a", 1);
		cache.set("a", 2);
		expect(cache.size).toBe(1);
		expect(cache.get("a")).toBe(2);
	});

	test("evicts the oldest entry once maxSize is exceeded", () => {
		const cache = new StyleCache<number>(2);
		cache.set("a", 1);
		cache.set("b", 2);
		cache.set("c", 3);
		expect(cache.size).toBe(2);
		expect(cache.get("a")).toBeUndefined();
		expect(cache.get("b")).toBe(2);
		expect(cache.get("c")).toBe(3);
	});

	test("re-setting an existing key at capacity does not evict anything", () => {
		const cache = new StyleCache<number>(2);
		cache.set("a", 1);
		cache.set("b", 2);
		cache.set("a", 10);
		expect(cache.size).toBe(2);
		expect(cache.get("a")).toBe(10);
		expect(cache.get("b")).toBe(2);
	});
});
