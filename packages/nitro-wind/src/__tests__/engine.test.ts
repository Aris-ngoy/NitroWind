import { beforeEach, describe, expect, test } from "bun:test";
import {
	clearEngineCache,
	computeStaticStyle,
	computeStaticStyleForPlatform,
	computeStyle,
} from "../engine";

const ROW = "flex-row items-center px-4 py-3 border-b border-slate-800 bg-slate-900";

describe("computeStyle", () => {
	beforeEach(() => {
		clearEngineCache();
	});

	test("resolves a className into a style object", () => {
		const result = computeStyle("p-4 bg-red-500");
		expect(result.style.padding).toBe(16);
		expect(result.style.backgroundColor).toBe("#ef4444");
		expect(result.native).toBe(false);
	});

	test("returns the same object on repeated one-argument calls", () => {
		const first = computeStyle(ROW);
		const second = computeStyle(ROW);
		const third = computeStyle(ROW);
		expect(second).toBe(first);
		expect(third).toBe(first);
		expect(second.style).toBe(first.style);
	});

	test("does not reuse results across color schemes", () => {
		const light = computeStyle("bg-white dark:bg-black", { colorScheme: "light" });
		const dark = computeStyle("bg-white dark:bg-black", { colorScheme: "dark" });
		expect(dark).not.toBe(light);
		expect(light.style.backgroundColor).toBe("#ffffff");
		expect(dark.style.backgroundColor).toBe("#000000");
	});

	test("reuses results when the same context object is passed", () => {
		const context = { colorScheme: "dark" as const };
		const first = computeStyle("p-4", context);
		const second = computeStyle("p-4", context);
		expect(second).toBe(first);
	});

	test("rotating classNames with a stable context stay interned", () => {
		const context = { colorScheme: "light" as const };
		const a = computeStyle("p-4", context);
		const b = computeStyle("m-2", context);
		const a2 = computeStyle("p-4", context);
		const b2 = computeStyle("m-2", context);
		expect(a2).toBe(a);
		expect(b2).toBe(b);
		expect(a).not.toBe(b);
	});

	test("returns inflated styles and animation without a flat map", () => {
		const result = computeStyle("shadow-md animate-spin duration-300");
		expect(result.style.shadowOffset).toEqual({ width: 0, height: 4 });
		expect(result.animation.name).toBe("spin");
		expect(result.animation.durationMs).toBe(300);
		expect("flat" in result).toBe(false);
	});
});

describe("computeStaticStyle", () => {
	test("returns the inflated style dictionary for AOT hoisting", () => {
		const style = computeStaticStyle("p-4 bg-red-500");
		expect(style.padding).toBe(16);
		expect(style.backgroundColor).toBe("#ef4444");
	});
});

describe("computeStaticStyleForPlatform", () => {
	test("resolves platform variants against the given platform, not the default", () => {
		// DEFAULT_STYLE_CONTEXT.platform is "ios" -- computeStaticStyle alone
		// would resolve this className as if targeting ios regardless of what
		// the build actually targets. This is what lets the Babel plugin bake
		// in the real target instead.
		const ios = computeStaticStyleForPlatform("p-2 ios:p-6 android:p-4", "ios");
		const android = computeStaticStyleForPlatform("p-2 ios:p-6 android:p-4", "android");
		const web = computeStaticStyleForPlatform("p-2 ios:p-6 android:p-4", "web");
		expect(ios.padding).toBe(24);
		expect(android.padding).toBe(16);
		expect(web.padding).toBe(8);
	});

	test("other context fields stay at their defaults", () => {
		const style = computeStaticStyleForPlatform("android:bg-black dark:bg-white", "android");
		// dark:bg-white should not apply -- DEFAULT_STYLE_CONTEXT.colorScheme is
		// "light", and this function only overrides platform.
		expect(style.backgroundColor).toBe("#000000");
	});
});
