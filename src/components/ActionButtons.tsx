import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

interface ActionButtonsProps {
	onExpensePress: () => void;
	onIncomePress: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
	onExpensePress,
	onIncomePress,
}) => {
	return (
		<View style={styles.container}>
			<TouchableOpacity
				style={[styles.button, styles.expenseButton]}
				onPress={onExpensePress}
			>
				<Text style={styles.buttonIcon}>−</Text>
				<Text style={styles.buttonText}>Expense</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={[styles.button, styles.incomeButton]}
				onPress={onIncomePress}
			>
				<Text style={styles.buttonIcon}>+</Text>
				<Text style={styles.buttonText}>Income</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		padding: 16,
		gap: 12,
	},
	button: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 14,
		borderRadius: 12,
		gap: 8,
	},
	expenseButton: {
		backgroundColor: "rgba(233, 69, 96, 0.2)",
		borderWidth: 1,
		borderColor: "#e94560",
	},
	incomeButton: {
		backgroundColor: "rgba(76, 175, 80, 0.2)",
		borderWidth: 1,
		borderColor: "#4CAF50",
	},
	buttonIcon: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#ffffff",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#ffffff",
	},
});

export default ActionButtons;
