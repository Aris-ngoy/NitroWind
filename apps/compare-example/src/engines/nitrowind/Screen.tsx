import { Text, View } from "nitro-wind";
import { memo } from "react";
import { FlatList } from "react-native";
import { CATALOG_ITEMS, type CatalogItem, classes } from "../../catalog";

function Row({ item }: { item: CatalogItem }) {
	return (
		<View className={classes.row}>
			<View className={classes.avatar} />
			<Text className={classes.name}>{item.title}</Text>
			<Text className={classes.meta}>{item.subtitle}</Text>
		</View>
	);
}

const RenderRow = memo(Row);

export function NitrowindScreen({ onLayout }: { onLayout: () => void }) {
	return (
		<View className={classes.screen} onLayout={onLayout}>
			<FlatList
				data={CATALOG_ITEMS}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => <RenderRow item={item} />}
				initialNumToRender={40}
				windowSize={8}
			/>
		</View>
	);
}
