const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, "node_modules"),
	path.resolve(monorepoRoot, "node_modules"),
];

// Only one of NativeWind (`withNativeWind`) and Uniwind (`withUniwindConfig`) can
// own this bundle. Both unconditionally set the top-level `transformerPath` field
// on the Metro config they return (verified against node_modules/nativewind and
// node_modules/uniwind source) without forwarding to whatever transformer was
// already registered, so whichever wraps second silently discards the other's
// transform pipeline for every file, not just competing CSS. NativeWind is wired
// for real here — its `nativewind/babel` + `jsxImportSource: "nativewind"`
// override already existed scoped to `src/engines/nativewind/`; this makes that
// cssInterop path have real CSS-extracted definitions to resolve against instead
// of resolving to nothing. Uniwind's `useResolveClassNames` hook still runs for
// real in `engines/uniwind/Screen.tsx` — it just has no compiled CSS to match in
// this shared bundle, which `engines/uniwind/resolve.ts` reports honestly via
// `UNIWIND_METRO_PIPELINE_LIVE = false` rather than faking a result.
module.exports = withNativeWind(config, { input: "./global.css" });
