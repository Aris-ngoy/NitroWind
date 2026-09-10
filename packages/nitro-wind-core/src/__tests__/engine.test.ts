import { describe, expect, test } from "bun:test";
import { JsStyleEngine } from "../engine";

describe("JsStyleEngine", () => {
	test("computes the documented minimal path", () => {
		const engine = new JsStyleEngine();
		const result = engine.compute("p-4 bg-red-500");
		expect(result.flat).toEqual({ padding: 16, backgroundColor: "#ef4444" });
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

	test("inflates shadow offsets", () => {
		const engine = new JsStyleEngine();
		const result = engine.compute("shadow-md");
		expect(result.style.shadowOffset).toEqual({ width: 0, height: 4 });
		expect(result.style.elevation).toBe(4);
	});

	test("computeBatch resolves multiple class strings", () => {
		const engine = new JsStyleEngine();
		const [a, b] = engine.computeBatch(["p-4", "text-white"]);
		expect(a?.flat.padding).toBe(16);
		expect(b?.flat.color).toBe("#ffffff");
	});
});
