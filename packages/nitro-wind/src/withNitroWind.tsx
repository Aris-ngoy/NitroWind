import type { ComponentProps, ComponentType } from "react";
import { resolveAccentColorFromStyle } from "./accents";
import { computeStyle } from "./engine";
import { styled } from "./styled";
import { useStyle } from "./useStyle";

export type PropMappingConfig = {
	fromClassName: string;
	styleProperty?: string;
};

export type PropMapping = Record<string, PropMappingConfig>;

export function withNitroWind<P extends object>(
	Component: ComponentType<P>,
	mapping?: PropMapping,
): ComponentType<P & Record<string, unknown>> {
	if (!mapping) {
		return styled(Component) as unknown as ComponentType<P & Record<string, unknown>>;
	}

	const Styled = styled(Component);

	const MappedComponent = (props: P & Record<string, unknown>) => {
		const generatedProps: Record<string, unknown> = {};
		const remainingProps: Record<string, unknown> = { ...props };

		for (const [targetProp, config] of Object.entries(mapping)) {
			const className = props[config.fromClassName] as string | undefined;
			if (typeof className !== "string" || !className.trim()) continue;

			// If user explicitly provided the target prop, don't overwrite
			if (props[targetProp] !== undefined) continue;

			const resolved = computeStyle(className);
			const style = resolved.style as Record<string, unknown> | undefined;

			if (config.styleProperty) {
				const val = style?.[config.styleProperty];
				generatedProps[targetProp] = val;
			} else if (targetProp.toLowerCase().includes("color")) {
				generatedProps[targetProp] = resolveAccentColorFromStyle(style);
			} else {
				generatedProps[targetProp] = style;
			}

			delete remainingProps[config.fromClassName];
		}

		return (
			<Styled {...({ ...remainingProps, ...generatedProps } as ComponentProps<typeof Styled>)} />
		);
	};

	MappedComponent.displayName = `withNitroWind(${Component.displayName ?? Component.name ?? "Component"})`;
	return MappedComponent;
}

export const withUniwind = withNitroWind;

export function useResolveClassNames(className?: string): Record<string, unknown> | undefined {
	const resolved = useStyle(className);
	return resolved.style as Record<string, unknown> | undefined;
}
