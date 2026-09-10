import { describe, expect, test } from "bun:test";
import { parseAnimation, parseClassName, resolveUtility } from "../parser";
import { DEFAULT_STYLE_CONTEXT } from "../types";

describe("resolveUtility", () => {
	test("computes padding and background for the minimal path", () => {
		expect(resolveUtility("p-4")).toEqual({ padding: 16 });
		expect(resolveUtility("bg-red-500")).toEqual({ backgroundColor: "#ef4444" });
	});

	test("resolves flex, layout, and typography", () => {
		expect(resolveUtility("flex-1")).toEqual({ flex: 1 });
		expect(resolveUtility("items-center")).toEqual({ alignItems: "center" });
		expect(resolveUtility("text-xl")).toEqual({ fontSize: 20 });
		expect(resolveUtility("font-bold")).toEqual({ fontWeight: "700" });
	});

	test("supports arbitrary values", () => {
		expect(resolveUtility("p-[20]")).toEqual({ padding: 20 });
		expect(resolveUtility("bg-[#ff0055]")).toEqual({ backgroundColor: "#ff0055" });
		expect(resolveUtility("w-[50%]")).toEqual({ width: "50%" });
	});

	test("applies color alpha modifiers", () => {
		expect(resolveUtility("bg-red-500/50")).toEqual({
			backgroundColor: "rgba(239,68,68,0.5)",
		});
	});
});

describe("parseClassName", () => {
	test("later utilities override earlier ones", () => {
		const style = parseClassName("p-2 p-4 bg-red-500 bg-blue-600", DEFAULT_STYLE_CONTEXT);
		expect(style.padding).toBe(16);
		expect(style.backgroundColor).toBe("#2563eb");
	});

	test("applies dark and platform variants from context", () => {
		const light = parseClassName("bg-white dark:bg-black ios:p-6", {
			...DEFAULT_STYLE_CONTEXT,
			colorScheme: "light",
			platform: "android",
		});
		expect(light.backgroundColor).toBe("#ffffff");
		expect(light.padding).toBeUndefined();

		const darkIos = parseClassName("bg-white dark:bg-black ios:p-6", {
			...DEFAULT_STYLE_CONTEXT,
			colorScheme: "dark",
			platform: "ios",
		});
		expect(darkIos.backgroundColor).toBe("#000000");
		expect(darkIos.padding).toBe(24);
	});

	test("applies group-active and group-focus variants", () => {
		const idle = parseClassName("text-white group-active:text-red-500 group-focus:text-blue-500", {
			...DEFAULT_STYLE_CONTEXT,
			groupActive: false,
			groupFocus: false,
		});
		expect(idle.color).toBe("#ffffff");

		const active = parseClassName("text-white group-active:text-red-500", {
			...DEFAULT_STYLE_CONTEXT,
			groupActive: true,
		});
		expect(active.color).toBe("#ef4444");
	});

	test("uses width for breakpoint variants", () => {
		const compact = parseClassName("p-2 md:p-8", { ...DEFAULT_STYLE_CONTEXT, width: 390 });
		expect(compact.padding).toBe(8);
		const wide = parseClassName("p-2 md:p-8", { ...DEFAULT_STYLE_CONTEXT, width: 800 });
		expect(wide.padding).toBe(32);
	});
});

describe("parseAnimation", () => {
	test("extracts reanimated-oriented animation utilities", () => {
		const meta = parseAnimation("transition-all duration-300 ease-in-out animate-spin");
		expect(meta.name).toBe("spin");
		expect(meta.durationMs).toBe(300);
		expect(meta.easing).toBe("ease-in-out");
		expect(meta.transition).toBe(true);
	});
});
