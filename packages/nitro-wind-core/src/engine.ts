import { StyleCache, fastCacheKey } from "./cache";
import { inflateStyle } from "./inflate";
import { parseAnimation, parseClassName } from "./parser";
import { onThemeTokensChanged } from "./theme";
import { type AnimationMeta, DEFAULT_STYLE_CONTEXT, type StyleContext } from "./types";

export interface StyleResult {
	style: Record<string, unknown>;
	animation: AnimationMeta;
}

function isEmptyPartial(context: Partial<StyleContext>): boolean {
	for (const key in context) {
		if (context[key as keyof StyleContext] !== undefined) return false;
	}
	return true;
}

function resolveContext(context: Partial<StyleContext>): StyleContext {
	if (isEmptyPartial(context)) return DEFAULT_STYLE_CONTEXT;
	return { ...DEFAULT_STYLE_CONTEXT, ...context };
}

export class JsStyleEngine {
	private readonly cache = new StyleCache<StyleResult, string>();
	private themeName = "default";
	private lastKey: string | undefined;
	private lastResult: StyleResult | undefined;

	constructor() {
		onThemeTokensChanged(() => {
			this.resetHotCache();
		});
	}

	compute(className: string, context: Partial<StyleContext> = DEFAULT_STYLE_CONTEXT): StyleResult {
		const resolved =
			context === DEFAULT_STYLE_CONTEXT ? DEFAULT_STYLE_CONTEXT : resolveContext(context);
		const key = fastCacheKey(className, resolved);
		if (this.lastKey === key && this.lastResult) {
			return this.lastResult;
		}
		const cached = this.cache.get(key);
		if (cached) {
			this.lastKey = key;
			this.lastResult = cached;
			return cached;
		}
		const result: StyleResult = {
			style: inflateStyle(parseClassName(className, resolved)),
			animation: parseAnimation(className),
		};
		this.cache.set(key, result);
		this.lastKey = key;
		this.lastResult = result;
		return result;
	}

	computeBatch(
		classNames: string[],
		context: Partial<StyleContext> = DEFAULT_STYLE_CONTEXT,
	): StyleResult[] {
		return classNames.map((className) => this.compute(className, context));
	}

	setThemeName(name: string): void {
		if (name === this.themeName) return;
		this.themeName = name;
		this.resetHotCache();
	}

	getThemeName(): string {
		return this.themeName;
	}

	clearCache(): void {
		this.cache.clear();
		this.resetHotCache();
	}

	getCacheSize(): number {
		return this.cache.size;
	}

	private resetHotCache(): void {
		this.cache.clear();
		this.lastKey = undefined;
		this.lastResult = undefined;
	}
}

export const jsStyleEngine = new JsStyleEngine();
