import { StatusBar } from "expo-status-bar";
import { NitroWindProvider } from "nitro-wind";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import CompareApp from "./src/CompareApp";

export default function App() {
	return (
		<SafeAreaProvider>
			<NitroWindProvider>
				<StatusBar style="light" />
				<CompareApp />
			</NitroWindProvider>
		</SafeAreaProvider>
	);
}
