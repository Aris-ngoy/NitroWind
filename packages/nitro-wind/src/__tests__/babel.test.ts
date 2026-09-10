import { describe, expect, test } from "bun:test";

const plugin = require("../../babel.js") as typeof import("../../babel.js") & {
	isAotCompilableClassName: (className: string) => boolean;
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
