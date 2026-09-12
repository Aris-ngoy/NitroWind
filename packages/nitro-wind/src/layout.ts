import { Dimensions } from "react-native";

export interface WindowSize {
	width: number;
	height: number;
}

let snapshot: WindowSize = readWindowSize();

function readWindowSize(): WindowSize {
	try {
		const { width, height } = Dimensions.get("window");
		return { width, height };
	} catch {
		return { width: 390, height: 844 };
	}
}

try {
	Dimensions.addEventListener("change", ({ window }) => {
		if (window && (snapshot.width !== window.width || snapshot.height !== window.height)) {
			snapshot = { width: window.width, height: window.height };
		}
	});
} catch {
	// Fallback for mock environments
}

function getWindowSize(): WindowSize {
	return snapshot;
}

export function subscribeWindowSize(onStoreChange: () => void): () => void {
	try {
		const sub = Dimensions.addEventListener("change", ({ window }) => {
			if (window && (snapshot.width !== window.width || snapshot.height !== window.height)) {
				snapshot = { width: window.width, height: window.height };
				onStoreChange();
			}
		});
		return () => sub.remove();
	} catch {
		return () => {};
	}
}

export { getWindowSize };
