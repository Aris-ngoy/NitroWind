import { classNameIsContextFree } from "nitro-wind-core";
import { type ComponentType, forwardRef, useCallback, useState } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { computeStyle } from "./engine";
import { GroupProvider, type GroupState, InteractionProvider } from "./provider";
import { useAnimatedClassName } from "./reanimated";
import { useStyle } from "./useStyle";

type ClassNameProps = {
	className?: string;
	style?: StyleProp<ViewStyle>;
};

function needsInteractiveRuntime(className?: string): boolean {
	if (!className) return false;
	return (
		className.includes("active:") ||
		className.includes("hover:") ||
		className.includes("focus:") ||
		className.includes("disabled:") ||
		className.includes("group-") ||
		/(?:^|\s)group(?:\s|$)/.test(className) ||
		className.includes("animate-") ||
		className.includes("transition")
	);
}

export function styled<P extends object>(Component: ComponentType<P>) {
	const ContextFreeStyled = forwardRef<unknown, P & ClassNameProps>((props, ref) => {
		const { className, style, ...rest } = props;
		const resolved = computeStyle(className!);
		const mergedStyle = style != null ? [resolved.style, style] : resolved.style;
		return <Component {...(rest as P)} ref={ref} style={mergedStyle} />;
	});

	const DynamicStyled = forwardRef<unknown, P & ClassNameProps>((props, ref) => {
		const { className, style, ...rest } = props;
		const resolved = useStyle(className);
		const mergedStyle = style != null ? [resolved.style, style] : resolved.style;
		return <Component {...(rest as P)} ref={ref} style={mergedStyle} />;
	});

	const InteractiveStyled = forwardRef<unknown, P & ClassNameProps>((props, ref) => {
		const { className, style, ...rest } = props;
		const [interaction, setInteraction] = useState({
			pressed: false,
			hovered: false,
			focused: false,
			disabled: Boolean((rest as { disabled?: boolean }).disabled),
		});
		const resolved = useStyle(className, interaction);
		const animatedStyle = useAnimatedClassName(
			resolved.animation,
			resolved.style as ViewStyle | undefined,
		);
		const mergedStyle =
			style != null ? [animatedStyle ?? resolved.style, style] : (animatedStyle ?? resolved.style);

		const onPressIn = useCallback(() => setInteraction((prev) => ({ ...prev, pressed: true })), []);
		const onPressOut = useCallback(
			() => setInteraction((prev) => ({ ...prev, pressed: false })),
			[],
		);
		const onHoverIn = useCallback(() => setInteraction((prev) => ({ ...prev, hovered: true })), []);
		const onHoverOut = useCallback(
			() => setInteraction((prev) => ({ ...prev, hovered: false })),
			[],
		);
		const onFocus = useCallback(() => setInteraction((prev) => ({ ...prev, focused: true })), []);
		const onBlur = useCallback(() => setInteraction((prev) => ({ ...prev, focused: false })), []);

		const element = (
			<InteractionProvider value={interaction}>
				<Component
					{...(rest as P)}
					ref={ref}
					style={mergedStyle}
					onPressIn={onPressIn}
					onPressOut={onPressOut}
					onHoverIn={onHoverIn}
					onHoverOut={onHoverOut}
					onFocus={onFocus}
					onBlur={onBlur}
				/>
			</InteractionProvider>
		);

		if (!className || !/(?:^|\s)group(?:\s|$)/.test(className)) {
			return element;
		}

		const group: GroupState = {
			active: interaction.pressed,
			hover: interaction.hovered,
			focus: interaction.focused,
		};

		return <GroupProvider value={group}>{element}</GroupProvider>;
	});

	const StyledComponent = forwardRef<unknown, P & ClassNameProps>((props, ref) => {
		const className = props.className;
		if (!className) {
			const { style, ...rest } = props;
			return <Component {...(rest as P)} ref={ref} style={style} />;
		}
		if (needsInteractiveRuntime(className)) {
			return <InteractiveStyled {...props} ref={ref} />;
		}
		if (classNameIsContextFree(className)) {
			return <ContextFreeStyled {...props} ref={ref} />;
		}
		return <DynamicStyled {...props} ref={ref} />;
	});

	ContextFreeStyled.displayName = `NitroWindStatic(${Component.displayName ?? Component.name ?? "Component"})`;
	DynamicStyled.displayName = `NitroWindDynamic(${Component.displayName ?? Component.name ?? "Component"})`;
	InteractiveStyled.displayName = `NitroWindInteractive(${Component.displayName ?? Component.name ?? "Component"})`;
	StyledComponent.displayName = `NitroWind(${Component.displayName ?? Component.name ?? "Component"})`;
	return StyledComponent;
}

export const StyledPressable = styled(Pressable);
