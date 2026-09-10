export type EngineId = "stylesheet" | "nitrowind" | "nativewind" | "uniwind";

export interface EngineMeta {
	id: EngineId;
	label: string;
	runtime: string;
	note: string;
}

export const ENGINES: EngineMeta[] = [
	{
		id: "stylesheet",
		label: "StyleSheet",
		runtime: "React Native StyleSheet.create",
		note: "Baseline. Styles are created once and applied as objects — no className parsing.",
	},
	{
		id: "nitrowind",
		label: "nitro-wind",
		runtime: "C++ HybridObject with JS fallback",
		note: "Runtime Tailwind. className is parsed by nitro-wind and mapped onto the style prop.",
	},
	{
		id: "nativewind",
		label: "NativeWind",
		runtime: "v4 cssInterop",
		note: "Uses NativeWind's cssInterop className API. Metro CSS is scoped off so it does not rewrite nitro-wind classNames; compiled StyleSheet twins keep the list visually identical.",
	},
	{
		id: "uniwind",
		label: "Uniwind",
		runtime: "useResolveClassNames",
		note: "Uses Uniwind's runtime className resolver. withUniwindConfig is omitted because it cannot share Metro with NativeWind; empty results fall back to the same compiled StyleSheet catalog.",
	},
];
