import type { StyleRecord } from "./types";

export function inflateStyle(flat: StyleRecord): Record<string, unknown> {
	const { shadowOffsetWidth, shadowOffsetHeight, translateX, translateY, scale, rotate, ...rest } =
		flat;
	const style: Record<string, unknown> = { ...rest };

	if (shadowOffsetWidth !== undefined || shadowOffsetHeight !== undefined) {
		style.shadowOffset = {
			width: Number(shadowOffsetWidth ?? 0),
			height: Number(shadowOffsetHeight ?? 0),
		};
	}

	const transforms: Record<string, unknown>[] = [];
	if (translateX !== undefined) transforms.push({ translateX });
	if (translateY !== undefined) transforms.push({ translateY });
	if (scale !== undefined) transforms.push({ scale });
	if (rotate !== undefined) transforms.push({ rotate });
	if (transforms.length > 0) {
		style.transform = transforms;
	}

	return style;
}

export function mergeStyles(
	...styles: Array<Record<string, unknown> | undefined | null | false>
): Array<Record<string, unknown> | undefined> {
	return styles.filter((style): style is Record<string, unknown> => Boolean(style));
}
