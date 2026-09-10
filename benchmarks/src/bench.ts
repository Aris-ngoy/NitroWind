import { JsStyleEngine } from "nitro-wind-core";

const SIMPLE = "p-4 bg-red-500";
const COMPLEX =
	"flex-1 items-center justify-center px-6 py-4 bg-slate-900 dark:bg-black ios:p-8 md:p-10 rounded-2xl border border-slate-800 text-white font-bold shadow-md";

function now(): number {
	return performance.now();
}

function bench(name: string, iterations: number, fn: () => void): number {
	fn();
	const start = now();
	for (let i = 0; i < iterations; i++) fn();
	const elapsed = now() - start;
	const ops = Math.round(iterations / (elapsed / 1000));
	console.log(
		`${name.padEnd(48)} ${elapsed.toFixed(2).padStart(8)} ms   ${ops.toLocaleString()} ops/sec`,
	);
	return ops;
}

function stylesheetBaseline(className: string) {
	const style: Record<string, unknown> = {};
	if (className.includes("p-4")) style.padding = 16;
	if (className.includes("bg-red-500")) style.backgroundColor = "#ef4444";
	if (className.includes("flex-1")) style.flex = 1;
	if (className.includes("items-center")) style.alignItems = "center";
	if (className.includes("justify-center")) style.justifyContent = "center";
	return style;
}

const engine = new JsStyleEngine();
const iterations = 25_000;

console.log("nitro-wind JS engine vs StyleSheet-style object construction\n");
bench("StyleSheet-like object (simple)", iterations, () => {
	stylesheetBaseline(SIMPLE);
});
bench("nitro-wind JS compute (simple, cold-ish)", iterations, () => {
	engine.clearCache();
	engine.compute(SIMPLE);
});

const cached = new JsStyleEngine();
cached.compute(SIMPLE);
bench("nitro-wind JS compute (simple, cache hit)", iterations, () => {
	cached.compute(SIMPLE);
});

bench("StyleSheet-like object (complex includes)", iterations, () => {
	stylesheetBaseline(COMPLEX);
});
bench("nitro-wind JS compute (complex, cache hit)", iterations, () => {
	cached.compute(COMPLEX);
});

const listEngine = new JsStyleEngine();
bench("1000-row className resolve (cache warm)", 10, () => {
	for (let i = 0; i < 1000; i++) {
		listEngine.compute(
			`p-4 mb-2 rounded-xl bg-slate-800 ${i % 2 === 0 ? "bg-red-500" : "bg-blue-600"}`,
		);
	}
});

console.log("\nNative C++ Nitro HybridObject is expected to beat this JS fallback on device.");
console.log(
	"Compare on a New Architecture build against NativeWind / Uniwind using the example list screen.",
);
