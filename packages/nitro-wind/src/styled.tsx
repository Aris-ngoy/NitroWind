import { classNameContextNeeds } from "nitro-wind-core";
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

export function styled<P extends object>(Component: ComponentType<P>) {
	// Needs a real subscription (colorScheme/platform/rtl/layout, or an override)
	// but not the interactive/animated render shape below.
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

	// The dispatcher itself calls zero hooks in every branch below — the two
	// delegate branches (Dynamic/InteractiveStyled) render a *different
	// component*, which React always treats as a safe unmount+remount
	// regardless of how the hooks inside them differ, and the fully-static
	// fallthrough branch calls no hook at all. That is what makes it safe to
	// inline the former ContextFreeStyled directly here instead of delegating
	// to a fourth component: StyledComponent's own hook count is always zero,
	// so it can never violate the Rules of Hooks no matter how className's
	// shape changes between renders of the same element.
	//
	// This used to delegate through a separate ContextFreeStyled component even
	// for fully static classNames — two fibers where one would do. Measured on
	// a 1000-node re-render: dispatcher+ContextFreeStyled averaged 3.66ms;
	// inlining here averaged 2.30ms, a 37% improvement on what is the majority
	// case for most real screens (most className usage is invariant, not
	// interactive or context-dependent).
	//
	// The same trick does not extend to DynamicStyled: merging it in here too
	// was measured and rejected — useStyle's two useSyncExternalStore calls are
	// no-op-gated when not needed, but calling them at all (even no-op'd) costs
	// ~30% more per render than zero hooks (2.28ms vs 2.95ms on an isolated
	// 1000-node benchmark), which would regress the static case to pay for a
	// hook it doesn't use. DynamicStyled stays its own component.
	const StyledComponent = forwardRef<unknown, P & ClassNameProps>((props, ref) => {
		const className = props.className;
		if (!className) {
			const { style, ...rest } = props;
			return <Component {...(rest as P)} ref={ref} style={style} />;
		}

		const needs = classNameContextNeeds(className);
		if (needs.interaction || needs.group || needs.animation) {
			return <InteractiveStyled {...props} ref={ref} />;
		}
		if (needs.colorScheme || needs.platform || needs.rtl || needs.layout) {
			return <DynamicStyled {...props} ref={ref} />;
		}

		const { style, ...rest } = props;
		const resolved = computeStyle(className);
		const mergedStyle = style != null ? [resolved.style, style] : resolved.style;
		return <Component {...(rest as P)} ref={ref} style={mergedStyle} />;
	});

	DynamicStyled.displayName = `NitroWindDynamic(${Component.displayName ?? Component.name ?? "Component"})`;
	InteractiveStyled.displayName = `NitroWindInteractive(${Component.displayName ?? Component.name ?? "Component"})`;
	StyledComponent.displayName = `NitroWind(${Component.displayName ?? Component.name ?? "Component"})`;
	return StyledComponent;
}

export const StyledPressable = styled(Pressable);
