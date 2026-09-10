const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, "node_modules"),
	path.resolve(monorepoRoot, "node_modules"),
];

// NativeWind (`withNativeWind`) and Uniwind (`withUniwindConfig`) both wrap Metro
// with CSS pipelines that cannot share one bundle. NativeWind classNames are
// compiled via a Babel override scoped to `src/engines/nativewind/`. Uniwind uses
// `useResolveClassNames`. Both screens keep a StyleSheet catalog so the lists match.

module.exports = config;
