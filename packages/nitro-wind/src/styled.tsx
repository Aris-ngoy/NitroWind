import { type StyleContext, classNameContextNeeds } from "nitro-wind-core";
import { type ComponentType, forwardRef, useCallback, useState } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import {
	classToColor,
	classToStyle,
	isClassProperty,
	isColorClassProperty,
	resolveAccentColorFromStyle,
} from "./accents";
import { computeStyle } from "./engine";
import { GroupProvider, type GroupState, InteractionProvider, useNitroWindStore } from "./provider";
import {
	buildReanimatedProps,
	getOrCreateAnimatedComponent,
	useAnimatedClassName,
} from "./reanimated";
import { useStyle } from "./useStyle";

type ClassNameProps = {
	className?: string;
	style?: StyleProp<ViewStyle>;
	entering?: unknown;
	exiting?: unknown;
	layout?: unknown;
	[key: string]: unknown;
};

function resolveExtraProps(
	props: Record<string, unknown>,
	context?: Partial<StyleContext>,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};

	for (const key in props) {
		if (!key.endsWith("ClassName") || key === "className") continue;
		const val = props[key];
		if (typeof val !== "string" || !val.trim()) continue;

		if (key === "trackColorOnClassName") {
			const resolved = computeStyle(val, context);
			const color = resolveAccentColorFromStyle(resolved.style);
			if (color) {
				const existing = (out.trackColor ?? props.trackColor) as
					| Record<string, unknown>
					| undefined;
				out.trackColor = { ...existing, true: color };
			}
			continue;
		}
		if (key === "trackColorOffClassName") {
			const resolved = computeStyle(val, context);
			const color = resolveAccentColorFromStyle(resolved.style);
			if (color) {
				const existing = (out.trackColor ?? props.trackColor) as
					| Record<string, unknown>
					| undefined;
				out.trackColor = { ...existing, false: color };
			}
			continue;
		}

		if (key === "colorsClassName") {
			if (props.colors === undefined) {
				const resolved = computeStyle(val, context);
				const color = resolveAccentColorFromStyle(resolved.style);
				if (color) {
					out.colors = [color];
				}
			}
			continue;
		}

		if (key === "endFillColorClassName") {
			if (props.endFillColor === undefined) {
				const resolved = computeStyle(val, context);
				const color = resolveAccentColorFromStyle(resolved.style);
				if (color) {
					out.endFillColor = color;
				}
			}
			continue;
		}

		if (isColorClassProperty(key)) {
			const targetProp = classToColor(key);
			if (props[targetProp] === undefined) {
				const resolved = computeStyle(val, context);
				const color = resolveAccentColorFromStyle(resolved.style);
				if (color !== undefined) {
					out[targetProp] = color;
				}
			}
			continue;
		}

		if (isClassProperty(key)) {
			const targetProp = classToStyle(key);
			const resolved = computeStyle(val, context);
			if (resolved.style) {
				const existing = props[targetProp];
				out[targetProp] = existing != null ? [resolved.style, existing] : resolved.style;
			}
		}
	}

	return out;
}

function computeContextNeedsForProps(props: Record<string, unknown>) {
	let interaction = false;
	let env = false;

	for (const key in props) {
		if (key === "className" || key.endsWith("ClassName")) {
			const val = props[key];
			if (typeof val === "string" && val.trim()) {
				const needs = classNameContextNeeds(val);
				if (needs.interaction || needs.group || needs.animation) {
					interaction = true;
				}
				if (needs.colorScheme || needs.platform || needs.rtl || needs.layout) {
					env = true;
				}
			}
		}
	}

	return { interaction, env };
}

function resolveTargetAndAnimationProps<P extends object>(
	Component: ComponentType<P>,
	className: string | undefined,
	props: { entering?: unknown; exiting?: unknown; layout?: unknown },
) {
	const reanimatedProps = buildReanimatedProps(className);
	const entering = props.entering ?? reanimatedProps.entering;
	const exiting = props.exiting ?? reanimatedProps.exiting;
	const layout = props.layout ?? reanimatedProps.layout;
	const hasAnimations = entering != null || exiting != null || layout != null;
	const Target = hasAnimations ? getOrCreateAnimatedComponent(Component) : Component;
	const animProps = hasAnimations
		? {
				...(entering != null ? { entering } : null),
				...(exiting != null ? { exiting } : null),
				...(layout != null ? { layout } : null),
			}
		: null;

	return { Target, animProps };
}

