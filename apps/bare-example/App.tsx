import React, { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { Nitrowind } from "react-native-nitrowind";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

function App() {
	const [result, setResult] = useState<number | null>(null);

	const calculateSum = () => {
		try {
			const sum = Nitrowind.sum(12, 30);
			setResult(sum);
		} catch (error) {
			console.error("Error invoking Nitrowind.sum:", error);
		}
	};

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.container}>
				<View style={styles.card}>
					<Text style={styles.title}>NitroWind Bare Example</Text>
					<Text style={styles.subtitle}>Fast native code powered by Nitro Modules</Text>

					<View style={styles.actionContainer}>
						<Button title="Test Nitrowind.sum(12, 30)" onPress={calculateSum} />
					</View>

					{result !== null && (
						<View style={styles.resultBox}>
							<Text style={styles.resultLabel}>Result from Native:</Text>
							<Text style={styles.resultValue}>{result}</Text>
						</View>
					)}
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#0f172a",
		padding: 24,
	},
	card: {
		width: "100%",
		maxWidth: 420,
		backgroundColor: "#1e293b",
		borderRadius: 16,
		padding: 24,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#f8fafc",
		marginBottom: 8,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 14,
		color: "#94a3b8",
		textAlign: "center",
		marginBottom: 24,
	},
	actionContainer: {
		width: "100%",
		marginVertical: 12,
	},
	resultBox: {
		marginTop: 20,
		padding: 16,
		backgroundColor: "#334155",
		borderRadius: 12,
		alignItems: "center",
		width: "100%",
	},
	resultLabel: {
		fontSize: 13,
		color: "#cbd5e1",
		marginBottom: 4,
	},
	resultValue: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#38bdf8",
	},
});

export default App;
