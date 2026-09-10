import { NitroWindProvider, NitroWindShowcase } from "nitro-wind";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

function App() {
	return (
		<SafeAreaProvider>
			<NitroWindProvider>
				<NitroWindShowcase
					badge="BARE EXAMPLE"
					subtitle="Native C++ style engine via Nitro Modules on React Native 0.86."
				/>
			</NitroWindProvider>
		</SafeAreaProvider>
	);
}

export default App;
