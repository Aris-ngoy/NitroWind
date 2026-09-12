const MAPPED = new Set([
	"View",
	"Text",
	"Pressable",
	"Image",
	"ScrollView",
	"TextInput",
	"TouchableOpacity",
	"FlatList",
]);

function hasBareColon(className) {
	let bracket = 0;
	for (let i = 0; i < className.length; i++) {
		const ch = className[i];
		if (ch === "[") bracket++;
		else if (ch === "]") bracket = Math.max(0, bracket - 1);
		else if (ch === ":" && bracket === 0) return true;
	}
	return false;
}

// The build-time twin of nitro-wind-core's classNameIsAotCompilable. The two
// cannot literally share code: this file runs as plain CommonJS with no build
// step of its own (react-native-builder-bob only compiles src/, not babel.js
// at the package root — see package.json's react-native-builder-bob.source),
// so it cannot `require` nitro-wind-core's TypeScript source directly. Both
// implementations are deliberately conservative in the same way — any bare
// colon (a variant, recognized or not), any bare "group" utility, or any
// animation utility disqualifies a className from being hoisted, because none
// of those are resolvable at build time. Agreement is enforced by the parity
// test in packages/nitro-wind/src/__tests__/babel.test.ts, which runs both
// functions against the same battery of classNames — not by shared code.
function isAotCompilableClassName(className) {
	if (!className) return false;
	if (hasBareColon(className)) return false;
	if (/(?:^|\s)group(?:\s|$)/.test(className)) return false;
	if (
		className.includes("animate-") ||
		className.includes("transition") ||
		className.includes("nw-entering") ||
		className.includes("nw-exiting") ||
		className.includes("nw-layout") ||
		className.includes("uw-entering") ||
		className.includes("uw-exiting") ||
		className.includes("uw-layout")
	) {
		return false;
	}
	return true;
}

const PLATFORM_VARIANTS = new Set(["ios", "android", "web"]);

// Ported from nitro-wind-core's tokenizer.ts: the same bracket-tracking
// colon-split hasBareColon above already implements, extended to collect the
// variants list instead of only detecting presence — needed here to check
// what KIND of variant each one is, not just whether one exists.
function parseClassToken(raw) {
	let input = raw;
	if (input.startsWith("!")) {
		input = input.slice(1);
	}
	const variants = [];
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
	return { variants, utility: input.slice(cursor) };
}

function tokenizeClassName(className) {
	return className.trim().split(/\s+/).filter(Boolean).map(parseClassToken);
}

// The build-time twin of nitro-wind-core's classNameIsPlatformOnlyVariant —
// same cross-runtime constraint and same parity-test enforcement as
// isAotCompilableClassName above. True when every variant present is a
// platform variant (ios/android/web) and there is at least one — mutually
// exclusive with isAotCompilableClassName, which handles the zero-variant
// case.
function platformOnlyVariantEligible(className) {
	if (!className) return false;
	if (/(?:^|\s)group(?:\s|$)/.test(className)) return false;
	if (
		className.includes("animate-") ||
		className.includes("transition") ||
		className.includes("nw-entering") ||
		className.includes("nw-exiting") ||
		className.includes("nw-layout") ||
		className.includes("uw-entering") ||
		className.includes("uw-exiting") ||
		className.includes("uw-layout")
	) {
		return false;
	}
	let hasPlatformVariant = false;
	for (const token of tokenizeClassName(className)) {
		for (const variant of token.variants) {
			if (!PLATFORM_VARIANTS.has(variant)) return false;
			hasPlatformVariant = true;
		}
	}
	return hasPlatformVariant;
}

function literalClassName(types, attribute) {
	const value = attribute.value;
	if (types.isStringLiteral(value)) return value.value;
	if (types.isJSXExpressionContainer(value) && types.isStringLiteral(value.expression)) {
		return value.expression.value;
	}
	if (
		types.isJSXExpressionContainer(value) &&
		types.isTemplateLiteral(value.expression) &&
		value.expression.expressions.length === 0 &&
		value.expression.quasis.length === 1
	) {
		return value.expression.quasis[0].value.cooked ?? value.expression.quasis[0].value.raw;
	}
	return null;
}

function unwrapStyleExpression(types, attribute) {
	if (!attribute || !types.isJSXAttribute(attribute)) return null;
	const value = attribute.value;
	if (types.isJSXExpressionContainer(value)) return value.expression;
	if (types.isStringLiteral(value)) return value;
	return null;
}

function findImport(programPath, source) {
	for (const stmt of programPath.node.body) {
		if (stmt.type === "ImportDeclaration" && stmt.source.value === source && !stmt._rawRN) {
			const hasNamespace = stmt.specifiers.some((s) => s.type === "ImportNamespaceSpecifier");
			if (!hasNamespace) return stmt;
		}
	}
	return null;
}

