import { beforeEach, describe, expect, test } from "bun:test";
import { JsStyleEngine } from "../engine";
import { DEFAULT_STYLE_CONTEXT } from "../types";
import { PARITY_FIXTURES } from "./parity.fixtures";

// Runs the shared fixtures (see parity.fixtures.ts) against the JS engine.
// packages/nitro-wind/cpp/tests/test_engine.cpp runs the exact same fixtures,
// generated from the same source, against the C++ engine.
describe("parity fixtures (JS engine)", () => {
	let engine: JsStyleEngine;

	beforeEach(() => {
		engine = new JsStyleEngine();
	});

	for (const fixture of PARITY_FIXTURES) {
		test(fixture.description, () => {
			const context = { ...DEFAULT_STYLE_CONTEXT, ...fixture.context };
			const result = engine.compute(fixture.className, context);

			if (fixture.style) {
				for (const [key, value] of Object.entries(fixture.style)) {
					expect(result.style[key]).toBe(value);
				}
			}

			if (fixture.styleIsEmpty) {
				expect(Object.keys(result.style)).toEqual([]);
			}

			if (fixture.shadowOffset) {
				const [width, height] = fixture.shadowOffset;
				expect(result.style.shadowOffset).toEqual({ width, height });
			}

			if (fixture.transform) {
				expect(result.style.transform).toEqual(
					fixture.transform.map(([prop, value]) => ({ [prop]: value })),
				);
			}

			if (fixture.animation) {
				const { name, durationMs, easing, transition } = fixture.animation;
				if (name !== undefined) expect(result.animation.name).toBe(name);
				if (durationMs !== undefined) expect(result.animation.durationMs).toBe(durationMs);
				if (easing !== undefined) expect(result.animation.easing).toBe(easing);
				if (transition !== undefined) expect(result.animation.transition).toBe(transition);
			}
		});
	}
});
