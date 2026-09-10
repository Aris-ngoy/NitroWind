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

function isAotCompilableClassName(className) {
	if (!className) return false;
	if (hasBareColon(className)) return false;
	if (/(?:^|\s)group(?:\s|$)/.test(className)) return false;
	if (className.includes("animate-") || className.includes("transition")) return false;
	return true;
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

function nitroWindBabelPlugin({ types: t }) {
	return {
		name: "nitro-wind-classname",
		pre() {
			this.staticStyles = [];
			this.stylesId = null;
			this.computeId = null;
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
				if (!className || !isAotCompilableClassName(className)) return;

				const opening = path.parent;
				if (!t.isJSXOpeningElement(opening)) return;

				const programPath = path.findParent((parent) => parent.isProgram());
				if (!programPath) return;

				if (!this.stylesId) {
					this.stylesId = programPath.scope.generateUidIdentifier("nwStyles");
				}

				const id = `n${this.staticStyles.length}`;
				this.staticStyles.push({ id, className });

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

					if (!this.computeId) {
						this.computeId = path.scope.generateUidIdentifier("computeStaticStyle");
					}
					const filename = this.filename ?? this.file.opts.filename;
					const computeId = addNamedImport(
						t,
						path,
						computeStaticImportSource(filename),
						"computeStaticStyle",
						this.computeId,
					);
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
							t.callExpression(t.cloneNode(computeId), [t.stringLiteral(entry.className)]),
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
module.exports = nitroWindBabelPlugin;
