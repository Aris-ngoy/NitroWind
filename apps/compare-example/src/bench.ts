export function now(): number {
	return typeof performance !== "undefined" && typeof performance.now === "function"
		? performance.now()
		: Date.now();
}

export function timeSync(iterations: number, fn: () => void): number {
	fn();
	const start = now();
	for (let i = 0; i < iterations; i++) {
		fn();
	}
	return now() - start;
}
