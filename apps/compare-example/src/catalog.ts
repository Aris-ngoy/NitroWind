import { type ImageStyle, StyleSheet, type TextStyle, type ViewStyle } from "react-native";

export const LIST_SIZE = 120;
export const RESOLVE_ITERATIONS = 2_000;

export const LIST_SIZES = [50, 120, 240] as const;
export const ITERATION_OPTIONS = [500, 2_000, 10_000] as const;

export const classes = {
	screen: "flex-1 bg-slate-950",
	header: "px-5 pt-4 pb-3 bg-slate-950",
	title: "text-white text-2xl font-bold",
	subtitle: "text-slate-400 mt-1",
	row: "flex-row items-center px-4 py-3 border-b border-slate-800 bg-slate-900",
	avatar: "w-10 h-10 rounded-full bg-sky-500",
	name: "text-white font-bold ml-3 flex-1",
	meta: "text-slate-400",
	chip: "rounded-full px-3 py-2 mr-2 mb-2 bg-slate-800",
	chipActive: "rounded-full px-3 py-2 mr-2 mb-2 bg-sky-500",
	chipWinner: "rounded-full px-3 py-2 mr-2 mb-2 bg-green-700",
	chipWinnerActive: "rounded-full px-3 py-2 mr-2 mb-2 bg-green-600 border border-green-400",
	chipLabel: "text-slate-300 font-bold",
	chipLabelActive: "text-white font-bold",
	chipLabelWinner: "text-white font-bold",
	benchSection: "mt-2.5",
	benchSectionTitle: "text-slate-400 text-xs font-bold uppercase tracking-wide mb-1.5",
	benchPillRow: "flex-row flex-wrap",
	benchPill: "flex-row items-center px-2.5 py-1.5 rounded-lg bg-slate-800 mr-2 mb-1.5",
	benchPillCurrent: "border border-sky-400",
	benchPillWinner: "flex-row items-center px-2.5 py-1.5 rounded-lg bg-green-600 mr-2 mb-1.5",
	benchPillText: "text-slate-300 text-xs font-semibold",
	benchPillTextWinner: "text-white text-xs font-bold",
	winnerBanner: "flex-row items-center bg-green-600 rounded-lg px-3 py-2 mt-2.5",
	winnerBannerText: "text-white font-bold text-sm",
} as const;

