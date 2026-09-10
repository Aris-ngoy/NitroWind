import { describe, expect, test } from "bun:test";
import { parseClassToken, tokenize } from "../tokenizer";

describe("tokenize", () => {
	test("splits on whitespace", () => {
		expect(tokenize("p-4 bg-red-500").map((t) => t.utility)).toEqual(["p-4", "bg-red-500"]);
	});

	test("parses stacked variants and arbitrary values", () => {
		const token = parseClassToken("dark:ios:hover:bg-[#ff0055]");
		expect(token.variants).toEqual(["dark", "ios", "hover"]);
		expect(token.utility).toEqual("bg-[#ff0055]");
	});

	test("keeps colons inside brackets", () => {
		const token = parseClassToken("bg-[hsl(0,100%,50%)]");
		expect(token.variants).toEqual([]);
		expect(token.utility).toEqual("bg-[hsl(0,100%,50%)]");
	});

	test("marks important utilities", () => {
		expect(parseClassToken("!p-4").important).toBe(true);
		expect(parseClassToken("!p-4").utility).toBe("p-4");
	});
});
