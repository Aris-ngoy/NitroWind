import { StyleCache, cacheKey } from "./cache";
import { inflateStyle } from "./inflate";
import { parseAnimation, parseClassName } from "./parser";
import { DEFAULT_STYLE_CONTEXT, type StyleContext, type StyleRecord } from "./types";

export interface ComputeResult {
	flat: StyleRecord;
	style: Record<string, unknown>;
	animation: ReturnType<typeof parseAnimation>;
}

export class JsStyleEngine {
	private readonly cache = new StyleCache();
	private themeName = "default";

	compute(className: string, context: Partial<StyleContext> = {}): ComputeResult {
		const resolved: StyleContext = { ...DEFAULT_STYLE_CONTEXT, ...context };
		const key = cacheKey(className, resolved, this.themeName);
		const cached = this.cache.get(key);
		const flat = cached ?? parseClassName(className, resolved);
		if (!cached) this.cache.set(key, flat);
		return {
			flat,
			style: inflateStyle(flat),
			animation: parseAnimation(className),
		};
	}

	computeBatch(classNames: string[], context: Partial<StyleContext> = {}): ComputeResult[] {
		return classNames.map((className) => this.compute(className, context));
	}

	setThemeName(name: string): void {
		if (name === this.themeName) return;
		this.themeName = name;
		this.cache.clear();
	}

	clearCache(): void {
		this.cache.clear();
	}

	getCacheSize(): number {
		return this.cache.size;
	}
}

export const jsStyleEngine = new JsStyleEngine();
