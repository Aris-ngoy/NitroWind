import { memo } from "react";
import { FlatList, Text, View } from "react-native";
import { CATALOG_ITEMS, type CatalogItem, classes, styles } from "../../catalog";

function Row({ item }: { item: CatalogItem }) {
	return (
		<View className={classes.row} style={styles.row}>
			<View className={classes.avatar} style={styles.avatar} />
			<Text className={classes.name} style={styles.name}>
				{item.title}
			</Text>
			<Text className={classes.meta} style={styles.meta}>
				{item.subtitle}
			</Text>
		</View>
	);
}

const RenderRow = memo(Row);

export function NativewindScreen({ onLayout }: { onLayout: () => void }) {
	return (
		<View className={classes.screen} style={styles.screen} onLayout={onLayout}>
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
