const fs = require("fs");
const os = require("os");
const path = require("path");

const CONFIG_NAMES = [
	"tailwind.config.js",
	"tailwind.config.cjs",
	"tailwind.config.mjs",
	"tailwind.config.ts",
];

const CSS_NAMES = [
	"global.css",
	"globals.css",
	"src/global.css",
	"src/globals.css",
	"app/global.css",
	"app/globals.css",
	"styles/global.css",
	"src/styles/global.css",
];

const SKIP_CSS_IMPORTS = new Set(["tailwindcss", "uniwind", "nitro-wind"]);

function parseLength(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	if (trimmed.endsWith("rem")) {
		const n = Number.parseFloat(trimmed);
		return Number.isFinite(n) ? n * 16 : undefined;
	}
	if (trimmed.endsWith("px")) {
		const n = Number.parseFloat(trimmed);
		return Number.isFinite(n) ? n : undefined;
	}
	const n = Number.parseFloat(trimmed);
	return Number.isFinite(n) ? n : undefined;
}

function flattenColors(input, prefix) {
	const keyPrefix = prefix || "";
	if (typeof input === "string") {
		return keyPrefix ? { [keyPrefix]: input } : {};
	}
	if (!input || typeof input !== "object") return {};
	const out = {};
	for (const [key, value] of Object.entries(input)) {
		if (key === "DEFAULT" && typeof value === "string" && keyPrefix) {
			out[keyPrefix] = value;
			continue;
		}
		const next = keyPrefix ? `${keyPrefix}-${key}` : key;
		if (typeof value === "string") {
			out[next] = value;
		} else if (value && typeof value === "object") {
			Object.assign(out, flattenColors(value, next));
		}
	}
	return out;
}

function flattenLengths(input) {
	if (!input || typeof input !== "object") return {};
	const out = {};
	for (const [key, value] of Object.entries(input)) {
		const parsed = parseLength(value);
		if (parsed != null) out[key] = parsed;
	}
	return out;
}

function flattenFontSizes(input) {
	if (!input || typeof input !== "object") return {};
	const out = {};
	for (const [key, value] of Object.entries(input)) {
		const raw = Array.isArray(value) ? value[0] : value;
		const parsed = parseLength(raw);
		if (parsed != null) out[key] = parsed;
	}
	return out;
}

function flattenScreens(input) {
	if (!input || typeof input !== "object") return {};
	const out = {};
	for (const [key, value] of Object.entries(input)) {
		if (typeof value === "string" || typeof value === "number") {
			const parsed = parseLength(value);
			if (parsed != null) out[key] = parsed;
			continue;
		}
		if (value && typeof value === "object" && value.min != null) {
			const parsed = parseLength(value.min);
			if (parsed != null) out[key] = parsed;
		}
	}
	return out;
}

function resolveMaybeFn(value) {
	if (typeof value !== "function") return value;
	try {
		return value({ colors: {}, theme: () => undefined });
	} catch {
		return {};
	}
}

function flattenTailwindTheme(config) {
	const theme = config?.theme || {};
	const extend = theme.extend || {};
	const colors = {};
	if (theme.colors != null) Object.assign(colors, flattenColors(resolveMaybeFn(theme.colors)));
	if (extend.colors != null) Object.assign(colors, flattenColors(resolveMaybeFn(extend.colors)));
	const spacing = {};
	if (theme.spacing != null) Object.assign(spacing, flattenLengths(resolveMaybeFn(theme.spacing)));
	if (extend.spacing != null)
		Object.assign(spacing, flattenLengths(resolveMaybeFn(extend.spacing)));
	const radius = {};
	if (theme.borderRadius != null)
		Object.assign(radius, flattenLengths(resolveMaybeFn(theme.borderRadius)));
	if (extend.borderRadius != null)
		Object.assign(radius, flattenLengths(resolveMaybeFn(extend.borderRadius)));
	const fontSize = {};
	if (theme.fontSize != null)
		Object.assign(fontSize, flattenFontSizes(resolveMaybeFn(theme.fontSize)));
	if (extend.fontSize != null)
		Object.assign(fontSize, flattenFontSizes(resolveMaybeFn(extend.fontSize)));
	const breakpoints = {};
	if (theme.screens != null)
		Object.assign(breakpoints, flattenScreens(resolveMaybeFn(theme.screens)));
	if (extend.screens != null)
		Object.assign(breakpoints, flattenScreens(resolveMaybeFn(extend.screens)));
	return {
		colors,
		spacing,
		radius,
		fontSize,
		breakpoints,
		replaceColors: theme.colors != null,
		replaceSpacing: theme.spacing != null,
		replaceRadius: theme.borderRadius != null,
		replaceFontSize: theme.fontSize != null,
		replaceBreakpoints: theme.screens != null,
	};
}

