import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { Nitrowind } from "react-native-nitrowind";

export default function App() {
	const [result, setResult] = useState<number | null>(null);

	const calculateSum = () => {
		try {
			const sum = Nitrowind.sum(50, 25);
			setResult(sum);
		} catch (error) {
			console.error("Error invoking Nitrowind.sum:", error);
		}
	};

	return (
		<View style={styles.container}>
			<StatusBar style="light" />
			<View style={styles.card}>
				<Text style={styles.badge}>EXPO EXAMPLE</Text>
				<Text style={styles.title}>NitroWind Expo App</Text>
				<Text style={styles.subtitle}>Powered by Nitro Modules with fast native bindings</Text>

				<View style={styles.buttonContainer}>
					<Button title="Test Nitrowind.sum(50, 25)" onPress={calculateSum} color="#0284c7" />
				</View>

				{result !== null && (
					<View style={styles.resultContainer}>
						<Text style={styles.resultLabel}>Native Return Value:</Text>
						<Text style={styles.resultText}>{result}</Text>
					</View>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#090d16",
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	card: {
		width: "100%",
		maxWidth: 420,
		backgroundColor: "#131b2e",
		borderRadius: 20,
		padding: 24,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#1e293b",
	},
	badge: {
		fontSize: 11,
		fontWeight: "700",
		color: "#38bdf8",
		letterSpacing: 1.2,
		marginBottom: 8,
	},
	title: {
		fontSize: 22,
		fontWeight: "700",
		color: "#ffffff",
		marginBottom: 6,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 14,
		color: "#94a3b8",
		textAlign: "center",
		marginBottom: 24,
	},
	buttonContainer: {
		width: "100%",
		marginVertical: 10,
	},
	resultContainer: {
		marginTop: 20,
		padding: 16,
		backgroundColor: "#1e293b",
		borderRadius: 12,
		alignItems: "center",
		width: "100%",
	},
	resultLabel: {
		fontSize: 12,
		color: "#94a3b8",
		marginBottom: 4,
	},
	resultText: {
		fontSize: 32,
		fontWeight: "800",
		color: "#38bdf8",
	},
});
