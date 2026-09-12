import { type StyleContext, contextBitmask } from "./types";

export function fastCacheKey(className: string, context: StyleContext): string {
	return `${contextBitmask(context)}:${className}`;
}

export class StyleCache<T, K = string> {
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
