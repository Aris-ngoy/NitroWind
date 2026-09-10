import { computeStyle } from "nitro-wind";
import { Profiler, type ProfilerOnRenderCallback, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatMs, formatOps, formatPerOp, now, runBenchmark, type BenchmarkResult } from "./bench";
import { ITERATION_OPTIONS, LIST_SIZES, classes, createItems, styles } from "./catalog";
import { ENGINES, type EngineId } from "./engines";
import { NativewindScreen } from "./engines/nativewind/Screen";
import { NitrowindScreen } from "./engines/nitrowind/Screen";
import { UniwindScreen } from "./engines/uniwind/Screen";
import { resolveUniwindSync } from "./engines/uniwind/resolve";

type BenchView = "resolve" | "render" | "scorecard";

interface RenderMetrics {
	actualDuration: number;
	baseDuration: number;
	paintMs: number;
	renderCount: number;
}

export default function CompareApp() {
	const [engine, setEngine] = useState<EngineId>("nitrowind");
	const [activeView, setActiveView] = useState<BenchView>("resolve");
	const [iterations, setIterations] = useState<number>(2_000);
	const [listCount, setListCount] = useState<number>(120);

	// Key used to force remount for testing render performance
	const [renderNonce, setRenderNonce] = useState(0);
	const [isAutoTesting, setIsAutoTesting] = useState(false);

	const [resolveResults, setResolveResults] = useState<Partial<Record<EngineId, BenchmarkResult>>>({});
	const [renderMetrics, setRenderMetrics] = useState<Partial<Record<EngineId, RenderMetrics>>>({});

	const profilerMetricsRef = useRef<Partial<Record<EngineId, { actualDuration: number; baseDuration: number }>>>({});
	const paintStart = useRef(now());
	const lastMountKeyRef = useRef("");

	const items = useMemo(() => createItems(listCount), [listCount]);
	const meta = useMemo(() => ENGINES.find((item) => item.id === engine) ?? ENGINES[0], [engine]);

	// Keep mount timing accurate: reset paintStart whenever engine, nonce, or listCount changes
	const currentMountKey = `${engine}-${renderNonce}-${listCount}`;
	if (lastMountKeyRef.current !== currentMountKey) {
		lastMountKeyRef.current = currentMountKey;
		paintStart.current = now();
	}

	const selectEngine = useCallback((next: EngineId) => {
		paintStart.current = now();
		setRenderNonce((n) => n + 1);
		setEngine(next);
	}, []);

	// Force a fresh remount of the screen to profile render time on demand
	const testRemount = useCallback(() => {
		paintStart.current = now();
		setRenderNonce((prev) => prev + 1);
	}, []);

	// Profiler callback records into ref to avoid re-triggering parent renders
	const onProfilerRender: ProfilerOnRenderCallback = useCallback(
		(id, _phase, actualDuration, baseDuration) => {
			profilerMetricsRef.current[id as EngineId] = {
				actualDuration,
				baseDuration,
			};
		},
		[],
	);

	const onListLayout = useCallback(() => {
		const elapsed = now() - paintStart.current;
		const prof = profilerMetricsRef.current[engine];
		setRenderMetrics((prev) => {
			const existing = prev[engine];
			return {
				...prev,
				[engine]: {
					actualDuration: prof?.actualDuration ?? existing?.actualDuration ?? 0,
					baseDuration: prof?.baseDuration ?? existing?.baseDuration ?? 0,
					paintMs: elapsed,
					renderCount: (existing?.renderCount ?? 0) + 1,
				},
			};
		});
	}, [engine]);

	// Run resolve benchmark using multi-sample warmup benchmark runner
	const runResolveBench = useCallback(() => {
		const nitroBench = runBenchmark(iterations, () => {
			computeStyle(classes.row);
		});
		const nativewindBench = runBenchmark(iterations, () => {
			void styles.row;
		});
		const uniwindBench = runBenchmark(iterations, () => {
			void (resolveUniwindSync(classes.row) ?? styles.row);
		});

		setResolveResults({
			nitrowind: nitroBench,
			nativewind: nativewindBench,
			uniwind: uniwindBench,
		});
	}, [iterations]);

	useEffect(() => {
		runResolveBench();
	}, [runResolveBench]);

	// Automated runner to benchmark all engines sequentially
	const runFullSuite = useCallback(async () => {
		if (isAutoTesting) return;
		setIsAutoTesting(true);

		// 1. Resolve bench
		runResolveBench();

		// 2. Measure nitrowind
		setRenderNonce((n) => n + 1);
		setEngine("nitrowind");
		paintStart.current = now();
		await new Promise((r) => setTimeout(r, 300));

		// 3. Measure nativewind
		setRenderNonce((n) => n + 1);
		setEngine("nativewind");
		paintStart.current = now();
		await new Promise((r) => setTimeout(r, 300));

		// 4. Measure uniwind
		setRenderNonce((n) => n + 1);
		setEngine("uniwind");
		paintStart.current = now();
		await new Promise((r) => setTimeout(r, 300));

		// Return to nitrowind
		setRenderNonce((n) => n + 1);
		setEngine("nitrowind");
		paintStart.current = now();
		setIsAutoTesting(false);
	}, [isAutoTesting, runResolveBench]);

	// Compute fastest resolve winner
	const resolveWinnerId = useMemo(() => {
		const entries = Object.entries(resolveResults).filter(
			(entry): entry is [EngineId, BenchmarkResult] => entry[1] != null && entry[1].totalMs > 0,
		);
		if (entries.length === 0) return null;
		entries.sort((a, b) => a[1].totalMs - b[1].totalMs);
		return entries[0]?.[0] ?? null;
	}, [resolveResults]);

	// Compute fastest render winner (based on paint layout time)
	const renderWinnerId = useMemo(() => {
		const entries = Object.entries(renderMetrics).filter(
			(entry): entry is [EngineId, RenderMetrics] => entry[1] != null && entry[1].paintMs > 0,
		);
		if (entries.length < 2) return null;
		entries.sort((a, b) => a[1].paintMs - b[1].paintMs);
		return entries[0]?.[0] ?? null;
	}, [renderMetrics]);

	const resolveWinnerMeta = useMemo(
		() => ENGINES.find((e) => e.id === resolveWinnerId),
		[resolveWinnerId],
	);

	const renderWinnerMeta = useMemo(
		() => ENGINES.find((e) => e.id === renderWinnerId),
		[renderWinnerId],
	);

	// Max values for relative bar charts
	const maxOpsPerSec = useMemo(() => {
		const vals = Object.values(resolveResults).map((r) => r?.opsPerSec ?? 0);
		return Math.max(...vals, 1);
	}, [resolveResults]);

	const minPaintMs = useMemo(() => {
		const vals = Object.values(renderMetrics)
			.map((m) => m?.paintMs ?? 0)
			.filter((v) => v > 0);
		return vals.length > 0 ? Math.min(...vals) : 1;
	}, [renderMetrics]);

	return (
		<SafeAreaView style={styles.screen}>
			{/* Top Header */}
			<View style={styles.header}>
				<Text style={styles.title}>Style Engine Benchmark</Text>
				<Text style={styles.subtitle}>
					Benchmarking {listCount} rows & {iterations.toLocaleString()} className resolves across
					nitro-wind, NativeWind, and Uniwind.
				</Text>
			</View>

			{/* Engine Tabs */}
			<View style={styles.tabs}>
				{ENGINES.map((item) => {
					const active = item.id === engine;
					const isResolveWinner = resolveWinnerId === item.id;
					const isRenderWinner = renderWinnerId === item.id;
					const isAnyWinner = isResolveWinner || isRenderWinner;
					return (
						<Pressable
							key={item.id}
							onPress={() => selectEngine(item.id)}
							style={[
								active ? styles.chipActive : styles.chip,
								isAnyWinner && (active ? styles.chipWinnerActive : styles.chipWinner),
							]}
						>
							<Text
								style={[
									active ? styles.chipLabelActive : styles.chipLabel,
									isAnyWinner && styles.chipLabelWinner,
								]}
							>
								{item.label}
								{isAnyWinner ? " 🏆" : ""}
							</Text>
						</Pressable>
					);
				})}
			</View>

			{/* Main Benchmark Dashboard Panel */}
			<View style={styles.panel}>
				{/* Current Engine Metadata */}
				<View style={styles.panelTopRow}>
					<Text style={styles.panelLabel}>{meta.label} · {meta.runtime}</Text>
					{resolveWinnerId === engine ? (
						<View style={[styles.benchPillWinner, { paddingVertical: 2, paddingHorizontal: 6 }]}>
							<Text style={styles.benchPillTextWinner}>🏆 Fastest Resolve</Text>
						</View>
					) : renderWinnerId === engine ? (
						<View style={[styles.benchPillWinner, { paddingVertical: 2, paddingHorizontal: 6 }]}>
							<Text style={styles.benchPillTextWinner}>🏆 Fastest Render</Text>
						</View>
					) : null}
				</View>
				<Text style={styles.panelBody}>{meta.note}</Text>

				{/* Segmented Control for Views */}
				<View style={styles.segmentedRow}>
					<Pressable
						style={[styles.segmentBtn, activeView === "resolve" && styles.segmentBtnActive]}
						onPress={() => setActiveView("resolve")}
					>
						<Text style={[styles.segmentBtnText, activeView === "resolve" && styles.segmentBtnTextActive]}>
							⚡ Resolve Speed
						</Text>
					</Pressable>
					<Pressable
						style={[styles.segmentBtn, activeView === "render" && styles.segmentBtnActive]}
						onPress={() => setActiveView("render")}
					>
						<Text style={[styles.segmentBtnText, activeView === "render" && styles.segmentBtnTextActive]}>
							🎨 Rendering
						</Text>
					</Pressable>
					<Pressable
						style={[styles.segmentBtn, activeView === "scorecard" && styles.segmentBtnActive]}
						onPress={() => setActiveView("scorecard")}
					>
						<Text style={[styles.segmentBtnText, activeView === "scorecard" && styles.segmentBtnTextActive]}>
							📊 Scorecard
						</Text>
					</Pressable>
				</View>

				{/* VIEW 1: RESOLVE BENCHMARK */}
				{activeView === "resolve" ? (
					<>
						{/* Relative Comparison Bars */}
						<View style={styles.chartContainer}>
							<View style={styles.chartTitleRow}>
								<Text style={styles.chartTitle}>Throughput (Operations / sec)</Text>
								<Text style={[styles.chartTitle, { color: "#38bdf8" }]}>Higher is faster</Text>
							</View>
							{ENGINES.map((item) => {
								const res = resolveResults[item.id];
								const ops = res?.opsPerSec ?? 0;
								const pct = maxOpsPerSec > 0 ? Math.max((ops / maxOpsPerSec) * 100, 4) : 4;
								const isWinner = resolveWinnerId === item.id;
								return (
									<View
										key={item.id}
										style={[
											styles.chartRow,
											isWinner && {
												backgroundColor: "#16a34a",
												padding: 8,
												borderRadius: 8,
											},
										]}
									>
										<View style={styles.chartRowHeader}>
											<Text
												style={[
													isWinner ? styles.chartRowLabelWinner : styles.chartRowLabel,
													isWinner && { color: "#ffffff", fontWeight: "800" },
												]}
											>
												{item.label} {isWinner ? "🏆 Fastest Resolve" : ""}
											</Text>
											<Text style={[styles.chartRowValue, isWinner && { color: "#ffffff" }]}>
												{formatOps(ops)} ({formatMs(res?.totalMs)})
											</Text>
										</View>
										<View style={[styles.barTrack, isWinner && { backgroundColor: "#14532d" }]}>
											<View
												style={[
													isWinner ? [styles.barFillWinner, { backgroundColor: "#ffffff" }] : styles.barFill,
													{ width: `${pct}%` },
												]}
											/>
										</View>
									</View>
								);
							})}
						</View>

						{/* Metric cards for current engine */}
						<View style={styles.metricsGrid}>
							<View style={[styles.metricCard, resolveWinnerId === engine && styles.metricCardWinner]}>
								<View style={styles.metricCardHeader}>
									<Text style={resolveWinnerId === engine ? styles.metricCardTitleWinner : styles.metricCardTitle}>
										Total Time
									</Text>
									{resolveWinnerId === engine ? <Text>🏆</Text> : null}
								</View>
								<Text style={styles.metricCardValue}>{formatMs(resolveResults[engine]?.totalMs)}</Text>
								<Text style={resolveWinnerId === engine ? styles.metricCardSubWinner : styles.metricCardSub}>
									for {iterations.toLocaleString()} resolves
								</Text>
							</View>

							<View style={[styles.metricCard, resolveWinnerId === engine && styles.metricCardWinner]}>
								<View style={styles.metricCardHeader}>
									<Text style={resolveWinnerId === engine ? styles.metricCardTitleWinner : styles.metricCardTitle}>
										Speed
									</Text>
								</View>
								<Text style={styles.metricCardValue}>{formatOps(resolveResults[engine]?.opsPerSec)}</Text>
								<Text style={resolveWinnerId === engine ? styles.metricCardSubWinner : styles.metricCardSub}>
									{formatPerOp(resolveResults[engine]?.usPerOp)}
								</Text>
							</View>
						</View>

						{resolveWinnerMeta ? (
							<View style={styles.winnerBanner}>
								<Text style={styles.winnerBannerText}>
									🏆 Fastest Resolve: {resolveWinnerMeta.label} ({formatOps(resolveResults[resolveWinnerMeta.id]?.opsPerSec)})
								</Text>
							</View>
						) : null}
					</>
				) : null}

				{/* VIEW 2: RENDERING PERFORMANCE */}
				{activeView === "render" ? (
					<>
						{/* Rendering Metrics Grid */}
						<View style={styles.metricsGrid}>
							<View style={[styles.metricCard, renderWinnerId === engine && styles.metricCardWinner]}>
								<View style={styles.metricCardHeader}>
									<Text style={renderWinnerId === engine ? styles.metricCardTitleWinner : styles.metricCardTitle}>
										Layout Paint
									</Text>
									{renderWinnerId === engine ? <Text>🏆</Text> : null}
								</View>
								<Text style={styles.metricCardValue}>{formatMs(renderMetrics[engine]?.paintMs)}</Text>
								<Text style={renderWinnerId === engine ? styles.metricCardSubWinner : styles.metricCardSub}>
									{renderMetrics[engine]?.paintMs
										? `${(renderMetrics[engine]!.paintMs / listCount).toFixed(2)} ms/row`
										: "Mount to onLayout"}
								</Text>
							</View>

							<View style={styles.metricCard}>
								<View style={styles.metricCardHeader}>
									<Text style={styles.metricCardTitle}>React Render</Text>
								</View>
								<Text style={styles.metricCardValue}>
									{formatMs(renderMetrics[engine]?.actualDuration)}
								</Text>
								<Text style={styles.metricCardSub}>
									base: {formatMs(renderMetrics[engine]?.baseDuration)}
								</Text>
							</View>

							<View style={styles.metricCard}>
								<View style={styles.metricCardHeader}>
									<Text style={styles.metricCardTitle}>Commits</Text>
								</View>
								<Text style={styles.metricCardValue}>
									{renderMetrics[engine]?.renderCount ?? 0}×
								</Text>
								<Text style={styles.metricCardSub}>Profiler updates</Text>
							</View>
						</View>

						{/* Relative Render Time Comparison */}
						<View style={styles.chartContainer}>
							<View style={styles.chartTitleRow}>
								<Text style={styles.chartTitle}>List Layout Paint ({listCount} rows)</Text>
								<Text style={[styles.chartTitle, { color: "#4ade80" }]}>Lower is faster</Text>
							</View>
							{ENGINES.map((item) => {
								const paint = renderMetrics[item.id]?.paintMs ?? null;
								const isWinner = renderWinnerId === item.id;
								// Normalized width for lower-is-better
								const ratio = paint && minPaintMs > 0 ? (minPaintMs / paint) * 100 : 10;
								return (
									<View
										key={item.id}
										style={[
											styles.chartRow,
											isWinner && {
												backgroundColor: "#16a34a",
												padding: 8,
												borderRadius: 8,
											},
										]}
									>
										<View style={styles.chartRowHeader}>
											<Text
												style={[
													isWinner ? styles.chartRowLabelWinner : styles.chartRowLabel,
													isWinner && { color: "#ffffff", fontWeight: "800" },
												]}
											>
												{item.label} {isWinner ? "🏆 Fastest List Render" : ""}
											</Text>
											<Text style={[styles.chartRowValue, isWinner && { color: "#ffffff" }]}>
												{formatMs(paint)}
											</Text>
										</View>
										<View style={[styles.barTrack, isWinner && { backgroundColor: "#14532d" }]}>
											<View
												style={[
													isWinner ? [styles.barFillWinner, { backgroundColor: "#ffffff" }] : styles.barFill,
													{ width: `${paint ? Math.max(ratio, 8) : 0}%` },
												]}
											/>
										</View>
									</View>
								);
							})}
						</View>

						{renderWinnerMeta ? (
							<View style={styles.winnerBanner}>
								<Text style={styles.winnerBannerText}>
									🏆 Fastest List Rendering: {renderWinnerMeta.label} ({formatMs(renderMetrics[renderWinnerMeta.id]?.paintMs)})
								</Text>
							</View>
						) : null}
					</>
				) : null}

				{/* VIEW 3: HEAD-TO-HEAD SCORECARD */}
				{activeView === "scorecard" ? (
					<View style={styles.chartContainer}>
						<View style={styles.chartTitleRow}>
							<Text style={styles.chartTitle}>Engine Performance Scorecard</Text>
						</View>

						{ENGINES.map((item) => {
							const res = resolveResults[item.id];
							const ren = renderMetrics[item.id];
							const isResolveWinner = resolveWinnerId === item.id;
							const isRenderWinner = renderWinnerId === item.id;
							const isAnyWinner = isResolveWinner || isRenderWinner;
							const winnerTitle =
								isResolveWinner && isRenderWinner
									? "🏆 Overall Champion"
									: isResolveWinner
									? "🏆 Fastest Resolve"
									: isRenderWinner
									? "🏆 Fastest List Render"
									: null;

							return (
								<View
									key={item.id}
									style={[
										styles.chartRow,
										{
											backgroundColor: isAnyWinner ? "#16a34a" : "#0f172a",
											padding: 10,
											borderRadius: 8,
											borderWidth: 1,
											borderColor: isAnyWinner ? "#4ade80" : "#1e293b",
										},
									]}
								>
									<View style={styles.chartRowHeader}>
										<Text
											style={[
												isAnyWinner ? styles.chartRowLabelWinner : styles.chartRowLabel,
												isAnyWinner && { color: "#ffffff", fontWeight: "800", fontSize: 13 },
											]}
										>
											{item.label} {winnerTitle ? `(${winnerTitle})` : ""}
										</Text>
										<Text style={[styles.chartRowValue, isAnyWinner && { color: "#dcfce7" }]}>
											{item.runtime}
										</Text>
									</View>
									<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
										<Text style={{ color: isAnyWinner ? "#dcfce7" : "#94a3b8", fontSize: 11 }}>
											Resolve:{" "}
											<Text style={{ color: "#ffffff", fontWeight: "700" }}>
												{formatMs(res?.totalMs)} ({formatOps(res?.opsPerSec)})
											</Text>
										</Text>
										<Text style={{ color: isAnyWinner ? "#dcfce7" : "#94a3b8", fontSize: 11 }}>
											Paint:{" "}
											<Text style={{ color: "#ffffff", fontWeight: "700" }}>
												{formatMs(ren?.paintMs)}
											</Text>
										</Text>
									</View>
								</View>
							);
						})}
					</View>
				) : null}

				{/* Primary Action Buttons */}
				<View style={styles.controlsRow}>
					<Pressable style={styles.btnAction} onPress={runFullSuite} disabled={isAutoTesting}>
						<Text style={styles.btnActionText}>
							{isAutoTesting ? "⏳ Running..." : "🚀 Benchmark All"}
						</Text>
					</Pressable>
					<Pressable style={styles.btnActionSecondary} onPress={testRemount}>
						<Text style={styles.btnActionTextSecondary}>🔄 Re-render Screen</Text>
					</Pressable>
				</View>

				{/* Config Selectors: Iterations & Row Count */}
				<View style={styles.subControlRow}>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
						<Text style={styles.subControlLabel}>Resolves:</Text>
						<View style={styles.miniSelector}>
							{ITERATION_OPTIONS.map((val) => (
								<Pressable
									key={val}
									style={[styles.miniOption, iterations === val && styles.miniOptionActive]}
									onPress={() => setIterations(val)}
								>
									<Text style={iterations === val ? styles.miniOptionTextActive : styles.miniOptionText}>
										{val >= 1000 ? `${val / 1000}k` : val}
									</Text>
								</Pressable>
							))}
						</View>
					</View>

					<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
						<Text style={styles.subControlLabel}>Rows:</Text>
						<View style={styles.miniSelector}>
							{LIST_SIZES.map((val) => (
								<Pressable
									key={val}
									style={[styles.miniOption, listCount === val && styles.miniOptionActive]}
									onPress={() => {
										paintStart.current = now();
										setListCount(val);
									}}
								>
									<Text style={listCount === val ? styles.miniOptionTextActive : styles.miniOptionText}>
										{val}
									</Text>
								</Pressable>
							))}
						</View>
					</View>
				</View>
			</View>

			{/* Render Engine Screen inside React Profiler */}
			<Profiler id={engine} onRender={onProfilerRender}>
				<View style={{ flex: 1 }}>
					{engine === "nitrowind" ? (
						<NitrowindScreen
							key={`nitro-${renderNonce}-${listCount}`}
							items={items}
							onLayout={onListLayout}
						/>
					) : null}
					{engine === "nativewind" ? (
						<NativewindScreen
							key={`native-${renderNonce}-${listCount}`}
							items={items}
							onLayout={onListLayout}
						/>
					) : null}
					{engine === "uniwind" ? (
						<UniwindScreen
							key={`uni-${renderNonce}-${listCount}`}
							items={items}
							onLayout={onListLayout}
						/>
					) : null}
				</View>
			</Profiler>
		</SafeAreaView>
	);
}
