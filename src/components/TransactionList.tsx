import React, { useCallback } from "react";
import {
	StyleSheet,
	View,
	Text,
	SectionList,
	RefreshControl,
	ListRenderItem,
} from "react-native";

import { Transaction } from "../types";
import TransactionItem from "./TransactionItem";

interface TransactionSection {
	title: string;
	data: Transaction[];
}

interface TransactionListProps {
	sections: TransactionSection[];
	refreshing: boolean;
	onRefresh: () => void;
	onTransactionPress: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
	sections,
	refreshing,
	onRefresh,
	onTransactionPress,
}) => {
	const renderItem: ListRenderItem<Transaction> = useCallback(
		({ item }) => (
			<TransactionItem item={item} onPress={() => onTransactionPress(item)} />
		),
		[onTransactionPress]
	);

	const renderSectionHeader = useCallback(
		({ section: { title } }: { section: TransactionSection }) => {
			const today = new Date();
			const todayKey = `${today.getFullYear()}-${String(
				today.getMonth() + 1
			).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

			if (title === todayKey) {
				return null;
			}

			return (
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionHeaderText}>
						{new Date(title).toLocaleDateString("fi-FI", {
							weekday: "long",
							day: "numeric",
							month: "long",
						})}
					</Text>
				</View>
			);
		},
		[]
	);

	return (
		<SectionList
			sections={sections}
			keyExtractor={(item) => item.id}
			renderItem={renderItem}
			renderSectionHeader={renderSectionHeader}
			contentContainerStyle={styles.listContent}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					tintColor="#e94560"
					colors={["#e94560"]}
				/>
			}
			stickySectionHeadersEnabled={false}
		/>
	);
};

const styles = StyleSheet.create({
	listContent: {
		padding: 16,
		paddingBottom: 32,
	},
	sectionHeader: {
		paddingVertical: 8,
		paddingHorizontal: 4,
		marginTop: 8,
		marginBottom: 4,
	},
	sectionHeaderText: {
		color: "#a0a0a0",
		fontSize: 14,
		fontWeight: "600",
		textTransform: "capitalize",
	},
});
