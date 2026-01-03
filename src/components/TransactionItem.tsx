import React, { memo } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Transaction, TRANSACTION_TYPES } from "../types";
import { formatDate } from "../budget";

interface TransactionStyle {
	icon: string;
	color: string;
	sign: string;
}

// Get transaction icon and color
const getTransactionStyle = (type: string): TransactionStyle => {
	switch (type) {
		case TRANSACTION_TYPES.INCOME:
			return { icon: "💰", color: "#4CAF50", sign: "+" };
		case TRANSACTION_TYPES.AUTO_PAYMENT:
			return { icon: "💳", color: "#e94560", sign: "-" };
		case TRANSACTION_TYPES.EXPENSE:
		default:
			return { icon: "🛒", color: "#e94560", sign: "-" };
	}
};

// Format currency
const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat("fi-FI", {
		style: "currency",
		currency: "EUR",
	}).format(Math.abs(amount));
};

interface TransactionItemProps {
	item: Transaction;
	onPress: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = memo(
	({ item, onPress }) => {
		const style = getTransactionStyle(item.type);

		return (
			<TouchableOpacity
				style={styles.container}
				onPress={onPress}
				activeOpacity={0.7}
			>
				<View style={styles.left}>
					<Text style={styles.icon}>{style.icon}</Text>
					<View style={styles.info}>
						<Text style={styles.description}>{item.description}</Text>
						<Text style={styles.date}>{formatDate(item.timestamp)}</Text>
					</View>
				</View>
				<Text style={[styles.amount, { color: style.color }]}>
					{style.sign}
					{formatCurrency(item.amount)}
				</Text>
			</TouchableOpacity>
		);
	}
);

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#16213e",
		borderRadius: 16,
		padding: 16,
		marginBottom: 10,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	left: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	icon: {
		fontSize: 24,
		marginRight: 12,
	},
	info: {
		flex: 1,
	},
	description: {
		fontSize: 16,
		fontWeight: "600",
		color: "#ffffff",
		marginBottom: 2,
	},
	date: {
		fontSize: 13,
		color: "#a0a0a0",
	},
	amount: {
		fontSize: 18,
		fontWeight: "bold",
	},
});

export default TransactionItem;