export const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: "#020617",
	},
	header: {
		paddingHorizontal: 20,
		paddingTop: 14,
		paddingBottom: 10,
		backgroundColor: "#020617",
	},
	title: {
		color: "#ffffff",
		fontSize: 22,
		fontWeight: "800",
		letterSpacing: -0.5,
	},
	subtitle: {
		color: "#94a3b8",
		fontSize: 13,
		marginTop: 3,
		lineHeight: 18,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#1e293b",
		backgroundColor: "#0f172a",
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#0ea5e9",
	},
	name: {
		color: "#ffffff",
		fontWeight: "700",
		marginLeft: 12,
		flex: 1,
	},
	meta: {
		color: "#94a3b8",
	},
	tabs: {
		flexDirection: "row",
		paddingHorizontal: 20,
		paddingTop: 6,
		paddingBottom: 4,
		backgroundColor: "#020617",
	},
	chip: {
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 7,
		marginRight: 8,
		backgroundColor: "#1e293b",
	},
	chipActive: {
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 7,
		marginRight: 8,
		backgroundColor: "#0ea5e9",
	},
	chipWinner: {
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 7,
		marginRight: 8,
		backgroundColor: "#15803d",
	},
	chipWinnerActive: {
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 7,
		marginRight: 8,
		backgroundColor: "#16a34a",
		borderWidth: 1.5,
		borderColor: "#4ade80",
	},
	chipLabel: {
		color: "#cbd5e1",
		fontSize: 13,
		fontWeight: "700",
	},
	chipLabelActive: {
		color: "#ffffff",
		fontSize: 13,
		fontWeight: "700",
	},
	chipLabelWinner: {
		color: "#ffffff",
		fontSize: 13,
		fontWeight: "700",
	},
	panel: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#1e293b",
		backgroundColor: "#0f172a",
	},
	panelTopRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 4,
	},
	panelLabel: {
		color: "#38bdf8",
		fontWeight: "700",
		fontSize: 13,
		flexShrink: 1,
	},
	panelWinnerPill: {
		flexShrink: 0,
		marginLeft: 8,
	},
	iconRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	iconRowShrink: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		flexShrink: 1,
	},
	panelBody: {
		color: "#94a3b8",
		lineHeight: 18,
		fontSize: 12,
		marginBottom: 8,
	},

	// Segmented View Switcher
	segmentedRow: {
		flexDirection: "row",
		backgroundColor: "#020617",
		borderRadius: 10,
		padding: 3,
		marginBottom: 10,
	},
	segmentBtn: {
		flex: 1,
		paddingVertical: 6,
		alignItems: "center",
		borderRadius: 8,
	},
	segmentBtnRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 5,
	},
	segmentBtnActive: {
		backgroundColor: "#1e293b",
	},
	segmentBtnText: {
		color: "#64748b",
		fontSize: 12,
		fontWeight: "600",
	},
	segmentBtnTextActive: {
		color: "#ffffff",
		fontWeight: "700",
	},

	// Metric Cards & Grids
	metricsGrid: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 10,
	},
	metricCard: {
		flex: 1,
		backgroundColor: "#1e293b",
		borderRadius: 10,
		padding: 10,
		borderWidth: 1,
		borderColor: "#334155",
	},
	metricCardWinner: {
		backgroundColor: "#16a34a",
		borderColor: "#4ade80",
	},
	metricCardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 4,
	},
	metricCardTitle: {
		color: "#94a3b8",
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
	},
	metricCardTitleWinner: {
		color: "#ffffff",
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
	},
	metricCardValue: {
		color: "#ffffff",
		fontSize: 16,
		fontWeight: "800",
	},
	metricCardSub: {
		color: "#64748b",
		fontSize: 10,
		marginTop: 2,
	},
	metricCardSubWinner: {
		color: "#dcfce7",
		fontSize: 10,
		marginTop: 2,
	},

	// Relative Comparison Bar Chart
	chartContainer: {
		backgroundColor: "#020617",
		borderRadius: 10,
		padding: 10,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#1e293b",
	},
	chartTitleRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	chartTitle: {
		color: "#cbd5e1",
		fontSize: 12,
		fontWeight: "700",
	},
	chartRow: {
		marginBottom: 8,
	},
	chartRowHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 3,
	},
	chartRowLabel: {
		color: "#94a3b8",
		fontSize: 11,
		fontWeight: "600",
		flexShrink: 1,
	},
	chartRowLabelWinner: {
		color: "#4ade80",
		fontSize: 11,
		fontWeight: "700",
		flexShrink: 1,
	},
	chartRowValue: {
		color: "#ffffff",
		fontSize: 11,
		fontWeight: "700",
		flexShrink: 0,
		marginLeft: 8,
	},
	scorecardRuntime: {
		color: "#94a3b8",
		fontSize: 10,
		fontWeight: "600",
		marginBottom: 4,
	},
	scorecardRuntimeWinner: {
		color: "#dcfce7",
		fontSize: 10,
		fontWeight: "600",
		marginBottom: 4,
	},
	barTrack: {
		height: 8,
		backgroundColor: "#1e293b",
		borderRadius: 4,
		overflow: "hidden",
	},
	barFill: {
		height: "100%",
		backgroundColor: "#38bdf8",
		borderRadius: 4,
	},
	barFillWinner: {
		height: "100%",
		backgroundColor: "#16a34a",
		borderRadius: 4,
	},

	// Pills & Banners
	benchSection: {
		marginTop: 8,
	},
	benchSectionTitle: {
		color: "#94a3b8",
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 6,
	},
	benchPillRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
	},
	benchPill: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 9,
		paddingVertical: 5,
		borderRadius: 7,
		backgroundColor: "#1e293b",
	},
	benchPillCurrent: {
		borderWidth: 1,
		borderColor: "#38bdf8",
	},
	benchPillWinner: {
		backgroundColor: "#16a34a",
	},
	benchPillText: {
		color: "#cbd5e1",
		fontSize: 11,
		fontWeight: "600",
	},
	benchPillTextWinner: {
		color: "#ffffff",
		fontWeight: "700",
	},
	winnerBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#16a34a",
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginTop: 6,
		marginBottom: 4,
	},
	winnerBannerText: {
		color: "#ffffff",
		fontWeight: "700",
		fontSize: 12,
	},

	// Controls & Action Buttons
	controlsRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 6,
	},
	btnAction: {
		flex: 1,
		flexDirection: "row",
		backgroundColor: "#0ea5e9",
		borderRadius: 8,
		paddingVertical: 9,
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
	},
	btnActionSecondary: {
		flex: 1,
		flexDirection: "row",
		backgroundColor: "#1e293b",
		borderRadius: 8,
		paddingVertical: 9,
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		borderWidth: 1,
		borderColor: "#334155",
	},
	btnActionText: {
		color: "#ffffff",
		fontWeight: "700",
		fontSize: 12,
	},
	btnActionTextSecondary: {
		color: "#cbd5e1",
		fontWeight: "700",
		fontSize: 12,
	},
	subControlRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: 8,
		paddingTop: 8,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: "#1e293b",
	},
	subControlLabel: {
		color: "#64748b",
		fontSize: 11,
		fontWeight: "600",
	},
	miniSelector: {
		flexDirection: "row",
		backgroundColor: "#020617",
		borderRadius: 6,
		padding: 2,
	},
	miniOption: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 4,
	},
	miniOptionActive: {
		backgroundColor: "#334155",
	},
	miniOptionText: {
		color: "#64748b",
		fontSize: 10,
		fontWeight: "600",
	},
	miniOptionTextActive: {
		color: "#ffffff",
		fontWeight: "700",
	},

	// Animation & Transition Demo styles
	animContainer: {
		backgroundColor: "#020617",
		borderRadius: 10,
		padding: 12,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#1e293b",
	},
	animSectionTitle: {
		color: "#38bdf8",
		fontSize: 11,
		fontWeight: "800",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 4,
	},
	animHeadline: {
		color: "#ffffff",
		fontSize: 13,
		fontWeight: "700",
		marginBottom: 4,
	},
	animSubtext: {
		color: "#94a3b8",
		fontSize: 11,
		marginBottom: 8,
		lineHeight: 15,
	},
	animChipRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
		marginBottom: 8,
	},
	animChip: {
		backgroundColor: "#1e293b",
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 5,
		borderWidth: 1,
		borderColor: "#334155",
	},
	animChipActive: {
		backgroundColor: "#0284c7",
		borderColor: "#38bdf8",
	},
	animChipText: {
		color: "#94a3b8",
		fontSize: 10,
		fontWeight: "600",
	},
	animChipTextActive: {
		color: "#ffffff",
		fontWeight: "700",
	},
	animThemeBtn: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#0f172a",
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderWidth: 1,
		borderColor: "#334155",
		gap: 6,
	},
	animThemeBtnActive: {
		borderColor: "#38bdf8",
		backgroundColor: "#1e293b",
	},
	animColorDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		borderWidth: 1,
		borderColor: "#64748b",
	},
	animThemeBtnText: {
		color: "#ffffff",
		fontSize: 11,
		fontWeight: "700",
	},
	animItemRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 10,
		borderRadius: 8,
		marginBottom: 6,
	},
	animItemTitle: {
		color: "#ffffff",
		fontSize: 12,
		fontWeight: "700",
	},
	animItemSubtitle: {
		color: "rgba(255,255,255,0.75)",
		fontSize: 9,
		fontFamily: "monospace",
		marginTop: 2,
	},
	animDeleteBtn: {
		backgroundColor: "rgba(0,0,0,0.25)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
	},
	animDeleteBtnText: {
		color: "#ffffff",
		fontSize: 11,
		fontWeight: "700",
	},
});

