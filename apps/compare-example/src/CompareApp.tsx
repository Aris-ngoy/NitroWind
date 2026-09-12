import {
	BarChart3,
	Loader2,
	Palette,
	Rocket,
	RotateCw,
	Sparkles,
	Trophy,
	Zap,
} from "lucide-react-native";
import { ThemeTransitionPreset, computeStyle, styled, useNitroWind } from "nitro-wind";
import {
	Profiler,
	type ProfilerOnRenderCallback,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type BenchmarkResult, formatMs, formatOps, formatPerOp, now, runBenchmark } from "./bench";
import {
	ITERATION_OPTIONS,
	LIST_SIZES,
	THEME_PALETTES,
	classes,
	createItems,
	styles,
} from "./catalog";
import { ENGINES, type EngineId } from "./engines";
import { NativewindScreen } from "./engines/nativewind/Screen";
import { NitrowindScreen } from "./engines/nitrowind/Screen";
import { UniwindScreen } from "./engines/uniwind/Screen";

type BenchView = "resolve" | "render" | "scorecard" | "animations";

const AnimatedBox = styled(View);

const THEME_OPTIONS = [
	{ id: "dark", label: "Dark", bg: "#09090b" },
	{ id: "light", label: "Light", bg: "#ffffff" },
	{ id: "coffee", label: "Coffee", bg: "#1f1610" },
	{ id: "emerald", label: "Emerald", bg: "#022c22" },
	{ id: "ocean", label: "Ocean", bg: "#082f49" },
] as const;

const TRANSITION_PRESETS = [
	{ preset: ThemeTransitionPreset.CircleCenter, name: "Circle Center" },
	{ preset: ThemeTransitionPreset.CircleTopRight, name: "Circle Top-R" },
	{ preset: ThemeTransitionPreset.CircleBottomLeft, name: "Circle Bot-L" },
	{ preset: ThemeTransitionPreset.SlideRightToLeft, name: "Slide R→L" },
	{ preset: ThemeTransitionPreset.SlideLeftToRight, name: "Slide L→R" },
	{ preset: ThemeTransitionPreset.Fade, name: "Fade" },
	{ preset: ThemeTransitionPreset.Blur, name: "Blur" },
	{ preset: ThemeTransitionPreset.None, name: "Instant" },
] as const;

const DEMO_CARDS = [
	{
		id: "1",
		title: "Fade In item",
		tag: "uw-entering-fade-in",
		className:
			"uw-entering-fade-in uw-entering-duration-300 uw-exiting-fade-out uw-layout-linear-transition uw-layout-springify",
		color: "#4f46e5",
	},
	{
		id: "2",
		title: "Slide In Right item",
		tag: "uw-entering-slide-in-right",
		className:
			"uw-entering-slide-in-right uw-entering-duration-300 uw-exiting-fade-out uw-layout-linear-transition uw-layout-springify",
		color: "#0284c7",
	},
	{
		id: "3",
		title: "Zoom In item",
		tag: "uw-entering-zoom-in",
		className:
			"uw-entering-zoom-in uw-entering-duration-300 uw-exiting-fade-out uw-layout-linear-transition uw-layout-springify",
		color: "#059669",
	},
	{
		id: "4",
		title: "Bounce In item",
		tag: "nw-entering-bounce-in",
		className:
			"nw-entering-bounce-in nw-entering-duration-400 nw-exiting-fade-out nw-layout-linear-transition nw-layout-springify",
		color: "#d97706",
	},
];

interface RenderMetrics {
	actualDuration: number;
	baseDuration: number;
	paintMs: number;
	renderCount: number;
}