export function styled<P extends object>(Component: ComponentType<P>) {
	const DynamicStyled = forwardRef<unknown, P & ClassNameProps>((props, ref) => {
		const { className, style, entering, exiting, layout, ...rest } = props;
		const classStr = typeof className === "string" ? className : undefined;
		const resolved = useStyle(classStr);
		const mergedStyle = style != null ? [resolved.style, style] : resolved.style;
		const env = useNitroWindStore().get();
		const extraProps = resolveExtraProps(rest as Record<string, unknown>, env.context);
		const { Target, animProps } = resolveTargetAndAnimationProps(Component, classStr, {
			entering,
			exiting,
			layout,
		});
		return <Target {...(rest as P)} {...extraProps} ref={ref} style={mergedStyle} {...animProps} />;
	});

	const InteractiveStyled = forwardRef<unknown, P & ClassNameProps>((props, ref) => {
		const { className, style, entering, exiting, layout, ...rest } = props;
		const classStr = typeof className === "string" ? className : undefined;
		const [interaction, setInteraction] = useState({
			pressed: false,
			hovered: false,
			focused: false,
			disabled: Boolean((rest as { disabled?: boolean }).disabled),
		});
		const resolved = useStyle(classStr, interaction);
		const animatedStyle = useAnimatedClassName(
			resolved.animation,
			resolved.style as ViewStyle | undefined,
		);
		const mergedStyle =
			style != null ? [animatedStyle ?? resolved.style, style] : (animatedStyle ?? resolved.style);

		const env = useNitroWindStore().get();
		const extraProps = resolveExtraProps(rest as Record<string, unknown>, {
			...env.context,
			...interaction,
		});

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

		const { Target, animProps } = resolveTargetAndAnimationProps(Component, classStr, {
			entering,
			exiting,
			layout,
		});

		const element = (
			<InteractionProvider value={interaction}>
				<Target
					{...(rest as P)}
					{...extraProps}
					ref={ref}
					style={mergedStyle}
					onPressIn={onPressIn}
					onPressOut={onPressOut}
					onHoverIn={onHoverIn}
					onHoverOut={onHoverOut}
					onFocus={onFocus}
					onBlur={onBlur}
					{...animProps}
				/>
			</InteractionProvider>
		);

		if (!classStr || !/(?:^|\s)group(?:\s|$)/.test(classStr)) {
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
		const classStr = typeof className === "string" ? className : undefined;
		const needs = computeContextNeedsForProps(props);

		if (needs.interaction) {
			return <InteractiveStyled {...props} ref={ref} />;
		}
		if (needs.env) {
			return <DynamicStyled {...props} ref={ref} />;
		}

		const { style, entering, exiting, layout, ...rest } = props;
		const extraProps = resolveExtraProps(rest as Record<string, unknown>);
		const resolved = classStr ? computeStyle(classStr) : { style: undefined };
		const mergedStyle =
			style != null ? (resolved.style != null ? [resolved.style, style] : style) : resolved.style;
		const { Target, animProps } = resolveTargetAndAnimationProps(Component, classStr, {
			entering,
			exiting,
			layout,
		});
		return <Target {...(rest as P)} {...extraProps} ref={ref} style={mergedStyle} {...animProps} />;
	});

	DynamicStyled.displayName = `NitroWindDynamic(${Component.displayName ?? Component.name ?? "Component"})`;
	InteractiveStyled.displayName = `NitroWindInteractive(${Component.displayName ?? Component.name ?? "Component"})`;
	StyledComponent.displayName = `NitroWind(${Component.displayName ?? Component.name ?? "Component"})`;
	return StyledComponent;
}

export const StyledPressable = styled(Pressable);
