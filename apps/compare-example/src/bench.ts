export interface BenchmarkResult {
	totalMs: number;
	avgMs: number;
	usPerOp: number;
	opsPerSec: number;
	minMs: number;
	samples: number[];
}

export function now(): number {
	return typeof performance !== "undefined" && typeof performance.now === "function"
		? performance.now()
		: Date.now();
}

/**
 * Runs a benchmark with warmup and multiple samples to minimize JIT/GC noise.
 */
export function runBenchmark(
	iterations: number,
	fn: () => void,
	samplesCount = 5,
): BenchmarkResult {
	// Warmup runs
	const warmupCount = Math.min(Math.max(Math.floor(iterations * 0.1), 10), 200);
	for (let w = 0; w < warmupCount; w++) {
		fn();
	}

	const samples: number[] = [];
	for (let s = 0; s < samplesCount; s++) {
		const start = now();
		for (let i = 0; i < iterations; i++) {
			fn();
		}
		const elapsed = now() - start;
		samples.push(elapsed);
	}

	// Sort samples and use median
	samples.sort((a, b) => a - b);
	const medianMs = samples[Math.floor(samples.length / 2)] ?? samples[0] ?? 0;
	const minMs = samples[0] ?? 0;
	const usPerOp = (medianMs / iterations) * 1000;
	const opsPerSec = medianMs > 0 ? Math.round(iterations / (medianMs / 1000)) : 0;

	return {
		totalMs: medianMs,
		avgMs: medianMs,
		usPerOp,
		opsPerSec,
		minMs,
		samples,
	};
}

export function timeSync(iterations: number, fn: () => void): number {
	return runBenchmark(iterations, fn, 3).totalMs;
}

export function formatMs(value: number | null | undefined): string {
	if (value == null) return "—";
	if (value < 0.01) return "< 0.01 ms";
	return `${value.toFixed(2)} ms`;
}

export function formatOps(ops: number | null | undefined): string {
	if (ops == null || ops === 0) return "—";
	if (ops >= 1_000_000) return `${(ops / 1_000_000).toFixed(2)}M ops/s`;
	if (ops >= 1_000) return `${(ops / 1_000).toFixed(1)}k ops/s`;
	return `${ops.toLocaleString()} ops/s`;
}

export function formatPerOp(us: number | null | undefined): string {
	if (us == null || us === 0) return "—";
	if (us < 1) return `${(us * 1000).toFixed(0)} ns/op`;
	return `${us.toFixed(2)} μs/op`;
}
