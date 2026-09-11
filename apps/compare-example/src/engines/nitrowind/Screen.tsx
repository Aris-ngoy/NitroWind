import { Text, View } from "nitro-wind";
import { memo } from "react";
import { FlatList } from "react-native";
import { CATALOG_ITEMS, type CatalogItem } from "../../catalog";

function Row({ item }: { item: CatalogItem }) {
	return (
		<View className="flex-row items-center px-4 py-3 border-b border-slate-800 bg-slate-900">
			<View className="w-10 h-10 rounded-full bg-sky-500" />
			<Text className="text-white font-bold ml-3 flex-1">{item.title}</Text>
			<Text className="text-slate-400">{item.subtitle}</Text>
		</View>
	);
}

const RenderRow = memo(Row);

export function NitrowindScreen({
	onLayout,
	items = CATALOG_ITEMS,
}: {
	onLayout?: () => void;
	items?: CatalogItem[];
}) {
	return (
		<View className="flex-1 bg-slate-950">
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
