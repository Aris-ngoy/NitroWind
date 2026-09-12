import type { ComponentPropsWithoutRef } from "react";
import {
	ActivityIndicator as RNActivityIndicator,
	Button as RNButton,
	FlatList as RNFlatList,
	Image as RNImage,
	ImageBackground as RNImageBackground,
	KeyboardAvoidingView as RNKeyboardAvoidingView,
	Modal as RNModal,
	Pressable as RNPressable,
	RefreshControl as RNRefreshControl,
	SafeAreaView as RNSafeAreaView,
	ScrollView as RNScrollView,
	SectionList as RNSectionList,
	Switch as RNSwitch,
	Text as RNText,
	TextInput as RNTextInput,
	TouchableHighlight as RNTouchableHighlight,
	TouchableNativeFeedback as RNTouchableNativeFeedback,
	TouchableOpacity as RNTouchableOpacity,
	TouchableWithoutFeedback as RNTouchableWithoutFeedback,
	View as RNView,
	VirtualizedList as RNVirtualizedList,
} from "react-native";
import { styled } from "./styled";

export interface ViewProps extends ComponentPropsWithoutRef<typeof RNView> {
	className?: string;
}

export interface TextProps extends ComponentPropsWithoutRef<typeof RNText> {
	className?: string;
}

export interface ImageProps extends ComponentPropsWithoutRef<typeof RNImage> {
	className?: string;
	tintColorClassName?: string;
}

export interface ImageBackgroundProps extends ComponentPropsWithoutRef<typeof RNImageBackground> {
	className?: string;
	imageClassName?: string;
}

export interface TextInputProps extends ComponentPropsWithoutRef<typeof RNTextInput> {
	className?: string;
	placeholderTextColorClassName?: string;
	cursorColorClassName?: string;
	selectionColorClassName?: string;
	selectionHandleColorClassName?: string;
	underlineColorAndroidClassName?: string;
}

export interface ScrollViewProps extends ComponentPropsWithoutRef<typeof RNScrollView> {
	className?: string;
	contentContainerClassName?: string;
	endFillColorClassName?: string;
}

export interface FlatListProps<ItemT> extends ComponentPropsWithoutRef<typeof RNFlatList<ItemT>> {
	className?: string;
	contentContainerClassName?: string;
	columnWrapperClassName?: string;
	ListHeaderComponentClassName?: string;
	ListFooterComponentClassName?: string;
	endFillColorClassName?: string;
}

export interface SectionListProps<ItemT, SectionT = unknown>
	extends ComponentPropsWithoutRef<typeof RNSectionList<ItemT, SectionT>> {
	className?: string;
	contentContainerClassName?: string;
	ListHeaderComponentClassName?: string;
	ListFooterComponentClassName?: string;
	endFillColorClassName?: string;
}

export interface VirtualizedListProps<ItemT>
	extends ComponentPropsWithoutRef<typeof RNVirtualizedList<ItemT>> {
	className?: string;
	contentContainerClassName?: string;
	ListHeaderComponentClassName?: string;
	ListFooterComponentClassName?: string;
	endFillColorClassName?: string;
}

export interface SwitchProps extends ComponentPropsWithoutRef<typeof RNSwitch> {
	className?: string;
	trackColorOnClassName?: string;
	trackColorOffClassName?: string;
	thumbColorClassName?: string;
	ios_backgroundColorClassName?: string;
}

export interface ActivityIndicatorProps
	extends ComponentPropsWithoutRef<typeof RNActivityIndicator> {
	className?: string;
	colorClassName?: string;
}

export interface ButtonProps extends ComponentPropsWithoutRef<typeof RNButton> {
	className?: string;
	colorClassName?: string;
}

export interface RefreshControlProps extends ComponentPropsWithoutRef<typeof RNRefreshControl> {
	className?: string;
	colorsClassName?: string;
	tintColorClassName?: string;
	titleColorClassName?: string;
	progressBackgroundColorClassName?: string;
}

export interface TouchableHighlightProps
	extends ComponentPropsWithoutRef<typeof RNTouchableHighlight> {
	className?: string;
	underlayColorClassName?: string;
}

export interface ModalProps extends ComponentPropsWithoutRef<typeof RNModal> {
	className?: string;
	backdropColorClassName?: string;
}

export const StyledView = styled(RNView);
export const StyledText = styled(RNText);
export const StyledPressable = styled(RNPressable);
export const StyledImage = styled(RNImage);
export const StyledImageBackground = styled(RNImageBackground);
export const StyledScrollView = styled(RNScrollView);
export const StyledTextInput = styled(RNTextInput);
export const StyledTouchableOpacity = styled(RNTouchableOpacity);
export const StyledTouchableHighlight = styled(RNTouchableHighlight);
export const StyledTouchableWithoutFeedback = styled(RNTouchableWithoutFeedback);
export const StyledTouchableNativeFeedback = styled(RNTouchableNativeFeedback);
export const StyledFlatList = styled(RNFlatList);
export const StyledSectionList = styled(RNSectionList);
export const StyledVirtualizedList = styled(RNVirtualizedList);
export const StyledSwitch = styled(RNSwitch);
export const StyledActivityIndicator = styled(RNActivityIndicator);
export const StyledButton = styled(RNButton);
export const StyledRefreshControl = styled(RNRefreshControl);
export const StyledKeyboardAvoidingView = styled(RNKeyboardAvoidingView);
export const StyledModal = styled(RNModal);
export const StyledSafeAreaView = styled(RNSafeAreaView);

export {
	StyledView as View,
	StyledText as Text,
	StyledPressable as Pressable,
	StyledImage as Image,
	StyledImageBackground as ImageBackground,
	StyledScrollView as ScrollView,
	StyledTextInput as TextInput,
	StyledTouchableOpacity as TouchableOpacity,
	StyledTouchableHighlight as TouchableHighlight,
	StyledTouchableWithoutFeedback as TouchableWithoutFeedback,
	StyledTouchableNativeFeedback as TouchableNativeFeedback,
	StyledFlatList as FlatList,
	StyledSectionList as SectionList,
	StyledVirtualizedList as VirtualizedList,
	StyledSwitch as Switch,
	StyledActivityIndicator as ActivityIndicator,
	StyledButton as Button,
	StyledRefreshControl as RefreshControl,
	StyledKeyboardAvoidingView as KeyboardAvoidingView,
	StyledModal as Modal,
	StyledSafeAreaView as SafeAreaView,
};
