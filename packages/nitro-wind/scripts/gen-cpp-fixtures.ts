#!/usr/bin/env bun
/**
 * Generates packages/nitro-wind/cpp/tests/fixtures.generated.hpp from
 * packages/nitro-wind-core/src/__tests__/parity.fixtures.ts — the single
 * source of truth for className+context -> StyleResult parity between the
 * JS and C++ engines. See that file for why generation, not shared code, is
 * the mechanism: the two engines run under different toolchains (bun vs
 * clang++) and cannot literally import the same module.
 *
 * Run via `bun run gen:cpp-fixtures` (also run automatically by test:cpp
 * before compiling, so the generated header can never be stale when the
 * C++ suite runs — but re-run it after editing parity.fixtures.ts and
 * before committing, so the checked-in copy doesn't look stale in a diff).
 */
// A relative path, not the "nitro-wind-core" package specifier: that package's
// exports field only exposes its "." entry, so a deep import through the
// package specifier is blocked by Node/Bun's exports resolution. This reaches
// the same file directly on disk instead.
import {
	PARITY_FIXTURES,
	type ParityFixture,
} from "../../nitro-wind-core/src/__tests__/parity.fixtures";

const OUTPUT_PATH = new URL("../cpp/tests/fixtures.generated.hpp", import.meta.url).pathname;

const CONTEXT_DEFAULTS = {
	colorScheme: "light",
	platform: "ios",
	width: 390,
	height: 844,
	isRTL: false,
	pressed: false,
	hovered: false,
	focused: false,
	disabled: false,
	groupActive: false,
	groupFocus: false,
	groupHover: false,
} as const;

