import { type ImageStyle, StyleSheet, type TextStyle, type ViewStyle } from "react-native";

export const LIST_SIZE = 120;
export const RESOLVE_ITERATIONS = 2_000;

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
	chipLabel: "text-slate-300 font-bold",
	chipLabelActive: "text-white font-bold",
} as const;

export const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: "#020617",
	},
	header: {
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 12,
		backgroundColor: "#020617",
	},
	title: {
		color: "#ffffff",
		fontSize: 24,
		fontWeight: "700",
	},
	subtitle: {
		color: "#94a3b8",
		marginTop: 4,
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
	chip: {
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginRight: 8,
		marginBottom: 8,
		backgroundColor: "#1e293b",
	},
	chipActive: {
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginRight: 8,
		marginBottom: 8,
		backgroundColor: "#0ea5e9",
	},
	chipLabel: {
		color: "#cbd5e1",
		fontWeight: "700",
	},
	chipLabelActive: {
		color: "#ffffff",
		fontWeight: "700",
	},
	panel: {
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#1e293b",
		backgroundColor: "#0f172a",
	},
	panelLabel: {
		color: "#38bdf8",
		fontWeight: "700",
		marginBottom: 4,
	},
	panelBody: {
		color: "#94a3b8",
		lineHeight: 20,
	},
	metric: {
		color: "#ffffff",
		fontWeight: "700",
		marginTop: 8,
	},
	tabs: {
		flexDirection: "row",
		flexWrap: "wrap",
		paddingHorizontal: 20,
		paddingTop: 8,
		backgroundColor: "#020617",
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
