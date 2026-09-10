import { computeStyle } from "nitro-wind";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { now, timeSync } from "./bench";
import { LIST_SIZE, RESOLVE_ITERATIONS, classes, styles } from "./catalog";
import { ENGINES, type EngineId } from "./engines";
import { NativewindScreen } from "./engines/nativewind/Screen";
import { NitrowindScreen } from "./engines/nitrowind/Screen";
import { StylesheetScreen } from "./engines/stylesheet/Screen";
import { UniwindScreen } from "./engines/uniwind/Screen";
import { resolveUniwindSync } from "./engines/uniwind/resolve";

function formatMs(value: number | null): string {
	if (value == null) return "—";
	return `${value.toFixed(2)} ms`;
}

export default function CompareApp() {
	const [engine, setEngine] = useState<EngineId>("nitrowind");
	const [listMs, setListMs] = useState<Partial<Record<EngineId, number>>>({});
	const [resolveMs, setResolveMs] = useState<Partial<Record<EngineId, number>>>({});
	const paintStart = useRef(now());

	const meta = useMemo(() => ENGINES.find((item) => item.id === engine) ?? ENGINES[1], [engine]);

	const selectEngine = useCallback((next: EngineId) => {
		paintStart.current = now();
		setEngine(next);
	}, []);

	const onListLayout = useCallback(() => {
		const elapsed = now() - paintStart.current;
		setListMs((prev) => (prev[engine] == null ? { ...prev, [engine]: elapsed } : prev));
	}, [engine]);

	const runResolveBench = useCallback(() => {
		setResolveMs({
			stylesheet: timeSync(RESOLVE_ITERATIONS, () => {
				void styles.row;
			}),
			nitrowind: timeSync(RESOLVE_ITERATIONS, () => {
				computeStyle(classes.row);
			}),
			nativewind: timeSync(RESOLVE_ITERATIONS, () => {
				void styles.row;
			}),
			uniwind: timeSync(RESOLVE_ITERATIONS, () => {
				void (resolveUniwindSync(classes.row) ?? styles.row);
			}),
		});
	}, []);

	return (
		<SafeAreaView style={styles.screen}>
			<View style={styles.header}>
				<Text style={styles.subtitle}>COMPARE EXAMPLE</Text>
				<Text style={styles.title}>Style engines</Text>
				<Text style={styles.subtitle}>
					Same {LIST_SIZE}-row list and {RESOLVE_ITERATIONS.toLocaleString()}-iteration resolve
					bench across StyleSheet, nitro-wind, NativeWind, and Uniwind.
				</Text>
			</View>

			<View style={styles.tabs}>
				{ENGINES.map((item) => {
					const active = item.id === engine;
					return (
						<Pressable
							key={item.id}
							onPress={() => selectEngine(item.id)}
							style={active ? styles.chipActive : styles.chip}
						>
							<Text style={active ? styles.chipLabelActive : styles.chipLabel}>{item.label}</Text>
						</Pressable>
					);
				})}
			</View>

			<View style={styles.panel}>
				<Text style={styles.panelLabel}>{meta?.runtime}</Text>
				<Text style={styles.panelBody}>{meta?.note}</Text>
				<Text style={styles.metric}>
					List paint ({meta?.label}): {formatMs(listMs[engine] ?? null)}
				</Text>
				<Text style={styles.metric}>
					Resolve {RESOLVE_ITERATIONS.toLocaleString()}× — StyleSheet{" "}
					{formatMs(resolveMs.stylesheet ?? null)}
					{" · "}nitro-wind {formatMs(resolveMs.nitrowind ?? null)}
					{" · "}NativeWind {formatMs(resolveMs.nativewind ?? null)}
					{" · "}Uniwind {formatMs(resolveMs.uniwind ?? null)}
				</Text>
				<Pressable
					onPress={runResolveBench}
					style={[styles.chipActive, { marginTop: 12, marginRight: 0 }]}
				>
					<Text style={styles.chipLabelActive}>Run resolve bench</Text>
				</Pressable>
			</View>

			{engine === "stylesheet" ? <StylesheetScreen onLayout={onListLayout} /> : null}
			{engine === "nitrowind" ? <NitrowindScreen onLayout={onListLayout} /> : null}
			{engine === "nativewind" ? <NativewindScreen onLayout={onListLayout} /> : null}
			{engine === "uniwind" ? <UniwindScreen onLayout={onListLayout} /> : null}
		</SafeAreaView>
	);
}
