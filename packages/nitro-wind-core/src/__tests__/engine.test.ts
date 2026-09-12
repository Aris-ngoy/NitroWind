import { describe, expect, test } from "bun:test";
import { JsStyleEngine } from "../engine";

describe("JsStyleEngine", () => {
	test("computes the documented minimal path", () => {
		const engine = new JsStyleEngine();
		const result = engine.compute("p-4 bg-red-500");
		expect(result.style.padding).toBe(16);
		expect(result.style.backgroundColor).toBe("#ef4444");
	});

	test("caches repeated classNames", () => {
		const engine = new JsStyleEngine();
		engine.compute("flex-1 items-center");
		engine.compute("flex-1 items-center");
		expect(engine.getCacheSize()).toBe(1);
		engine.clearCache();
		expect(engine.getCacheSize()).toBe(0);
	});

	test("returns the same result object on cache hits", () => {
		const engine = new JsStyleEngine();
		const first = engine.compute("p-4 bg-red-500");
		const second = engine.compute("p-4 bg-red-500");
		expect(second).toBe(first);
		expect(second.style).toBe(first.style);
	});

	test("does not reuse results across color schemes", () => {
		const engine = new JsStyleEngine();
		const light = engine.compute("bg-white dark:bg-black", { colorScheme: "light" });
		const dark = engine.compute("bg-white dark:bg-black", { colorScheme: "dark" });
		expect(dark).not.toBe(light);
		expect(light.style.backgroundColor).toBe("#ffffff");
		expect(dark.style.backgroundColor).toBe("#000000");
	});

	test("inflates shadow offsets", () => {
		const engine = new JsStyleEngine();
		const result = engine.compute("shadow-md");
		expect(result.style.shadowOffset).toEqual({ width: 0, height: 4 });
		expect(result.style.elevation).toBe(4);
	});

	test("inflates transforms", () => {
		const engine = new JsStyleEngine();
		const result = engine.compute("translate-x-4 scale-110");
		expect(result.style.transform).toEqual([{ translateX: 16 }, { scale: 1.1 }]);
	});

	test("extracts animation metadata through the engine seam", () => {
		const engine = new JsStyleEngine();
		const result = engine.compute("transition-all duration-300 ease-in-out animate-spin");
		expect(result.animation.name).toBe("spin");
		expect(result.animation.durationMs).toBe(300);
		expect(result.animation.easing).toBe("ease-in-out");
		expect(result.animation.transition).toBe(true);
	});

	test("computeBatch resolves multiple class strings", () => {
		const engine = new JsStyleEngine();
		const [a, b] = engine.computeBatch(["p-4", "text-white"]);
		expect(a?.style.padding).toBe(16);
		expect(b?.style.color).toBe("#ffffff");
	});
});
