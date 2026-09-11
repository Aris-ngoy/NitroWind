/**
 * The single source of truth for className+context -> StyleResult parity
 * between the JS engine (this package's JsStyleEngine, exercised directly by
 * parity.test.ts below) and the C++ engine (nitrowind::engine::Engine,
 * exercised by packages/nitro-wind/cpp/tests/test_engine.cpp).
 *
 * Before this file, the two suites hand-typed the same expected values
 * independently, in files that never saw each other, and nothing compared
 * them. This file is read by both: directly, as a TS module, by
 * parity.test.ts; and by packages/nitro-wind/scripts/gen-cpp-fixtures.ts,
 * which emits packages/nitro-wind/cpp/tests/fixtures.generated.hpp for
 * test_engine.cpp to `#include` and iterate. The two engines cannot literally
 * share this file (one runs under bun, the other is compiled by clang++), so
 * generation from one TS source is the mechanism that keeps them from
 * drifting apart the way the hand-typed originals had already started to.
 *
 * `style` is checked as a SUBSET of the resolved style — list only the
 * properties this fixture is actually verifying, not every property a
 * complex utility happens to also set (see "shadow-md", which also sets
 * shadowColor/shadowOpacity/shadowRadius that no fixture needs to pin down).
 *
 * After editing this file, run `bun run gen:cpp-fixtures` in
 * packages/nitro-wind to refresh fixtures.generated.hpp (packages/nitro-wind's
 * own test:cpp script also does this before compiling, so a stale checked-in
 * copy cannot cause a false pass or fail there — but a stale copy would still
 * look wrong in a diff, so regenerate before committing).
 */

export interface ParityContext {
	colorScheme?: "light" | "dark";
	platform?: "ios" | "android" | "web";
	width?: number;
	height?: number;
	isRTL?: boolean;
	pressed?: boolean;
	hovered?: boolean;
	focused?: boolean;
	disabled?: boolean;
	groupActive?: boolean;
	groupFocus?: boolean;
	groupHover?: boolean;
}

export interface ParityAnimation {
	name?: "none" | "spin" | "ping" | "pulse" | "bounce" | null;
	durationMs?: number;
	easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
	transition?: boolean;
}

export interface ParityFixture {
	/** Short, human-readable label. Doubles as the generated C++ test's name. */
	description: string;
	className: string;
	/** Merged over each language's own default context when omitted. */
	context?: ParityContext;
	/** Checked as a subset: every listed key must be present with this value. */
	style?: Record<string, number | string>;
	/** Asserts the resolved style has no properties at all — a separate field
	 * from `style` because `style: {}` (no keys to check) would otherwise
	 * silently assert nothing on either side. */
	styleIsEmpty?: boolean;
	/** [width, height], checked against the inflated shadowOffset. */
	shadowOffset?: [number, number];
	/** Ordered [prop, value] pairs, checked against the inflated transform. */
	transform?: Array<[string, number | string]>;
	animation?: ParityAnimation;
}

export const PARITY_FIXTURES: ParityFixture[] = [
	{
		description: "padding and a named color resolve to a flat style",
		className: "p-4 bg-red-500",
		style: { padding: 16, backgroundColor: "#ef4444" },
	},
	{
		description: "shadow-md inflates shadowOffset and sets elevation",
		className: "shadow-md",
		style: { elevation: 4 },
		shadowOffset: [0, 4],
	},
	{
		description: "translate and scale utilities inflate to an ordered transform array",
		className: "translate-x-4 scale-110",
		transform: [
			["translateX", 16],
			["scale", 1.1],
		],
	},
	{
		description: "animation and transition utilities populate AnimationMeta",
		className: "transition-all duration-300 ease-in-out animate-spin",
		animation: { name: "spin", durationMs: 300, easing: "ease-in-out", transition: true },
	},
	{
		description: "dark and ios variants both resolve against a combined context",
		className: "p-2 dark:bg-black ios:p-6",
		context: { colorScheme: "dark", platform: "ios" },
		style: { padding: 24, backgroundColor: "#000000" },
	},
	{
		description: "group-active variant resolves when groupActive is set on context",
		className: "group-active:text-red-500",
		context: { groupActive: true },
		style: { color: "#ef4444" },
	},
	{
		description: "an alpha modifier on a named color resolves to rgba",
		className: "bg-red-500/50",
		style: { backgroundColor: "rgba(239,68,68,0.5)" },
	},
	{
		description: "arbitrary values: unitless number, hex color, and percent",
		className: "p-[20] bg-[#ff0055] w-[50%]",
		style: { padding: 20, backgroundColor: "#ff0055", width: "50%" },
	},
	{
		description: "an unrecognized variant deterministically resolves to no properties",
		className: "foo:p-4",
		styleIsEmpty: true,
	},
];
