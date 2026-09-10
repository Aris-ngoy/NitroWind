import { memo } from "react";
import { FlatList, Text, View } from "react-native";
import { CATALOG_ITEMS, type CatalogItem, styles } from "../../catalog";

function Row({ item }: { item: CatalogItem }) {
	return (
		<View style={styles.row}>
			<View style={styles.avatar} />
			<Text style={styles.name}>{item.title}</Text>
			<Text style={styles.meta}>{item.subtitle}</Text>
		</View>
	);
}

const RenderRow = memo(Row);

export function StylesheetScreen({ onLayout }: { onLayout: () => void }) {
	return (
		<View style={styles.screen} onLayout={onLayout}>
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
