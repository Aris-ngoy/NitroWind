import { type StyleContext, type StyleRecord, contextBitmask } from "./types";

function fnv1a(input: string): number {
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

export function cacheKey(className: string, context: StyleContext, themeName: string): string {
	return `${fnv1a(className).toString(16)}:${themeName}:${contextBitmask(context).toString(16)}`;
}

export class StyleCache {
	private readonly maxSize: number;
	private readonly map = new Map<string, StyleRecord>();

	constructor(maxSize = 2048) {
		this.maxSize = maxSize;
	}

	get(key: string): StyleRecord | undefined {
		const value = this.map.get(key);
		if (value === undefined) return undefined;
		this.map.delete(key);
		this.map.set(key, value);
		return value;
	}

	set(key: string, value: StyleRecord): void {
		if (this.map.has(key)) this.map.delete(key);
		this.map.set(key, value);
		if (this.map.size > this.maxSize) {
			const oldest = this.map.keys().next().value;
			if (oldest !== undefined) this.map.delete(oldest);
		}
	}

	clear(): void {
		this.map.clear();
	}

	get size(): number {
		return this.map.size;
	}
}
