import { type ComponentType, forwardRef, useCallback, useMemo, useState } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { GroupProvider, type GroupState, InteractionProvider } from "./provider";
import { useAnimatedClassName } from "./reanimated";
import { useStyle } from "./useStyle";

type ClassNameProps = {
	className?: string;
	style?: StyleProp<ViewStyle>;
};

function hasGroupClass(className?: string): boolean {
	if (!className) return false;
	return className.split(/\s+/).includes("group");
}

export function styled<P extends object>(Component: ComponentType<P>) {
	const StyledComponent = forwardRef<unknown, P & ClassNameProps>((props, ref) => {
		const { className, style, ...rest } = props;
		const [interaction, setInteraction] = useState({
			pressed: false,
			hovered: false,
			focused: false,
			disabled: Boolean((rest as { disabled?: boolean }).disabled),
		});
		const resolved = useStyle(className, interaction);
		const animatedStyle = useAnimatedClassName(className, resolved.style as ViewStyle | undefined);
		const mergedStyle = useMemo(
			() => [animatedStyle ?? resolved.style, style],
			[animatedStyle, resolved.style, style],
		);

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

		if (!hasGroupClass(className)) {
			return element;
		}

		const group: GroupState = {
			active: interaction.pressed,
			hover: interaction.hovered,
			focus: interaction.focused,
		};

		return <GroupProvider value={group}>{element}</GroupProvider>;
	});

	StyledComponent.displayName = `NitroWind(${Component.displayName ?? Component.name ?? "Component"})`;
	return StyledComponent;
}

export const StyledPressable = styled(Pressable);
