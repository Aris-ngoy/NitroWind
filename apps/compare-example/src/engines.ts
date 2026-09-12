export type EngineId = "nitrowind" | "nativewind" | "uniwind";

export interface EngineMeta {
	id: EngineId;
	label: string;
	runtime: string;
	note: string;
	/** True when this engine has a synchronous, headless resolve function comparable
	 * across engines. False when its real API only resolves inside a React render
	 * (a hook or a component wrapper) — for those, only the render/paint benchmark
	 * is a fair comparison; the resolve-speed benchmark leaves them unmeasured
	 * rather than substituting a fake synchronous call. */
	hasHeadlessResolve: boolean;
}

export const ENGINES: EngineMeta[] = [
	{
		id: "nitrowind",
		label: "nitro-wind",
		runtime: "C++ HybridObject with JS fallback",
		note: "Runtime Tailwind. className is parsed by nitro-wind and mapped onto the style prop via the exported computeStyle function.",
		hasHeadlessResolve: true,
	},
	{
		id: "nativewind",
		label: "NativeWind",
		runtime: "v4 cssInterop",
		note: "Uses NativeWind's cssInterop className API, wired via withNativeWind in metro.config.js so global.css is really compiled and resolved against. cssInterop has no public synchronous resolve function — it resolves only inside the component it wraps — so it is not part of the Resolve Speed comparison, only Rendering.",
		hasHeadlessResolve: false,
	},
	{
		id: "uniwind",
		label: "Uniwind",
		runtime: "useResolveClassNames",
		note: "Uses Uniwind's real useResolveClassNames hook. Its Metro CSS pipeline (withUniwindConfig) is not wired in this shared bundle — NativeWind and Uniwind each unconditionally claim Metro's transformerPath, so only one can own a bundle — so the hook has no compiled definitions to match and legitimately resolves to nothing here. useResolveClassNames is a hook, not a callable function, so it is not part of the Resolve Speed comparison either.",
		hasHeadlessResolve: false,
	},
];
