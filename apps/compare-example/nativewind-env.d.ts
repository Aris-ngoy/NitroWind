import "react-native";

declare module "*.css";

declare module "react-native" {
	interface ViewProps {
		className?: string;
	}
	interface TextProps {
		className?: string;
	}
	interface PressableProps {
		className?: string;
	}
}