function findRawRNImport(programPath) {
	for (const stmt of programPath.node.body) {
		if (stmt.type === "ImportDeclaration" && stmt.source.value === "react-native" && stmt._rawRN) {
			const hasNamespace = stmt.specifiers.some((s) => s.type === "ImportNamespaceSpecifier");
			if (!hasNamespace) return stmt;
		}
	}
	return null;
}

function addRawRNImport(types, programPath, importedName, localId) {
	const existing = findRawRNImport(programPath);
	if (existing) {
		const found = existing.specifiers.find(
			(specifier) =>
				specifier.type === "ImportSpecifier" &&
				((specifier.imported.type === "Identifier" && specifier.imported.name === importedName) ||
					(specifier.imported.type === "StringLiteral" &&
						specifier.imported.value === importedName)),
		);
		if (found) return found.local;
		existing.specifiers.push(types.importSpecifier(localId, types.identifier(importedName)));
		return localId;
	}
	const decl = types.importDeclaration(
		[types.importSpecifier(localId, types.identifier(importedName))],
		types.stringLiteral("react-native"),
	);
	decl._rawRN = true;
	programPath.unshiftContainer("body", [decl]);
	return localId;
}

function addNamedImport(types, programPath, source, importedName, localId) {
	const existing = findImport(programPath, source);
	if (existing) {
		const found = existing.specifiers.find(
			(specifier) =>
				specifier.type === "ImportSpecifier" &&
				((specifier.imported.type === "Identifier" && specifier.imported.name === importedName) ||
					(specifier.imported.type === "StringLiteral" &&
						specifier.imported.value === importedName)),
		);
		if (found) return found.local;
		existing.specifiers.push(types.importSpecifier(localId, types.identifier(importedName)));
		return localId;
	}
	programPath.unshiftContainer("body", [
		types.importDeclaration(
			[types.importSpecifier(localId, types.identifier(importedName))],
			types.stringLiteral(source),
		),
	]);
	return localId;
}

function insertAfterImports(programPath, nodes) {
	const body = programPath.get("body");
	let lastImport = -1;
	for (let i = 0; i < body.length; i++) {
		if (body[i].isImportDeclaration()) lastImport = i;
	}
	if (lastImport === -1) {
		programPath.unshiftContainer("body", nodes);
		return;
	}
	body[lastImport].insertAfter(nodes);
}

function computeStaticImportSource(filename) {
	if (!isNitroWindLibraryFile(filename)) return "nitro-wind";
	const normalized = filename.replace(/\\/g, "/");
	const srcIndex = normalized.lastIndexOf("/src/");
	if (srcIndex === -1) return "nitro-wind";
	const depth = normalized.slice(srcIndex + "/src/".length).split("/").length - 1;
	if (depth <= 0) return "./engine";
	return `${"../".repeat(depth)}engine`;
}

function isNitroWindLibraryFile(filename) {
	if (!filename || typeof filename !== "string") return false;
	const normalized = filename.replace(/\\/g, "/");
	return (
		/\/packages\/nitro-wind\//.test(normalized) || /\/node_modules\/nitro-wind\//.test(normalized)
	);
}

