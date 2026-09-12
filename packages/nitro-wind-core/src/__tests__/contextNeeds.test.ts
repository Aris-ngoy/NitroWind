import { describe, expect, test } from "bun:test";
import {
	classNameContextNeeds,
	classNameIsAotCompilable,
	classNameIsContextFree,
	classNameIsPlatformOnlyVariant,
} from "../contextNeeds";

describe("classNameContextNeeds", () => {
	test("static utilities need no StyleContext", () => {
		expect(classNameIsContextFree("p-4 bg-red-500 flex-1 items-center")).toBe(true);
		expect(classNameContextNeeds("p-4").layout).toBe(false);
	});

	test("colon inside arbitrary values does not count as a variant", () => {
		expect(classNameIsContextFree("content-['a:b']")).toBe(true);
		expect(classNameIsContextFree("bg-[#ff0055]")).toBe(true);
	});

	test("detects color scheme, platform, layout, interaction, and group", () => {
		expect(classNameContextNeeds("dark:bg-black").colorScheme).toBe(true);
		expect(classNameContextNeeds("ios:p-6").platform).toBe(true);
		expect(classNameContextNeeds("md:p-8").layout).toBe(true);
		expect(classNameContextNeeds("active:bg-red-600").interaction).toBe(true);
		expect(classNameContextNeeds("group-active:text-red-500").group).toBe(true);
		expect(classNameContextNeeds("group p-4").group).toBe(true);
	});

	test("AOT only accepts context-free, non-animated classNames", () => {
		expect(classNameIsAotCompilable("p-4 rounded-xl bg-slate-900")).toBe(true);
		expect(classNameIsAotCompilable("dark:bg-black")).toBe(false);
		expect(classNameIsAotCompilable("md:flex-row")).toBe(false);
		expect(classNameIsAotCompilable("animate-spin")).toBe(false);
		expect(classNameIsAotCompilable("group")).toBe(false);
	});

	test("detects animation utilities without a colon or bare group", () => {
		expect(classNameContextNeeds("animate-spin").animation).toBe(true);
		expect(classNameContextNeeds("transition").animation).toBe(true);
		expect(classNameContextNeeds("transition-colors").animation).toBe(true);
		expect(classNameContextNeeds("uw-entering-fade-in").animation).toBe(true);
		expect(classNameContextNeeds("uw-exiting-fade-out").animation).toBe(true);
		expect(classNameContextNeeds("uw-layout-linear-transition").animation).toBe(true);
		expect(classNameContextNeeds("nw-entering-slide-in-left").animation).toBe(true);
		expect(classNameContextNeeds("nw-exiting-slide-out-right").animation).toBe(true);
		expect(classNameContextNeeds("nw-layout-jumping-transition").animation).toBe(true);
		expect(classNameContextNeeds("p-4 bg-red-500").animation).toBe(false);
		expect(classNameIsContextFree("animate-spin")).toBe(false);
		expect(classNameIsContextFree("uw-entering-fade-in")).toBe(false);
		expect(classNameIsContextFree("nw-layout-linear-transition")).toBe(false);
	});

	test("duration-*/ease-* alone do not require the interactive render shape", () => {
		// They only matter paired with an animate-*/transition utility that
		// actually reads durationMs/easing (see reanimated.ts's useAnimatedClassName,
		// which returns baseStyle unchanged when there is no animation name and no
		// transition, regardless of durationMs/easing) — so, unlike animate-*/
		// transition, they alone should not force a className onto the interactive
		// runtime path or out of AOT eligibility.
		expect(classNameContextNeeds("duration-300").animation).toBe(false);
		expect(classNameContextNeeds("ease-in").animation).toBe(false);
		expect(classNameIsAotCompilable("duration-300")).toBe(true);
	});

	test("a custom theme-name variant needs color scheme and is not AOT-eligible", () => {
		expect(classNameContextNeeds("premium:bg-indigo-950").colorScheme).toBe(true);
		expect(classNameIsContextFree("premium:bg-indigo-950")).toBe(false);
		expect(classNameIsAotCompilable("premium:bg-indigo-950")).toBe(false);
		expect(classNameIsAotCompilable("foo:p-4")).toBe(false);
	});

	test("platform-only-variant is true for one or more platform variants and nothing else dynamic", () => {
		expect(classNameIsPlatformOnlyVariant("ios:p-6")).toBe(true);
		expect(classNameIsPlatformOnlyVariant("ios:p-6 android:p-4")).toBe(true);
		expect(classNameIsPlatformOnlyVariant("p-2 ios:p-6 web:p-8")).toBe(true);
	});

	test("platform-only-variant is false for a variant-free className (that's classNameIsAotCompilable's job)", () => {
		expect(classNameIsPlatformOnlyVariant("p-4 bg-red-500")).toBe(false);
		expect(classNameIsPlatformOnlyVariant("")).toBe(false);
	});

	test("platform-only-variant is false when any other axis is mixed in", () => {
		expect(classNameIsPlatformOnlyVariant("dark:ios:p-6")).toBe(false);
		expect(classNameIsPlatformOnlyVariant("ios:p-6 md:p-8")).toBe(false);
		expect(classNameIsPlatformOnlyVariant("ios:p-6 active:opacity-50")).toBe(false);
		expect(classNameIsPlatformOnlyVariant("ios:p-6 group-active:text-red-500")).toBe(false);
		expect(classNameIsPlatformOnlyVariant("ios:p-6 animate-spin")).toBe(false);
	});
});