function shouldLoadConfig(config) {
	const theme = config?.theme;
	if (!theme) return false;
	return !!(
		theme.extend ||
		theme.colors ||
		theme.spacing ||
		theme.borderRadius ||
		theme.fontSize ||
		theme.screens
	);
}

function findTailwindConfig(startDir, explicit) {
	if (explicit) {
		const resolved = path.isAbsolute(explicit)
			? explicit
			: path.resolve(startDir || process.cwd(), explicit);
		return fs.existsSync(resolved) ? resolved : null;
	}
	let dir = startDir || process.cwd();
	while (true) {
		for (const name of CONFIG_NAMES) {
			const candidate = path.join(dir, name);
			if (fs.existsSync(candidate)) return candidate;
		}
		const parent = path.dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

function loadTailwindConfigModule(configPath) {
	try {
		delete require.cache[require.resolve(configPath)];
	} catch {
		// first load
	}
	try {
		const loaded = require(configPath);
		return loaded?.default ? loaded.default : loaded;
	} catch {
		return null;
	}
}

function findCssEntry(startDir, explicit) {
	if (explicit) {
		const resolved = path.isAbsolute(explicit)
			? explicit
			: path.resolve(startDir || process.cwd(), explicit);
		return fs.existsSync(resolved) ? resolved : null;
	}
	let dir = startDir || process.cwd();
	while (true) {
		for (const name of CSS_NAMES) {
			const candidate = path.join(dir, name);
			if (fs.existsSync(candidate)) return candidate;
		}
		const parent = path.dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

function extractAtConfigPath(source) {
	const match = source.replace(/\/\*[\s\S]*?\*\//g, "").match(/@config\s+["']([^"']+)["']/);
	return match ? match[1] : undefined;
}

function extractLocalCssImports(source) {
	const cleaned = source.replace(/\/\*[\s\S]*?\*\//g, "");
	const imports = [];
	const re = /@import\s+(?:url\()?["']([^"']+)["']\)?/g;
	let match = re.exec(cleaned);
	while (match) {
		const spec = match[1] || "";
		const bare = spec.split("?")[0].replace(/^~/, "");
		const pkg = bare.split("/")[0];
		if (!SKIP_CSS_IMPORTS.has(pkg) && (bare.startsWith(".") || bare.endsWith(".css"))) {
			imports.push(bare);
		}
		match = re.exec(cleaned);
	}
	return imports;
}

function readCssWithImports(filePath, seen) {
	const visited = seen || new Set();
	const resolved = path.resolve(filePath);
	if (visited.has(resolved) || !fs.existsSync(resolved)) return "";
	visited.add(resolved);
	const source = fs.readFileSync(resolved, "utf8");
	const parts = [];
	for (const spec of extractLocalCssImports(source)) {
		parts.push(readCssWithImports(path.resolve(path.dirname(resolved), spec), visited));
	}
	parts.push(source);
	return parts.filter(Boolean).join("\n");
}

function cssHasTheme(source) {
	return /@theme\b/.test(source);
}

function writeThemeRuntime(options) {
	const configPath = options.configPath || null;
	const css = options.css || "";
	const projectRoot = path.dirname(configPath || options.cssPath || process.cwd());
	const cssLiteral = css ? JSON.stringify(css) : "undefined";
	const configExpr = configPath
		? `require(${JSON.stringify(configPath.split(path.sep).join("/"))})`
		: "undefined";
	const runtime = `"use strict";
var nw = require("nitro-wind");
var load = nw.loadTailwindTheme || (nw.default && nw.default.loadTailwindTheme);
var config = ${configExpr};
if (typeof load === "function") {
  load({
    css: ${cssLiteral},
    config: config && config.default ? config.default : config,
  });
}
`;
	const dirs = [
		path.join(projectRoot, "node_modules", ".cache", "nitro-wind"),
		path.join(os.tmpdir(), "nitro-wind-theme"),
	];
	for (const dir of dirs) {
		try {
			fs.mkdirSync(dir, { recursive: true });
			const runtimePath = path.join(dir, "runtime.js");
			if (!fs.existsSync(runtimePath) || fs.readFileSync(runtimePath, "utf8") !== runtime) {
				fs.writeFileSync(runtimePath, runtime);
			}
			return runtimePath;
		} catch {
			// try the next cache directory
		}
	}
	return null;
}

module.exports = {
	CONFIG_NAMES,
	CSS_NAMES,
	flattenTailwindTheme,
	shouldLoadConfig,
	findTailwindConfig,
	findCssEntry,
	loadTailwindConfigModule,
	readCssWithImports,
	cssHasTheme,
	extractAtConfigPath,
	writeThemeRuntime,
	parseLength,
};
