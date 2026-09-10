import { describe, expect, test } from "bun:test";
import {
	classNameContextNeeds,
	classNameIsAotCompilable,
	classNameIsContextFree,
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
});