function cppString(value: string): string {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function cppDouble(value: number): string {
	return Number.isInteger(value) ? `${value}.0` : `${value}`;
}

function cppBool(value: boolean): string {
	return value ? "true" : "false";
}

// Wraps strings in std::string(...): expectEqual is `template<typename T> void
// expectEqual(const T&, const T&, ...)`, so comparing a std::string (from
// asString/std::get<std::string>) against a bare C-string literal would fail
// to compile — T can't be deduced consistently across the two argument types.
function cppValue(value: number | string): string {
	return typeof value === "number" ? cppDouble(value) : `std::string(${cppString(value)})`;
}

function assertGetter(value: number | string): "asNumber" | "asString" {
	return typeof value === "number" ? "asNumber" : "asString";
}

function literalFor(value: unknown): string {
	if (typeof value === "boolean") return cppBool(value);
	if (typeof value === "number") return cppDouble(value);
	return cppString(String(value));
}

function emitContext(fixture: ParityFixture, varName: string): string {
	const overrides = fixture.context ?? {};
	const lines: string[] = [`  EngineContext ${varName};`];
	for (const [key, defaultValue] of Object.entries(CONTEXT_DEFAULTS)) {
		if (!(key in overrides)) continue;
		const value = (overrides as Record<string, unknown>)[key];
		if (value === defaultValue) continue;
		lines.push(`  ${varName}.${key} = ${literalFor(value)};`);
	}
	return lines.join("\n");
}

function emitFixture(fixture: ParityFixture, index: number): string {
	const ctxVar = `ctx${index}`;
	const resultVar = `result${index}`;
	const lines: string[] = ["  {", emitContext(fixture, ctxVar)];
	lines.push(
		`  const auto ${resultVar} = engine.compute(${cppString(fixture.className)}, ${ctxVar});`,
	);

	for (const [key, value] of Object.entries(fixture.style ?? {})) {
		const getter = assertGetter(value);
		lines.push(
			`  expectEqual(${getter}(${resultVar}, ${cppString(key)}), ${cppValue(value)}, ${cppString(
				`${fixture.description}: ${key}`,
			)});`,
		);
	}

	if (fixture.styleIsEmpty) {
		lines.push(
			`  expectEqual(${resultVar}.style.props.empty(), true, ${cppString(`${fixture.description}: style has no properties`)});`,
		);
	}

	if (fixture.shadowOffset) {
		const [width, height] = fixture.shadowOffset;
		lines.push(
			`  expectEqual(${resultVar}.style.shadowOffset.has_value(), true, ${cppString(
				`${fixture.description}: has shadowOffset`,
			)});`,
			`  expectEqual((*${resultVar}.style.shadowOffset)[0], ${cppDouble(width)}, ${cppString(
				`${fixture.description}: shadowOffset.width`,
			)});`,
			`  expectEqual((*${resultVar}.style.shadowOffset)[1], ${cppDouble(height)}, ${cppString(
				`${fixture.description}: shadowOffset.height`,
			)});`,
		);
	}

	if (fixture.transform) {
		lines.push(
			`  expectEqual(${resultVar}.style.transform.size(), static_cast<std::size_t>(${fixture.transform.length}), ${cppString(
				`${fixture.description}: transform length`,
			)});`,
		);
		fixture.transform.forEach(([prop, value], i) => {
			const getter = typeof value === "number" ? "std::get<double>" : "std::get<std::string>";
			lines.push(
				`  expectEqual(${resultVar}.style.transform[${i}].first, std::string(${cppString(prop)}), ${cppString(
					`${fixture.description}: transform[${i}].prop`,
				)});`,
				`  expectEqual(${getter}(${resultVar}.style.transform[${i}].second), ${cppValue(value)}, ${cppString(
					`${fixture.description}: transform[${i}].value`,
				)});`,
			);
		});
	}

	if (fixture.animation) {
		const { name, durationMs, easing, transition } = fixture.animation;
		if (name !== undefined) {
			if (name === null) {
				lines.push(
					`  expectEqual(${resultVar}.animation.name.has_value(), false, ${cppString(`${fixture.description}: no animation name`)});`,
				);
			} else {
				lines.push(
					`  expectEqual(${resultVar}.animation.name.has_value(), true, ${cppString(`${fixture.description}: has animation name`)});`,
					`  expectEqual(*${resultVar}.animation.name, std::string(${cppString(name)}), ${cppString(`${fixture.description}: animation name`)});`,
				);
			}
		}
		if (durationMs !== undefined) {
			lines.push(
				`  expectEqual(${resultVar}.animation.durationMs, ${cppDouble(durationMs)}, ${cppString(`${fixture.description}: durationMs`)});`,
			);
		}
		if (easing !== undefined) {
			lines.push(
				`  expectEqual(${resultVar}.animation.easing, std::string(${cppString(easing)}), ${cppString(`${fixture.description}: easing`)});`,
			);
		}
		if (transition !== undefined) {
			lines.push(
				`  expectEqual(${resultVar}.animation.transition, ${cppBool(transition)}, ${cppString(`${fixture.description}: transition`)});`,
			);
		}
	}

	lines.push("  }");
	return lines.join("\n");
}

function generate(): string {
	const body = PARITY_FIXTURES.map((fixture, index) => emitFixture(fixture, index)).join("\n\n");
	return `// GENERATED FILE — do not edit by hand.
// Source: packages/nitro-wind-core/src/__tests__/parity.fixtures.ts
// Generator: packages/nitro-wind/scripts/gen-cpp-fixtures.ts
// Regenerate with: bun run gen:cpp-fixtures (from packages/nitro-wind)
#pragma once

// Included into test_engine.cpp after expectEqual/asNumber/asString/Engine/
// EngineContext are already defined there — this header relies on all of
// them being in scope as ordinary file-scope symbols in the same
// translation unit, matching this project's existing single-TU test style.
inline void runParityFixtures(nitrowind::engine::Engine& engine) {
${body}
}
`;
}

await Bun.write(OUTPUT_PATH, generate());
console.log(`wrote ${OUTPUT_PATH} (${PARITY_FIXTURES.length} fixtures)`);
