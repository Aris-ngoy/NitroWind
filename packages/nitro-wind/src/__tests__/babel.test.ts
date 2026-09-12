import { describe, expect, test } from "bun:test";
import { classNameIsAotCompilable, classNameIsPlatformOnlyVariant } from "nitro-wind-core";

const plugin = require("../../babel.js") as typeof import("../../babel.js") & {
	isAotCompilableClassName: (className: string) => boolean;
	platformOnlyVariantEligible: (className: string) => boolean;
};

describe("isAotCompilableClassName", () => {
	test("accepts invariant utilities", () => {
		expect(plugin.isAotCompilableClassName("p-4 bg-red-500 flex-1")).toBe(true);
		expect(plugin.isAotCompilableClassName("bg-[#ff0055]")).toBe(true);
	});

	test("rejects variants, group, and animation", () => {
		expect(plugin.isAotCompilableClassName("dark:bg-black")).toBe(false);
		expect(plugin.isAotCompilableClassName("md:p-8")).toBe(false);
		expect(plugin.isAotCompilableClassName("group p-4")).toBe(false);
		expect(plugin.isAotCompilableClassName("animate-spin")).toBe(false);
	});
});

// The build-time predicate (babel.js) and the runtime predicate
// (nitro-wind-core's classNameIsAotCompilable) are two independent
// implementations that cannot share code across the CJS/build-step divide
// (see the comment on isAotCompilableClassName in babel.js). This is the
// mechanism that keeps them from drifting apart silently: every case here
// must produce the same answer from both, including edge cases neither
// predicate's own unit tests previously covered on its own.
describe("isAotCompilableClassName / classNameIsAotCompilable parity", () => {
	const cases = [
		"",
		"p-4 bg-red-500 flex-1",
		"bg-[#ff0055]",
		"content-['a:b']",
		"w-[50%]",
		"dark:bg-black",
		"light:bg-white",
		"md:flex-row",
		"ios:p-6",
		"android:p-4",
		"rtl:ml-2",
		"ltr:mr-2",
		"active:opacity-80",
		"pressed:opacity-80",
		"hover:bg-slate-800",
		"focus:border-blue-500",
		"disabled:opacity-40",
		"group",
		"group p-4",
		"group-active:text-red-500",
		"group-hover:bg-slate-800",
		"animate-spin",
		"animate-none",
		"transition",
		"transition-all",
		"transition-colors duration-300 ease-in-out",
		"duration-300",
		"ease-in",
		// unrecognized variant — a bare colon that no known variant matches.
		// parseClassName skips any token with an unmatched variant, so this
		// is behaviorally invariant, but neither predicate should reason its
		// way to "safe to hoist" from that coincidence.
		"foo:p-4",
		"unknown-variant:bg-red-500 p-4",
	];

	for (const className of cases) {
		test(`agrees on ${JSON.stringify(className)}`, () => {
			expect(plugin.isAotCompilableClassName(className)).toBe(classNameIsAotCompilable(className));
		});
	}
});

describe("platformOnlyVariantEligible", () => {
	test("accepts one or more platform variants and nothing else dynamic", () => {
		expect(plugin.platformOnlyVariantEligible("ios:p-6")).toBe(true);
		expect(plugin.platformOnlyVariantEligible("ios:p-6 android:p-4")).toBe(true);
		expect(plugin.platformOnlyVariantEligible("p-2 ios:p-6 web:p-8")).toBe(true);
	});

	test("rejects a variant-free className (isAotCompilableClassName's job) and anything mixing in another axis", () => {
		expect(plugin.platformOnlyVariantEligible("p-4 bg-red-500")).toBe(false);
		expect(plugin.platformOnlyVariantEligible("")).toBe(false);
		expect(plugin.platformOnlyVariantEligible("dark:ios:p-6")).toBe(false);
		expect(plugin.platformOnlyVariantEligible("ios:p-6 md:p-8")).toBe(false);
		expect(plugin.platformOnlyVariantEligible("ios:p-6 active:opacity-50")).toBe(false);
		expect(plugin.platformOnlyVariantEligible("ios:p-6 group-active:text-red-500")).toBe(false);
		expect(plugin.platformOnlyVariantEligible("ios:p-6 animate-spin")).toBe(false);
	});
});

