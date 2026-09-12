import { StatusBar } from "expo-status-bar";
import { NitroWindProvider, NitroWindShowcase } from "nitro-wind";
import React from "react";

export default function App() {
	return (
		<NitroWindProvider>
			<StatusBar style="light" />
			<NitroWindShowcase
				badge="EXPO EXAMPLE"
				subtitle="Tailwind utilities on React Native with a C++ engine and JS fallback for Expo Go."
			/>
		</NitroWindProvider>
	);
}
