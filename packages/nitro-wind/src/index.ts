export { jsStyleEngine, parseClassName, parseAnimation } from "nitro-wind-core";
export type {
	StyleContext,
	StyleRecord,
	AnimationMeta,
	StyleResult,
	ColorScheme,
	PlatformName,
} from "nitro-wind-core";

export {
	AppearanceOverride,
	ThemeTransitionPreset,
	type ThemeTransitionOptions,
	type TransitionOrigin,
} from "./transitions";

export {
	computeStyle,
	computeStaticStyle,
	isNativeEngineAvailable,
	setEngineThemeName,
	clearEngineCache,
} from "./engine";

export {
	applyThemeTokens,
	loadTailwindConfig,
	loadTailwindCss,
	loadTailwindTheme,
	serializeThemePayload,
	type TailwindThemeConfig,
	type TailwindThemeSources,
	type ThemeTokenScale,
} from "./themeConfig";

export {
	NitroWindProvider,
	useNitroWind,
	useUniwind,
	GroupProvider,
	InteractionProvider,
	ScopedTheme,
	ScopedVariables,
	LayoutDirection,
	getActiveTheme,
	setActiveTheme,
	getHasAdaptiveThemes,
	setHasAdaptiveThemes,
	type GroupState,
	type InteractionState,
	type NitroWindContextValue,
} from "./provider";

export {
	ThemeTransitionOverlay,
	requestThemeTransition,
	resolveThemeBackground,
	isReanimatedAvailable,
	setGlobalTransitionHandler,
	getNativeThemeTransition,
	cancelActiveThemeTransition,
	setNativeThemeTransitionForTesting,
	type ActiveTransition,
	type NativeThemeTransitionApi,
} from "./transitions";

export { useStyle } from "./useStyle";
export { styled } from "./styled";
export {
	withNitroWind,
	withUniwind,
	useResolveClassNames,
	type PropMapping,
	type PropMappingConfig,
} from "./withNitroWind";

export {
	getAccentColor,
	useAccentColor,
	resolveAccentColorFromStyle,
	classToStyle,
	classToColor,
	isColorClassProperty,
	isClassProperty,
	isStyleProperty,
} from "./accents";

export {
	updateCSSVariables,
	getCSSVariable,
	useCSSVariable,
	subscribeCSSVariables,
	type CSSVariables,
	type CSSVariableValue,
	type VariableLookupContext,
} from "./variables";

export {
	StyledView,
	StyledText,
	StyledPressable,
	StyledImage,
	StyledImageBackground,
	StyledScrollView,
	StyledTextInput,
	StyledTouchableOpacity,
	StyledTouchableHighlight,
	StyledTouchableWithoutFeedback,
	StyledTouchableNativeFeedback,
	StyledFlatList,
	StyledSectionList,
	StyledVirtualizedList,
	StyledSwitch,
	StyledActivityIndicator,
	StyledButton,
	StyledRefreshControl,
	StyledKeyboardAvoidingView,
	StyledModal,
	StyledSafeAreaView,
	View,
	Text,
	Pressable,
	Image,
	ImageBackground,
	ScrollView,
	TextInput,
	TouchableOpacity,
	TouchableHighlight,
	TouchableWithoutFeedback,
	TouchableNativeFeedback,
	FlatList,
	SectionList,
	VirtualizedList,
	Switch,
	ActivityIndicator,
	Button,
	RefreshControl,
	KeyboardAvoidingView,
	Modal,
	SafeAreaView,
	type ViewProps,
	type TextProps,
	type ImageProps,
	type ImageBackgroundProps,
	type TextInputProps,
	type ScrollViewProps,
	type FlatListProps,
	type SectionListProps,
	type VirtualizedListProps,
	type SwitchProps,
	type ActivityIndicatorProps,
	type ButtonProps,
	type RefreshControlProps,
	type TouchableHighlightProps,
	type ModalProps,
} from "./components";

export {
	translateClassNameToReanimated,
	translateAnimation,
	translateTransition,
	useAnimatedClassName,
	getReanimated,
	parseReanimatedAnimations,
	buildReanimatedProps,
	getOrCreateAnimatedComponent,
	type ParsedReanimatedAnimations,
	type ReanimatedModifierConfig,
} from "./reanimated";

export { NitroWindShowcase, type NitroWindShowcaseProps } from "./showcase";

import type { ColorScheme, TailwindThemeConfig, ThemeTransitionOptions } from "nitro-wind-core";
import { getActiveTheme, getHasAdaptiveThemes, setActiveTheme } from "./provider";
import {
	applyThemeTokens,
	loadTailwindConfig,
	loadTailwindCss,
	loadTailwindTheme,
} from "./themeConfig";
import { getCSSVariable, updateCSSVariables } from "./variables";

export const NitroWind = {
	themes: ["light", "dark"],
	get currentTheme(): ColorScheme {
		return getActiveTheme();
	},
	get hasAdaptiveThemes(): boolean {
		return getHasAdaptiveThemes();
	},
	get colorScheme(): ColorScheme {
		return getActiveTheme();
	},
	setTheme(theme: ColorScheme, options?: ThemeTransitionOptions): void {
		setActiveTheme(theme, options);
	},
	getTheme(): ColorScheme {
		return getActiveTheme();
	},
	updateCSSVariables(theme: string, variables: Record<string, string | number>): void {
		updateCSSVariables(theme, variables);
	},
	loadTailwindConfig(config: TailwindThemeConfig): void {
		loadTailwindConfig(config);
	},
	loadTailwindCss(css: string): void {
		loadTailwindCss(css);
	},
	loadTailwindTheme: loadTailwindTheme,
	applyThemeTokens: applyThemeTokens,
	getCSSVariable(
		name: string | string[],
	): string | number | undefined | (string | number | undefined)[] {
		return Array.isArray(name) ? getCSSVariable(name) : getCSSVariable(name);
	},
};

export const Uniwind = NitroWind;