export default function CompareApp() {
	const { theme, setTheme } = useNitroWind();
	const palette = THEME_PALETTES[theme] ?? THEME_PALETTES.dark;
	const [selectedPreset, setSelectedPreset] = useState<ThemeTransitionPreset>(
		ThemeTransitionPreset.CircleCenter,
	);
	const [animCards, setAnimCards] = useState(DEMO_CARDS);
	const nextAnimId = useRef(5);

	const [engine, setEngine] = useState<EngineId>("nitrowind");
	const [activeView, setActiveView] = useState<BenchView>("resolve");
	const [iterations, setIterations] = useState<number>(2_000);
	const [listCount, setListCount] = useState<number>(120);

	const addAnimCard = () => {
		const templates = [
			{
				title: `Slide card #${nextAnimId.current}`,
				tag: "uw-entering-slide-in-left",
				className:
					"uw-entering-slide-in-left uw-entering-duration-300 uw-exiting-fade-out uw-layout-linear-transition uw-layout-springify",
				color: "#c026d3",
			},
			{
				title: `Zoom card #${nextAnimId.current}`,
				tag: "uw-entering-zoom-in",
				className:
					"uw-entering-zoom-in uw-entering-duration-300 uw-exiting-fade-out uw-layout-linear-transition uw-layout-springify",
				color: "#0891b2",
			},
			{
				title: `Fade card #${nextAnimId.current}`,
				tag: "nw-entering-fade-in",
				className:
					"nw-entering-fade-in nw-entering-duration-300 nw-exiting-fade-out nw-layout-linear-transition nw-layout-springify",
				color: "#e11d48",
			},
		];
		const template = templates[(nextAnimId.current - 5) % templates.length];
		if (template == null) return;
		const newId = String(nextAnimId.current++);
		setAnimCards((prev) => [...prev, { id: newId, ...template }]);
	};

	const removeAnimCard = (id: string) => {
		setAnimCards((prev) => prev.filter((c) => c.id !== id));
	};

	const shuffleAnimCards = () => {
		setAnimCards((prev) => [...prev].sort(() => Math.random() - 0.5));
	};

	// Key used to force remount for testing render performance
	const [renderNonce, setRenderNonce] = useState(0);
	const [isAutoTesting, setIsAutoTesting] = useState(false);

	const [resolveResults, setResolveResults] = useState<Partial<Record<EngineId, BenchmarkResult>>>(
		{},
	);
	const [renderMetrics, setRenderMetrics] = useState<Partial<Record<EngineId, RenderMetrics>>>({});

	const profilerMetricsRef = useRef<
		Partial<Record<EngineId, { actualDuration: number; baseDuration: number }>>
	>({});
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

	// Run resolve benchmark using multi-sample warmup benchmark runner.
	// Only engines with a real, synchronous, headless resolve function are timed
	// here (see EngineMeta.hasHeadlessResolve in ./engines) — NativeWind's
	// cssInterop and Uniwind's useResolveClassNames both resolve only inside a
	// React render, so faking a sync call for them would time something neither
	// engine actually does. They are compared fairly in the Rendering view instead.
	const runResolveBench = useCallback(() => {
		const nitroBench = runBenchmark(iterations, () => {
			computeStyle(classes.row);
		});

		setResolveResults({
			nitrowind: nitroBench,
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
		<SafeAreaView style={[styles.screen, { backgroundColor: palette.bg }]}>
			<ScrollView style={{ flex: 1 }}>
				{/* Top Header */}
				<View style={[styles.header, { backgroundColor: palette.headerBg }]}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "flex-start",
						}}
					>
						<View style={{ flex: 1, marginRight: 10 }}>
							<Text style={[styles.title, { color: palette.text }]}>Style Engine Benchmark</Text>
							<Text style={[styles.subtitle, { color: palette.textSecondary }]}>
								Benchmarking {listCount} rows & {iterations.toLocaleString()} resolves across
								nitro-wind, NativeWind, and Uniwind.
							</Text>
						</View>
						<Pressable
							style={[
								styles.animThemeBtn,
								{
									paddingHorizontal: 9,
									paddingVertical: 5,
									backgroundColor: palette.chipBg,
									borderColor: palette.chipBorder,
								},
							]}
							onPress={() => {
								const allThemes: readonly string[] = [
									"dark",
									"light",
									"coffee",
									"emerald",
									"ocean",
								];
								const currentIndex = allThemes.indexOf(theme);
								const next = allThemes[(currentIndex + 1) % allThemes.length] ?? "dark";
								setTheme(next, {
									preset: selectedPreset,
									duration: 400,
								});
							}}
						>
							<View
								style={[
									styles.animColorDot,
									{ backgroundColor: palette.accent, borderColor: palette.chipBorder },
								]}
							/>
							<Text
								style={[
									styles.animThemeBtnText,
									{ color: palette.text, textTransform: "capitalize" },
								]}
							>
								{theme}
							</Text>
						</Pressable>
					</View>
				</View>

				{/* Engine Tabs */}
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={[styles.tabs, { backgroundColor: palette.headerBg }]}
				>
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
									styles.iconRow,
								]}
							>
								<Text
									style={[
										active ? styles.chipLabelActive : styles.chipLabel,
										isAnyWinner && styles.chipLabelWinner,
									]}
								>
									{item.label}
								</Text>
								{isAnyWinner ? <Trophy size={12} color="#facc15" /> : null}
							</Pressable>
						);
					})}
				</ScrollView>

				{/* Main Benchmark Dashboard Panel */}
				<View style={[styles.panel, { backgroundColor: palette.bg }]}>
					{/* Current Engine Metadata */}
					<View style={styles.panelTopRow}>
						<Text
							style={[styles.panelLabel, { color: palette.text }]}
							numberOfLines={1}
							ellipsizeMode="tail"
						>
							{meta.label} · {meta.runtime}
						</Text>
						{resolveWinnerId === engine ? (
							<View
								style={[
									styles.benchPillWinner,
									styles.panelWinnerPill,
									styles.iconRow,
									{ paddingVertical: 2, paddingHorizontal: 6 },
								]}
							>
								<Trophy size={12} color="#ffffff" />
								<Text style={styles.benchPillTextWinner} numberOfLines={1}>
									Fastest Resolve
								</Text>
							</View>
						) : renderWinnerId === engine ? (
							<View
								style={[
									styles.benchPillWinner,
									styles.panelWinnerPill,
									styles.iconRow,
									{ paddingVertical: 2, paddingHorizontal: 6 },
								]}
							>
								<Trophy size={12} color="#ffffff" />
								<Text style={styles.benchPillTextWinner} numberOfLines={1}>
									Fastest Render
								</Text>
							</View>
						) : null}
					</View>
					<Text style={[styles.panelBody, { color: palette.textSecondary }]}>{meta.note}</Text>

					{/* Segmented Control for Views */}
					<View style={[styles.segmentedRow, { backgroundColor: palette.bg }]}>
						<Pressable
							style={[
								styles.segmentBtn,
								{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
								activeView === "resolve" && styles.segmentBtnActive,
							]}
							onPress={() => setActiveView("resolve")}
						>
							<View style={styles.segmentBtnRow}>
								<Zap
									size={13}
									color={activeView === "resolve" ? "#ffffff" : palette.textSecondary}
								/>
								<Text
									style={[
										styles.segmentBtnText,
										{ color: palette.textSecondary },
										activeView === "resolve" && styles.segmentBtnTextActive,
									]}
									numberOfLines={1}
									adjustsFontSizeToFit
									minimumFontScale={0.85}
								>
									Resolve Speed
								</Text>
							</View>
						</Pressable>
						<Pressable
							style={[
								styles.segmentBtn,
								{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
								activeView === "render" && styles.segmentBtnActive,
							]}
							onPress={() => setActiveView("render")}
						>
							<View style={styles.segmentBtnRow}>
								<Palette
									size={13}
									color={activeView === "render" ? "#ffffff" : palette.textSecondary}
								/>
								<Text
									style={[
										styles.segmentBtnText,
										{ color: palette.textSecondary },
										activeView === "render" && styles.segmentBtnTextActive,
									]}
									numberOfLines={1}
									adjustsFontSizeToFit
									minimumFontScale={0.85}
								>
									Rendering
								</Text>
							</View>
						</Pressable>
						<Pressable
							style={[
								styles.segmentBtn,
								{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
								activeView === "scorecard" && styles.segmentBtnActive,
							]}
							onPress={() => setActiveView("scorecard")}
						>
							<View style={styles.segmentBtnRow}>
								<BarChart3
									size={13}
									color={activeView === "scorecard" ? "#ffffff" : palette.textSecondary}
								/>
								<Text
									style={[
										styles.segmentBtnText,
										{ color: palette.textSecondary },
										activeView === "scorecard" && styles.segmentBtnTextActive,
									]}
									numberOfLines={1}
									adjustsFontSizeToFit
									minimumFontScale={0.85}
								>
									Scorecard
								</Text>
							</View>
						</Pressable>
						<Pressable
							style={[
								styles.segmentBtn,
								{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
								activeView === "animations" && styles.segmentBtnActive,
							]}
							onPress={() => setActiveView("animations")}
						>
							<View style={styles.segmentBtnRow}>
								<Sparkles
									size={13}
									color={activeView === "animations" ? "#ffffff" : palette.textSecondary}
								/>
								<Text
									style={[
										styles.segmentBtnText,
										{ color: palette.textSecondary },
										activeView === "animations" && styles.segmentBtnTextActive,
									]}
									numberOfLines={1}
									adjustsFontSizeToFit
									minimumFontScale={0.85}
								>
									Animations
								</Text>
							</View>
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
												<View style={styles.iconRowShrink}>
													<Text
														style={[
															isWinner ? styles.chartRowLabelWinner : styles.chartRowLabel,
															isWinner && { color: "#ffffff", fontWeight: "800" },
														]}
														numberOfLines={1}
														ellipsizeMode="tail"
													>
														{item.label}
													</Text>
													{isWinner ? <Trophy size={12} color="#facc15" /> : null}
												</View>
												<Text
													style={[styles.chartRowValue, isWinner && { color: "#ffffff" }]}
													numberOfLines={1}
												>
													{formatOps(ops)} ({formatMs(res?.totalMs)})
												</Text>
											</View>
											<View style={[styles.barTrack, isWinner && { backgroundColor: "#14532d" }]}>
												<View
													style={[
														isWinner
															? [styles.barFillWinner, { backgroundColor: "#ffffff" }]
															: styles.barFill,
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
								<View
									style={[
										styles.metricCard,
										{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
										resolveWinnerId === engine && styles.metricCardWinner,
									]}
								>
									<View style={styles.metricCardHeader}>
										<Text
											style={
												resolveWinnerId === engine
													? styles.metricCardTitleWinner
													: [styles.metricCardTitle, { color: palette.textSecondary }]
											}
										>
											Total Time
										</Text>
										{resolveWinnerId === engine ? <Trophy size={14} color="#facc15" /> : null}
									</View>
									<Text style={[styles.metricCardValue, { color: palette.text }]}>
										{formatMs(resolveResults[engine]?.totalMs)}
									</Text>
									<Text
										style={
											resolveWinnerId === engine
												? styles.metricCardSubWinner
												: [styles.metricCardSub, { color: palette.textSecondary }]
										}
									>
										for {iterations.toLocaleString()} resolves
									</Text>
								</View>

								<View
									style={[
										styles.metricCard,
										{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
										resolveWinnerId === engine && styles.metricCardWinner,
									]}
								>
									<View style={styles.metricCardHeader}>
										<Text
											style={
												resolveWinnerId === engine
													? styles.metricCardTitleWinner
													: [styles.metricCardTitle, { color: palette.textSecondary }]
											}
										>
											Speed
										</Text>
									</View>
									<Text style={[styles.metricCardValue, { color: palette.text }]}>
										{formatOps(resolveResults[engine]?.opsPerSec)}
									</Text>
									<Text
										style={
											resolveWinnerId === engine
												? styles.metricCardSubWinner
												: [styles.metricCardSub, { color: palette.textSecondary }]
										}
									>
										{formatPerOp(resolveResults[engine]?.usPerOp)}
									</Text>
								</View>
							</View>

							{resolveWinnerMeta ? (
								<View style={styles.winnerBanner}>
									<Trophy size={14} color="#facc15" />
									<Text style={styles.winnerBannerText}>
										Fastest Resolve: {resolveWinnerMeta.label} (
										{formatOps(resolveResults[resolveWinnerMeta.id]?.opsPerSec)})
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
								<View
									style={[
										styles.metricCard,
										{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
										renderWinnerId === engine && styles.metricCardWinner,
									]}
								>
									<View style={styles.metricCardHeader}>
										<Text
											style={
												renderWinnerId === engine
													? styles.metricCardTitleWinner
													: [styles.metricCardTitle, { color: palette.textSecondary }]
											}
										>
											Layout Paint
										</Text>
										{renderWinnerId === engine ? <Trophy size={14} color="#facc15" /> : null}
									</View>
									<Text style={[styles.metricCardValue, { color: palette.text }]}>
										{formatMs(renderMetrics[engine]?.paintMs)}
									</Text>
									<Text
										style={
											renderWinnerId === engine
												? styles.metricCardSubWinner
												: [styles.metricCardSub, { color: palette.textSecondary }]
										}
									>
										{renderMetrics[engine]?.paintMs
											? `${((renderMetrics[engine]?.paintMs ?? 0) / listCount).toFixed(2)} ms/row`
											: "Mount to onLayout"}
									</Text>
								</View>

								<View
									style={[
										styles.metricCard,
										{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
									]}
								>
									<View style={styles.metricCardHeader}>
										<Text style={[styles.metricCardTitle, { color: palette.textSecondary }]}>
											React Render
										</Text>
									</View>
									<Text style={[styles.metricCardValue, { color: palette.text }]}>
										{formatMs(renderMetrics[engine]?.actualDuration)}
									</Text>
									<Text style={[styles.metricCardSub, { color: palette.textSecondary }]}>
										base: {formatMs(renderMetrics[engine]?.baseDuration)}
									</Text>
								</View>

								<View
									style={[
										styles.metricCard,
										{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
									]}
								>
									<View style={styles.metricCardHeader}>
										<Text style={[styles.metricCardTitle, { color: palette.textSecondary }]}>
											Commits
										</Text>
									</View>
									<Text style={[styles.metricCardValue, { color: palette.text }]}>
										{renderMetrics[engine]?.renderCount ?? 0}×
									</Text>
									<Text style={[styles.metricCardSub, { color: palette.textSecondary }]}>
										Profiler updates
									</Text>
								</View>
							</View>

							{/* Relative Render Time Comparison */}
							<View
								style={[
									styles.chartContainer,
									{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
								]}
							>
								<View style={styles.chartTitleRow}>
									<Text style={[styles.chartTitle, { color: palette.text }]}>
										List Layout Paint ({listCount} rows)
									</Text>
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
												<View style={styles.iconRowShrink}>
													<Text
														style={[
															isWinner ? styles.chartRowLabelWinner : styles.chartRowLabel,
															isWinner
																? { color: "#ffffff", fontWeight: "800" }
																: { color: palette.textSecondary },
														]}
														numberOfLines={1}
														ellipsizeMode="tail"
													>
														{item.label}
													</Text>
													{isWinner ? <Trophy size={12} color="#facc15" /> : null}
												</View>
												<Text
													style={[
														styles.chartRowValue,
														isWinner ? { color: "#ffffff" } : { color: palette.text },
													]}
													numberOfLines={1}
												>
													{formatMs(paint)}
												</Text>
											</View>
											<View
												style={[
													styles.barTrack,
													{ backgroundColor: palette.chipBg },
													isWinner && { backgroundColor: "#14532d" },
												]}
											>
												<View
													style={[
														isWinner
															? [styles.barFillWinner, { backgroundColor: "#ffffff" }]
															: [styles.barFill, { backgroundColor: palette.accent }],
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
									<Trophy size={14} color="#facc15" />
									<Text style={styles.winnerBannerText}>
										Fastest List Rendering: {renderWinnerMeta.label} (
										{formatMs(renderMetrics[renderWinnerMeta.id]?.paintMs)})
									</Text>
								</View>
							) : null}
						</>
					) : null}

					{/* VIEW 3: HEAD-TO-HEAD SCORECARD */}
					{activeView === "scorecard" ? (
						<View
							style={[
								styles.chartContainer,
								{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
							]}
						>
							<View style={styles.chartTitleRow}>
								<Text style={[styles.chartTitle, { color: palette.text }]}>
									Engine Performance Scorecard
								</Text>
							</View>

							{ENGINES.map((item) => {
								const res = resolveResults[item.id];
								const ren = renderMetrics[item.id];
								const isResolveWinner = resolveWinnerId === item.id;
								const isRenderWinner = renderWinnerId === item.id;
								const isAnyWinner = isResolveWinner || isRenderWinner;
								const winnerTitle =
									isResolveWinner && isRenderWinner
										? "Overall Champion"
										: isResolveWinner
											? "Fastest Resolve"
											: isRenderWinner
												? "Fastest List Render"
												: null;

								return (
									<View
										key={item.id}
										style={[
											styles.chartRow,
											{
												backgroundColor: isAnyWinner ? "#16a34a" : palette.chipBg,
												padding: 10,
												borderRadius: 8,
												borderWidth: 1,
												borderColor: isAnyWinner ? "#4ade80" : palette.chipBorder,
											},
										]}
									>
										<View>
											<View style={styles.iconRow}>
												{isAnyWinner ? <Trophy size={13} color="#facc15" /> : null}
												<Text
													style={[
														isAnyWinner ? styles.chartRowLabelWinner : styles.chartRowLabel,
														isAnyWinner
															? { color: "#ffffff", fontWeight: "800", fontSize: 13 }
															: { color: palette.text },
													]}
													numberOfLines={1}
													ellipsizeMode="tail"
												>
													{item.label} {winnerTitle ? `(${winnerTitle})` : ""}
												</Text>
											</View>
											<Text
												style={
													isAnyWinner
														? styles.scorecardRuntimeWinner
														: [styles.scorecardRuntime, { color: palette.textSecondary }]
												}
												numberOfLines={1}
												ellipsizeMode="tail"
											>
												{item.runtime}
											</Text>
										</View>
										<View style={{ flexDirection: "row", justifyContent: "space-between" }}>
											<Text
												style={{
													color: isAnyWinner ? "#dcfce7" : palette.textSecondary,
													fontSize: 11,
												}}
											>
												Resolve:{" "}
												<Text
													style={{
														color: isAnyWinner ? "#ffffff" : palette.text,
														fontWeight: "700",
													}}
												>
													{formatMs(res?.totalMs)} ({formatOps(res?.opsPerSec)})
												</Text>
											</Text>
											<Text
												style={{
													color: isAnyWinner ? "#dcfce7" : palette.textSecondary,
													fontSize: 11,
												}}
											>
												Paint:{" "}
												<Text
													style={{
														color: isAnyWinner ? "#ffffff" : palette.text,
														fontWeight: "700",
													}}
												>
													{formatMs(ren?.paintMs)}
												</Text>
											</Text>
										</View>
									</View>
								);
							})}
						</View>
					) : null}

					{/* VIEW 4: ANIMATIONS & TRANSITIONS */}
					{activeView === "animations" ? (
						<View>
							{/* Theme Transitions Demo */}
							<View
								style={[
									styles.animContainer,
									{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
								]}
							>
								<Text style={[styles.animSectionTitle, { color: palette.accent }]}>
									Theme Transition Presets
								</Text>
								<Text style={[styles.animHeadline, { color: palette.text }]}>
									Animated Theme Transitions (Active:{" "}
									<Text style={{ color: palette.accent }}>{theme}</Text>)
								</Text>
								<Text style={[styles.animSubtext, { color: palette.textSecondary }]}>
									Select a preset, then tap any theme to trigger a smooth native overlay or web view
									transition.
								</Text>

								<Text
									style={[
										styles.subControlLabel,
										{ color: palette.textSecondary, marginBottom: 6 },
									]}
								>
									Transition Preset:
								</Text>
								<View style={styles.animChipRow}>
									{TRANSITION_PRESETS.map((p) => {
										const isSelected = selectedPreset === p.preset;
										return (
											<Pressable
												key={p.name}
												style={[
													styles.animChip,
													{ backgroundColor: palette.chipBg, borderColor: palette.chipBorder },
													isSelected && {
														backgroundColor: palette.accent,
														borderColor: palette.accent,
													},
												]}
												onPress={() => setSelectedPreset(p.preset)}
											>
												<Text
													style={[
														styles.animChipText,
														{ color: palette.textSecondary },
														isSelected && { color: "#ffffff", fontWeight: "700" },
													]}
												>
													{p.name}
												</Text>
											</Pressable>
										);
									})}
								</View>

								<Text
									style={[
										styles.subControlLabel,
										{ color: palette.textSecondary, marginBottom: 6 },
									]}
								>
									Switch Theme:
								</Text>
								<View style={styles.animChipRow}>
									{THEME_OPTIONS.map((t) => {
										const isActive = theme === t.id;
										return (
											<Pressable
												key={t.id}
												style={[
													styles.animThemeBtn,
													{ backgroundColor: palette.chipBg, borderColor: palette.chipBorder },
													isActive && {
														borderColor: palette.accent,
														backgroundColor: palette.cardBg,
													},
												]}
												onPress={() => setTheme(t.id, { preset: selectedPreset, duration: 400 })}
											>
												<View
													style={[
														styles.animColorDot,
														{
															backgroundColor: t.bg,
															borderColor: isActive ? palette.accent : "#64748b",
															borderWidth: isActive ? 2 : 1,
														},
													]}
												/>
												<Text style={[styles.animThemeBtnText, { color: palette.text }]}>
													{t.label}
												</Text>
											</Pressable>
										);
									})}
								</View>
							</View>

							{/* Reanimated ClassName Animations */}
							<View
								style={[
									styles.animContainer,
									{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
								]}
							>
								<Text style={[styles.animSectionTitle, { color: palette.accent }]}>
									Reanimated ClassName Animations
								</Text>
								<Text style={[styles.animHeadline, { color: palette.text }]}>
									Entering, Exiting & Layout Spring Transitions
								</Text>
								<Text style={[styles.animSubtext, { color: palette.textSecondary }]}>
									Parsed dynamically from className tokens (`uw-*` & `nw-*`) and attached to
									Reanimated components with spring physics.
								</Text>

								{/* Control Buttons */}
								<View style={[styles.controlsRow, { marginBottom: 10 }]}>
									<Pressable style={styles.btnAction} onPress={addAnimCard}>
										<Text style={styles.btnActionText}>+ Add Card</Text>
									</Pressable>
									<Pressable
										style={[
											styles.btnActionSecondary,
											{ backgroundColor: palette.chipBg, borderColor: palette.chipBorder },
										]}
										onPress={shuffleAnimCards}
									>
										<Text style={[styles.btnActionTextSecondary, { color: palette.text }]}>
											🔀 Reorder
										</Text>
									</Pressable>
									<Pressable
										style={[
											styles.btnActionSecondary,
											{
												backgroundColor: palette.chipBg,
												borderColor: palette.chipBorder,
												flex: 0.6,
											},
										]}
										onPress={() => setAnimCards(DEMO_CARDS)}
									>
										<Text style={[styles.btnActionTextSecondary, { color: palette.text }]}>
											Reset
										</Text>
									</Pressable>
								</View>

								{/* Animated Cards */}
								<View>
									{animCards.map((card) => (
										<AnimatedBox
											key={card.id}
											style={[{ backgroundColor: card.color }, styles.animItemRow]}
											className={card.className}
										>
											<View style={{ flex: 1, marginRight: 8 }}>
												<Text style={styles.animItemTitle}>{card.title}</Text>
												<Text style={styles.animItemSubtitle}>{card.tag}</Text>
											</View>
											<Pressable
												style={styles.animDeleteBtn}
												onPress={() => removeAnimCard(card.id)}
											>
												<Text style={styles.animDeleteBtnText}>✕</Text>
											</Pressable>
										</AnimatedBox>
									))}
								</View>
							</View>
						</View>
					) : null}

					{/* Primary Action Buttons */}
					<View style={styles.controlsRow}>
						<Pressable style={styles.btnAction} onPress={runFullSuite} disabled={isAutoTesting}>
							{isAutoTesting ? (
								<Loader2 size={14} color="#ffffff" />
							) : (
								<Rocket size={14} color="#ffffff" />
							)}
							<Text style={styles.btnActionText}>
								{isAutoTesting ? "Running..." : "Benchmark All"}
							</Text>
						</Pressable>
						<Pressable
							style={[
								styles.btnActionSecondary,
								{ backgroundColor: palette.chipBg, borderColor: palette.chipBorder },
							]}
							onPress={testRemount}
						>
							<RotateCw size={14} color={palette.textSecondary} />
							<Text style={[styles.btnActionTextSecondary, { color: palette.text }]}>
								Re-render Screen
							</Text>
						</Pressable>
					</View>

					{/* Config Selectors: Iterations & Row Count */}
					<View style={[styles.subControlRow, { borderTopColor: palette.cardBorder }]}>
						<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
							<Text style={[styles.subControlLabel, { color: palette.textSecondary }]}>
								Resolves:
							</Text>
							<View style={[styles.miniSelector, { backgroundColor: palette.bg }]}>
								{ITERATION_OPTIONS.map((val) => (
									<Pressable
										key={val}
										style={[
											styles.miniOption,
											iterations === val && { backgroundColor: palette.accent },
										]}
										onPress={() => setIterations(val)}
									>
										<Text
											style={
												iterations === val
													? styles.miniOptionTextActive
													: [styles.miniOptionText, { color: palette.textSecondary }]
											}
										>
											{val >= 1000 ? `${val / 1000}k` : val}
										</Text>
									</Pressable>
								))}
							</View>
						</View>

						<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
							<Text style={[styles.subControlLabel, { color: palette.textSecondary }]}>Rows:</Text>
							<View style={[styles.miniSelector, { backgroundColor: palette.bg }]}>
								{LIST_SIZES.map((val) => (
									<Pressable
										key={val}
										style={[
											styles.miniOption,
											listCount === val && { backgroundColor: palette.accent },
										]}
										onPress={() => {
											paintStart.current = now();
											setListCount(val);
										}}
									>
										<Text
											style={
												listCount === val
													? styles.miniOptionTextActive
													: [styles.miniOptionText, { color: palette.textSecondary }]
											}
										>
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
			</ScrollView>
		</SafeAreaView>
	);
}