export type CatalogStyle = ViewStyle | TextStyle | ImageStyle;

export interface CatalogItem {
	id: string;
	title: string;
	subtitle: string;
}

export function createItems(count = LIST_SIZE): CatalogItem[] {
	const labels = ["Inbox", "Design", "Bench"] as const;
	return Array.from({ length: count }, (_, index) => ({
		id: String(index),
		title: `Row ${index + 1}`,
		subtitle: labels[index % labels.length] ?? "Inbox",
	}));
}

export const CATALOG_ITEMS = createItems();

export interface ThemePalette {
	bg: string;
	cardBg: string;
	cardBorder: string;
	headerBg: string;
	text: string;
	textSecondary: string;
	chipBg: string;
	chipBorder: string;
	accent: string;
}

export const THEME_PALETTES: Record<string, ThemePalette> = {
	dark: {
		bg: "#09090b",
		cardBg: "#18181b",
		cardBorder: "#27272a",
		headerBg: "#09090b",
		text: "#fafafa",
		textSecondary: "#a1a1aa",
		chipBg: "#27272a",
		chipBorder: "#3f3f46",
		accent: "#38bdf8",
	},
	light: {
		bg: "#f8fafc",
		cardBg: "#ffffff",
		cardBorder: "#e2e8f0",
		headerBg: "#ffffff",
		text: "#0f172a",
		textSecondary: "#64748b",
		chipBg: "#f1f5f9",
		chipBorder: "#cbd5e1",
		accent: "#0284c7",
	},
	coffee: {
		bg: "#1f1610",
		cardBg: "#2d2017",
		cardBorder: "#443022",
		headerBg: "#1f1610",
		text: "#fef3c7",
		textSecondary: "#d6c2a8",
		chipBg: "#3a2a1e",
		chipBorder: "#533d2c",
		accent: "#f59e0b",
	},
	emerald: {
		bg: "#022c22",
		cardBg: "#064e3b",
		cardBorder: "#065f46",
		headerBg: "#022c22",
		text: "#ecfdf5",
		textSecondary: "#a7f3d0",
		chipBg: "#065f46",
		chipBorder: "#047857",
		accent: "#10b981",
	},
	ocean: {
		bg: "#082f49",
		cardBg: "#0c4a6e",
		cardBorder: "#075985",
		headerBg: "#082f49",
		text: "#f0f9ff",
		textSecondary: "#bae6fd",
		chipBg: "#075985",
		chipBorder: "#0369a1",
		accent: "#38bdf8",
	},
};
