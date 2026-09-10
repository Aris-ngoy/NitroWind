import { type StyleContext, contextBitmask } from "./types";

const FNV_OFFSET = 14695981039346656037n;
const FNV_PRIME = 1099511628211n;
const MASK64 = 0xffffffffffffffffn;
const GOLDEN = 0x9e3779b97f4a7c15n;

export function fnv1a64(input: string): bigint {
	let hash = FNV_OFFSET;
	for (let i = 0; i < input.length; i++) {
		hash ^= BigInt(input.charCodeAt(i) & 0xff);
		hash = (hash * FNV_PRIME) & MASK64;
	}
	return hash;
}

export function cacheKey(className: string, context: StyleContext): bigint {
	const mask = BigInt(contextBitmask(context) >>> 0);
	return (fnv1a64(className) ^ ((mask * GOLDEN) & MASK64)) & MASK64;
}

export function fastCacheKey(className: string, context: StyleContext): string {
	return `${contextBitmask(context)}:${className}`;
}

export class StyleCache<T, K = string | bigint> {
	private readonly maxSize: number;
	private readonly map = new Map<K, T>();

	constructor(maxSize = 2048) {
		this.maxSize = maxSize;
	}

	get(key: K): T | undefined {
		return this.map.get(key);
	}

	set(key: K, value: T): void {
		if (this.map.size >= this.maxSize && !this.map.has(key)) {
			const oldest = this.map.keys().next().value;
			if (oldest !== undefined) this.map.delete(oldest);
		}
		this.map.set(key, value);
	}

	clear(): void {
		this.map.clear();
	}

	get size(): number {
		return this.map.size;
	}
}