function nitroWindBabelPlugin(api) {
	const t = api.types;
	// Metro passes the target platform to Babel plugin factories this way —
	// api.caller is part of @babel/core's standard plugin API (present on the
	// same object types is destructured from), and babel-preset-expo's own
	// use-dom-directive-plugin.js already reads api.caller(c => c?.platform)
	// from a plugin factory the same way, so this is a proven pattern, not a
	// speculative one. Platform.OS never changes within a running app
	// instance, so when this is known, a platform-only-variant className
	// (see platformOnlyVariantEligible) can be resolved to a single value
	// here instead of needing a runtime selector. Undefined when run outside
	// Metro (e.g. this file's own unit tests, which don't pass a caller) —
	// platform-only-variant classNames then fall through to the existing
	// runtime path untouched, same as any other variant-bearing className.
	const targetPlatform = api.caller((caller) => caller?.platform);

	return {
		name: "nitro-wind-classname",
		pre() {
			this.staticStyles = [];
			this.stylesId = null;
			this.computeId = null;
			this.computeForPlatformId = null;
		},
		visitor: {
			ImportDeclaration(path, state) {
				if (path.node._rawRN) return;
				if (path.node.source.value !== "react-native") return;
				if (isNitroWindLibraryFile(state.filename ?? state.file.opts.filename)) return;

				const mapped = [];
				const rest = [];
				for (const specifier of path.node.specifiers) {
					if (
						t.isImportSpecifier(specifier) &&
						t.isIdentifier(specifier.imported) &&
						MAPPED.has(specifier.imported.name)
					) {
						mapped.push(specifier);
					} else {
						rest.push(specifier);
					}
				}

				if (mapped.length === 0) return;

				const nitroImport = t.importDeclaration(mapped, t.stringLiteral("nitro-wind"));
				if (rest.length === 0) {
					path.replaceWith(nitroImport);
					return;
				}

				path.node.specifiers = rest;
				path.insertAfter(nitroImport);
			},
			JSXAttribute(path, state) {
				if (!t.isJSXIdentifier(path.node.name, { name: "className" })) return;
				const className = literalClassName(t, path.node);
				if (!className) return;

				// Two independent, mutually exclusive build-time-eligible shapes:
				// zero variants (resolvable on every platform, forever), or platform
				// variants only, resolvable now because this build already knows its
				// target platform. Anything else (colorScheme, rtl, breakpoints,
				// interaction, group, animation, or an unknown target platform) stays
				// on the runtime path exactly as before this candidate.
				let platform;
				if (isAotCompilableClassName(className)) {
					platform = undefined;
				} else if (targetPlatform && platformOnlyVariantEligible(className)) {
					platform = targetPlatform;
				} else {
					return;
				}

				const opening = path.parent;
				if (!t.isJSXOpeningElement(opening)) return;

				const programPath = path.findParent((parent) => parent.isProgram());
				if (!programPath) return;

				if (!this.stylesId) {
					this.stylesId = programPath.scope.generateUidIdentifier("nwStyles");
				}

				const id = `n${this.staticStyles.length}`;
				this.staticStyles.push({ id, className, platform });

				const styleExpr = t.memberExpression(t.cloneNode(this.stylesId), t.identifier(id));
				const styleAttr = opening.attributes.find(
					(attribute) =>
						t.isJSXAttribute(attribute) && t.isJSXIdentifier(attribute.name, { name: "style" }),
				);
				const existing = unwrapStyleExpression(t, styleAttr);
				const nextStyle = existing ? t.arrayExpression([styleExpr, existing]) : styleExpr;

				if (styleAttr && t.isJSXAttribute(styleAttr)) {
					styleAttr.value = t.jsxExpressionContainer(nextStyle);
				} else {
					opening.attributes.push(
						t.jsxAttribute(t.jsxIdentifier("style"), t.jsxExpressionContainer(nextStyle)),
					);
				}

				const jsxElement = path.parentPath?.parent;
				path.remove();

				// Tag rewrite to raw react-native primitive for zero-cost static rendering
				const filename = state.filename ?? state.file.opts.filename;
				if (
					!isNitroWindLibraryFile(filename) &&
					t.isJSXIdentifier(opening.name) &&
					MAPPED.has(opening.name.name)
				) {
					const tagName = opening.name.name;
					const rnId = addRawRNImport(
						t,
						programPath,
						tagName,
						programPath.scope.generateUidIdentifier(`_RN${tagName}`),
					);
					opening.name = t.cloneNode(rnId);
					if (t.isJSXElement(jsxElement) && jsxElement.closingElement) {
						jsxElement.closingElement.name = t.cloneNode(rnId);
					}
				}
			},
			Program: {
				exit(path) {
					const entries = this.staticStyles;
					if (!entries.length || !this.stylesId) return;

					const filename = this.filename ?? this.file.opts.filename;
					const importSource = computeStaticImportSource(filename);

					// Each import is added only if some entry actually needs it -- a
					// file whose hoisted classNames are all platform-only (or all
					// zero-variant) would otherwise end up with an unused import of
					// whichever function it never calls.
					const needsCompute = entries.some((entry) => !entry.platform);
					let computeId;
					if (needsCompute) {
						if (!this.computeId) {
							this.computeId = path.scope.generateUidIdentifier("computeStaticStyle");
						}
						computeId = addNamedImport(t, path, importSource, "computeStaticStyle", this.computeId);
					}

					const needsPlatformResolver = entries.some((entry) => entry.platform);
					let computeForPlatformId;
					if (needsPlatformResolver) {
						if (!this.computeForPlatformId) {
							this.computeForPlatformId = path.scope.generateUidIdentifier(
								"computeStaticStyleForPlatform",
							);
						}
						computeForPlatformId = addNamedImport(
							t,
							path,
							importSource,
							"computeStaticStyleForPlatform",
							this.computeForPlatformId,
						);
					}

					const styleSheetId = addNamedImport(
						t,
						path,
						"react-native",
						"StyleSheet",
						path.scope.generateUidIdentifier("StyleSheet"),
					);

					const properties = entries.map((entry) =>
						t.objectProperty(
							t.identifier(entry.id),
							entry.platform
								? t.callExpression(t.cloneNode(computeForPlatformId), [
										t.stringLiteral(entry.className),
										t.stringLiteral(entry.platform),
									])
								: t.callExpression(t.cloneNode(computeId), [t.stringLiteral(entry.className)]),
						),
					);

					insertAfterImports(path, [
						t.variableDeclaration("const", [
							t.variableDeclarator(
								t.cloneNode(this.stylesId),
								t.callExpression(
									t.memberExpression(t.cloneNode(styleSheetId), t.identifier("create")),
									[t.objectExpression(properties)],
								),
							),
						]),
					]);
				},
			},
		},
	};
}

nitroWindBabelPlugin.isAotCompilableClassName = isAotCompilableClassName;
nitroWindBabelPlugin.platformOnlyVariantEligible = platformOnlyVariantEligible;
module.exports = nitroWindBabelPlugin;
