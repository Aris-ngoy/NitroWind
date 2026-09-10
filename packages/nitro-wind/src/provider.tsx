import {
	type ColorScheme,
	DEFAULT_STYLE_CONTEXT,
	type PlatformName,
	type StyleContext,
} from "nitro-wind-core";
import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";
import { Appearance, I18nManager, Platform, useWindowDimensions } from "react-native";
import { setEngineThemeName } from "./engine";

export interface GroupState {
	active: boolean;
	focus: boolean;
	hover: boolean;
}

export interface InteractionState {
	pressed: boolean;
	hovered: boolean;
	focused: boolean;
	disabled: boolean;
}

const DEFAULT_GROUP: GroupState = { active: false, focus: false, hover: false };
const DEFAULT_INTERACTION: InteractionState = {
	pressed: false,
	hovered: false,
	focused: false,
	disabled: false,
};

interface NitroWindContextValue {
	theme: ColorScheme;
	setTheme: (theme: ColorScheme) => void;
	group: GroupState;
	interaction: InteractionState;
	context: StyleContext;
}

const NitroWindContext = createContext<NitroWindContextValue | null>(null);

export interface NitroWindProviderProps {
	theme?: ColorScheme;
	children: ReactNode;
}

export function NitroWindProvider({ theme: themeProp, children }: NitroWindProviderProps) {
	const systemScheme = Appearance.getColorScheme() === "dark" ? "dark" : "light";
	const [themeState, setThemeState] = useState<ColorScheme>(themeProp ?? systemScheme);
	const theme = themeProp ?? themeState;
	const { width, height } = useWindowDimensions();

	const setTheme = useCallback((next: ColorScheme) => {
		setThemeState(next);
		setEngineThemeName(next);
	}, []);

	const context = useMemo<StyleContext>(
		() => ({
			...DEFAULT_STYLE_CONTEXT,
			colorScheme: theme,
			platform: Platform.OS as PlatformName,
			width,
			height,
			isRTL: I18nManager.isRTL,
		}),
		[theme, width, height],
	);

	const value = useMemo<NitroWindContextValue>(
		() => ({
			theme,
			setTheme,
			group: DEFAULT_GROUP,
			interaction: DEFAULT_INTERACTION,
			context,
		}),
		[theme, setTheme, context],
	);

	return <NitroWindContext.Provider value={value}>{children}</NitroWindContext.Provider>;
}

export function useNitroWind(): NitroWindContextValue {
	const value = useContext(NitroWindContext);
	if (!value) {
		const scheme = Appearance.getColorScheme() === "dark" ? "dark" : "light";
		return {
			theme: scheme,
			setTheme: () => {},
			group: DEFAULT_GROUP,
			interaction: DEFAULT_INTERACTION,
			context: {
				...DEFAULT_STYLE_CONTEXT,
				colorScheme: scheme,
				platform: Platform.OS as PlatformName,
			},
		};
	}
	return value;
}

export function GroupProvider({
	value,
	children,
}: {
	value: GroupState;
	children: ReactNode;
}) {
	const parent = useNitroWind();
	const next = useMemo(
		() => ({
			...parent,
			group: value,
			context: {
				...parent.context,
				groupActive: value.active,
				groupFocus: value.focus,
				groupHover: value.hover,
			},
		}),
		[parent, value],
	);
	return <NitroWindContext.Provider value={next}>{children}</NitroWindContext.Provider>;
}

export function InteractionProvider({
	value,
	children,
}: {
	value: Partial<InteractionState>;
	children: ReactNode;
}) {
	const parent = useNitroWind();
	const interaction = { ...parent.interaction, ...value };
	const next = {
		...parent,
		interaction,
		context: {
			...parent.context,
			pressed: interaction.pressed,
			hovered: interaction.hovered,
			focused: interaction.focused,
			disabled: interaction.disabled,
		},
	};
	return <NitroWindContext.Provider value={next}>{children}</NitroWindContext.Provider>;
}
