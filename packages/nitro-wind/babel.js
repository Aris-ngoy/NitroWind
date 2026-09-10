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

module.exports = function nitroWindBabelPlugin({ types: t }) {
	return {
		name: "nitro-wind-classname",
		visitor: {
			ImportDeclaration(path) {
				if (path.node.source.value !== "react-native") return;

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
		},
	};
};