// Same parity mechanism as isAotCompilableClassName above, for the other
// build-time-eligible shape this candidate added.
describe("platformOnlyVariantEligible / classNameIsPlatformOnlyVariant parity", () => {
	const cases = [
		"",
		"p-4 bg-red-500 flex-1",
		"ios:p-6",
		"android:p-4",
		"web:p-8",
		"ios:p-6 android:p-4",
		"p-2 ios:p-6 web:p-8",
		"dark:ios:p-6",
		"ios:p-6 md:p-8",
		"ios:p-6 active:opacity-50",
		"ios:p-6 group-active:text-red-500",
		"ios:p-6 group",
		"ios:p-6 animate-spin",
		"ios:p-6 transition-all",
		"foo:p-4",
		"ios:bg-[#ff0055]",
	];

	for (const className of cases) {
		test(`agrees on ${JSON.stringify(className)}`, () => {
			expect(plugin.platformOnlyVariantEligible(className)).toBe(
				classNameIsPlatformOnlyVariant(className),
			);
		});
	}
});

describe("nitro-wind babel plugin", () => {
	test("remaps RN hosts and hoists static classNames", async () => {
		const babel = await import("@babel/core");
		const jsx = await import("@babel/plugin-syntax-jsx");
		const result = babel.transformSync(
			`import { View, Text, StyleSheet } from "react-native";
export const Screen = () => (
  <View className="flex-1 items-center" style={{ opacity: 1 }}>
    <Text className="text-white font-bold">Hello</Text>
    <View className="dark:bg-black p-4" />
  </View>
);
`,
			{
				plugins: [jsx.default, plugin],
				filename: "fixture.tsx",
				configFile: false,
				babelrc: false,
			},
		);
		expect(result?.code).toContain('from "nitro-wind"');
		expect(result?.code).toContain("StyleSheet.create");
		expect(result?.code).toContain("computeStaticStyle");
		expect(result?.code).toContain('computeStaticStyle("flex-1 items-center")');
		expect(result?.code).toContain('computeStaticStyle("text-white font-bold")');
		expect(result?.code).toContain('className="dark:bg-black p-4"');
		expect(result?.code).not.toContain('className="flex-1 items-center"');
	});

	test("does not remap react-native imports inside the nitro-wind package", async () => {
		const babel = await import("@babel/core");
		const jsx = await import("@babel/plugin-syntax-jsx");
		const result = babel.transformSync(
			`import { Pressable, ScrollView, Text, View } from "react-native";
const Screen = () => <View className="flex-1 bg-slate-950" />;
`,
			{
				plugins: [jsx.default, plugin],
				filename: "/repo/packages/nitro-wind/src/showcase.tsx",
				configFile: false,
				babelrc: false,
			},
		);
		expect(result?.code).toContain('from "react-native"');
		expect(result?.code).not.toMatch(/from ["']nitro-wind["']/);
		expect(result?.code).toContain('from "./engine"');
		expect(result?.code).toContain("computeStaticStyle");
		expect(result?.code).toContain('computeStaticStyle("flex-1 bg-slate-950")');
	});

	test("rewrites static JSX tags imported from nitro-wind to raw react-native primitives", async () => {
		const babel = await import("@babel/core");
		const jsx = await import("@babel/plugin-syntax-jsx");
		const result = babel.transformSync(
			`import { View, Text } from "nitro-wind";
export const Row = () => (
  <View className="flex-row items-center px-4 py-3">
    <Text className="text-white font-bold">Title</Text>
  </View>
);
`,
			{
				plugins: [jsx.default, plugin],
				filename: "Row.tsx",
				configFile: false,
				babelrc: false,
			},
		);
		expect(result?.code).toContain('from "react-native"');
		expect(result?.code).toContain("StyleSheet.create");
		expect(result?.code).toContain("<_RNView");
		expect(result?.code).toContain("</_RNView>");
		expect(result?.code).toContain("<_RNText");
		expect(result?.code).toContain("</_RNText>");
	});

	test("produces distinct AST nodes for each static style invocation and member expression", async () => {
		const babel = await import("@babel/core");
		const jsx = await import("@babel/plugin-syntax-jsx");
		const result = babel.transformSync(
			`import { View, Text } from "react-native";
export const Screen = () => (
  <View className="flex-1 items-center">
    <Text className="text-white font-bold">Hello</Text>
    <Text className="text-slate-400">Subtitle</Text>
    <View className="p-4 bg-red-500" />
  </View>
);
`,
			{
				plugins: [jsx.default, plugin],
				filename: "screen.tsx",
				configFile: false,
				babelrc: false,
				ast: true,
			},
		);

		const callees: unknown[] = [];
		const styleObjects: unknown[] = [];
		if (!result || !result.ast) {
			throw new Error("Expected Babel transform result with AST");
		}
		babel.traverse(result.ast, {
			CallExpression(path) {
				if (
					path.node.callee.type === "Identifier" &&
					path.node.callee.name.includes("computeStaticStyle")
				) {
					callees.push(path.node.callee);
				}
			},
			MemberExpression(path) {
				if (path.node.object.type === "Identifier" && path.node.object.name.includes("nwStyles")) {
					styleObjects.push(path.node.object);
				}
			},
		});

		expect(callees.length).toBe(4);
		// Crucial regression test: callees must NOT share node reference identity!
		// Sharing AST nodes breaks downstream Babel transforms (e.g. CommonJS module transform)
		// causing `Property '_computeStaticStyle' doesn't exist` runtime errors.
		const distinctCallees = new Set(callees);
		expect(distinctCallees.size).toBe(4);

		// style object identifiers must also not share node reference identity
		const distinctStyleObjects = new Set(styleObjects);
		expect(distinctStyleObjects.size).toBe(styleObjects.length);
	});
});

// Step 2 of the candidate-4 design pass (see the approved plan): a
// platform-only-variant className resolves to a single value at transform
// time when Metro reports the target platform via `caller.platform` — see
// babel.js's own comment on how api.caller flows in from there.
describe("nitro-wind babel plugin — platform-only variants", () => {
	test("resolves platform-only variants at transform time when caller.platform is known", async () => {
		const babel = await import("@babel/core");
		const jsx = await import("@babel/plugin-syntax-jsx");
		const result = babel.transformSync(
			`import { View, Text } from "react-native";
export const Row = () => (
  <View className="p-2 ios:p-6 android:p-4">
    <Text className="ios:text-red-500">Hi</Text>
  </View>
);
`,
			{
				plugins: [jsx.default, plugin],
				filename: "fixture.tsx",
				configFile: false,
				babelrc: false,
				caller: { name: "metro", platform: "ios" },
			},
		);
		expect(result?.code).toContain("computeStaticStyleForPlatform");
		expect(result?.code).toContain(
			'computeStaticStyleForPlatform("p-2 ios:p-6 android:p-4", "ios")',
		);
		expect(result?.code).toContain('computeStaticStyleForPlatform("ios:text-red-500", "ios")');
		expect(result?.code).toContain("<_RNView");
		expect(result?.code).toContain("<_RNText");
		// Neither classNames touched here needs the zero-variant resolver.
		expect(result?.code).not.toContain("computeStaticStyle(");
	});

	test("imports both resolvers only when a file mixes zero-variant and platform-only classNames", async () => {
		const babel = await import("@babel/core");
		const jsx = await import("@babel/plugin-syntax-jsx");
		const result = babel.transformSync(
			`import { View, Text } from "react-native";
export const Row = () => (
  <View className="flex-1 items-center">
    <Text className="ios:text-red-500 android:text-blue-500">Hi</Text>
  </View>
);
`,
			{
				plugins: [jsx.default, plugin],
				filename: "fixture.tsx",
				configFile: false,
				babelrc: false,
				caller: { name: "metro", platform: "android" },
			},
		);
		expect(result?.code).toContain('computeStaticStyle("flex-1 items-center")');
		expect(result?.code).toContain(
			'computeStaticStyleForPlatform("ios:text-red-500 android:text-blue-500", "android")',
		);
		expect(result?.code).toContain("computeStaticStyle as");
		expect(result?.code).toContain("computeStaticStyleForPlatform as");
	});

	test("falls back to the runtime path when caller reports no platform", async () => {
		const babel = await import("@babel/core");
		const jsx = await import("@babel/plugin-syntax-jsx");
		const withoutCaller = babel.transformSync(
			`import { View } from "react-native";
export const Row = () => <View className="ios:p-6" />;
`,
			{
				plugins: [jsx.default, plugin],
				filename: "fixture.tsx",
				configFile: false,
				babelrc: false,
			},
		);
		const withCallerNoPlatform = babel.transformSync(
			`import { View } from "react-native";
export const Row = () => <View className="ios:p-6" />;
`,
			{
				plugins: [jsx.default, plugin],
				filename: "fixture.tsx",
				configFile: false,
				babelrc: false,
				caller: { name: "metro" },
			},
		);
		for (const result of [withoutCaller, withCallerNoPlatform]) {
			expect(result?.code).toContain('className="ios:p-6"');
			expect(result?.code).not.toContain("computeStaticStyleForPlatform");
			expect(result?.code).not.toContain("<_RNView");
		}
	});

	test("does not resolve a className mixing a platform variant with any other axis", async () => {
		const babel = await import("@babel/core");
		const jsx = await import("@babel/plugin-syntax-jsx");
		const result = babel.transformSync(
			`import { View } from "react-native";
export const Row = () => <View className="dark:ios:p-6" />;
`,
			{
				plugins: [jsx.default, plugin],
				filename: "fixture.tsx",
				configFile: false,
				babelrc: false,
				caller: { name: "metro", platform: "ios" },
			},
		);
		expect(result?.code).toContain('className="dark:ios:p-6"');
		expect(result?.code).not.toContain("computeStaticStyleForPlatform");
	});
});

describe("nitro-wind babel plugin — tailwind.config.js", () => {
	test("injects a runtime import when a config extends colors", async () => {
		const fs = await import("node:fs");
		const os = await import("node:os");
		const path = await import("node:path");
		const babel = await import("@babel/core");
		const jsx = await import("@babel/plugin-syntax-jsx");
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nw-tw-"));
		const configPath = path.join(dir, "tailwind.config.js");
		fs.writeFileSync(
			configPath,
			`module.exports = { theme: { extend: { colors: { brand: { 500: "#4F46E5" } } } } };\n`,
		);
		const result = babel.transformSync(
			`import { View } from "react-native";
export const Card = () => <View className="bg-brand-500 p-4" />;
`,
			{
				plugins: [jsx.default, [plugin, { config: configPath }]],
				filename: path.join(dir, "Card.tsx"),
				configFile: false,
				babelrc: false,
			},
		);
		expect(result?.code).toContain("runtime.js");
		expect(result?.code).toContain("computeStaticStyle");
		expect(result?.code).toContain('computeStaticStyle("bg-brand-500 p-4")');
	});

	test("injects a runtime import when global.css has @theme", async () => {
		const fs = await import("node:fs");
		const os = await import("node:os");
		const path = await import("node:path");
		const babel = await import("@babel/core");
		const jsx = await import("@babel/plugin-syntax-jsx");
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nw-tw4-"));
		const cssPath = path.join(dir, "global.css");
		fs.writeFileSync(
			cssPath,
			`@import "tailwindcss";\n@theme { --color-mint-500: #4ade80; }\n`,
		);
		const result = babel.transformSync(
			`import { View } from "react-native";
export const Card = () => <View className="bg-mint-500 p-4" />;
`,
			{
				plugins: [jsx.default, [plugin, { css: cssPath }]],
				filename: path.join(dir, "Card.tsx"),
				configFile: false,
				babelrc: false,
			},
		);
		expect(result?.code).toContain("runtime.js");
		const runtimeMatch = result?.code?.match(/import "([^"]+runtime\.js)"/);
		expect(runtimeMatch?.[1]).toBeTruthy();
		const runtime = fs.readFileSync(runtimeMatch?.[1] as string, "utf8");
		expect(runtime).toContain("loadTailwindTheme");
		expect(runtime).toContain("--color-mint-500");
	});
});
