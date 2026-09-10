import type { ClassToken } from "./types";

export function tokenize(className: string): ClassToken[] {
	if (!className) return [];
	const parts = className.trim().split(/\s+/);
	const tokens: ClassToken[] = [];
	for (const part of parts) {
		if (!part) continue;
		tokens.push(parseClassToken(part));
	}
	return tokens;
}

export function parseClassToken(raw: string): ClassToken {
	let input = raw;
	let important = false;
	if (input.startsWith("!")) {
		important = true;
		input = input.slice(1);
	}

	const variants: string[] = [];
	let cursor = 0;
	let bracket = 0;
	for (let i = 0; i < input.length; i++) {
		const ch = input[i];
		if (ch === "[") bracket++;
		else if (ch === "]") bracket = Math.max(0, bracket - 1);
		else if (ch === ":" && bracket === 0) {
			variants.push(input.slice(cursor, i));
			cursor = i + 1;
		}
	}

	const utility = input.slice(cursor);
	return { raw, variants, utility, important };
}
