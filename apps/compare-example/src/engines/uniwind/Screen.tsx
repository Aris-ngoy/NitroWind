import { memo } from "react";
import { FlatList, Text, type TextStyle, View, type ViewStyle } from "react-native";
import { useResolveClassNames } from "uniwind";
import { CATALOG_ITEMS, type CatalogItem, classes } from "../../catalog";
import { mergeResolvedStyle, uniwindFallback } from "./resolve";

function useUniwindStyle<T extends ViewStyle | TextStyle>(className: string, fallback: T) {
	const resolved = useResolveClassNames(className);
	return mergeResolvedStyle(resolved, fallback);
}

function Row({ item }: { item: CatalogItem }) {
	const rowStyle = useUniwindStyle(classes.row, uniwindFallback.row);
	const avatarStyle = useUniwindStyle(classes.avatar, uniwindFallback.avatar);
	const nameStyle = useUniwindStyle(classes.name, uniwindFallback.name);
	const metaStyle = useUniwindStyle(classes.meta, uniwindFallback.meta);

	return (
		<View className={classes.row} style={rowStyle}>
			<View className={classes.avatar} style={avatarStyle} />
			<Text className={classes.name} style={nameStyle}>
				{item.title}
			</Text>
			<Text className={classes.meta} style={metaStyle}>
				{item.subtitle}
			</Text>
		</View>
	);
}

const RenderRow = memo(Row);

export function UniwindScreen({
	onLayout,
	items = CATALOG_ITEMS,
}: {
	onLayout?: () => void;
	items?: CatalogItem[];
}) {
	const screenStyle = useUniwindStyle(classes.screen, uniwindFallback.screen);
	return (
		<View className={classes.screen} style={screenStyle}>
			<FlatList
				data={items}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => <RenderRow item={item} />}
				initialNumToRender={items.length}
				ListFooterComponent={<View style={{ height: 1 }} onLayout={onLayout} />}
				scrollEnabled={false}
			/>
		</View>
	);
}
