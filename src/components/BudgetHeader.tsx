import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { BudgetStatus, AppSettings } from "../types";
import { formatCurrency } from "../utils/formatCurrency";

interface BudgetHeaderProps {
	budgetStatus: BudgetStatus | null;
	settings: AppSettings;
	onSettingsPress: () => void;
}

const BudgetHeader: React.FC<BudgetHeaderProps> = ({
	budgetStatus,
	settings,
	onSettingsPress,
}) => {
	const isPositive = budgetStatus?.availableBudget
		? budgetStatus.availableBudget >= 0
		: true;

	const format = (amount: number) =>
		formatCurrency(amount, settings.currency, settings.locale);

	return (
		<View style={styles.header}>
			<View style={styles.headerTop}>
				<Text style={styles.headerLabel}>Today's Budget</Text>
				<TouchableOpacity onPress={onSettingsPress}>
					<Text style={styles.settingsIcon}>⚙️</Text>
				</TouchableOpacity>
			</View>

			{budgetStatus ? (
				<>
					<Text
						style={[
							styles.budgetAmount,
							{ color: isPositive ? "#4CAF50" : "#e94560" },
						]}
					>
						<Text style={{ fontSize: 50 }}>{isPositive ? "" : "-"}</Text>
						{format(budgetStatus.availableBudget)}
					</Text>
					<Text style={styles.dailyAllowance}>
						+{format(budgetStatus.dailyAllowance)}/day
					</Text>
					<View style={styles.statsRow}>
						<Text style={styles.statText}>
							Day {budgetStatus.daysElapsed}/{budgetStatus.daysInMonth}
						</Text>
						<Text style={styles.statDivider}>•</Text>
						<Text style={styles.statText}>
							Spent: {format(budgetStatus.totalSpent)}
						</Text>
						{budgetStatus.totalIncome > 0 && (
							<>
								<Text style={styles.statDivider}>•</Text>
								<Text style={[styles.statText, { color: "#4CAF50" }]}>
									+{format(budgetStatus.totalIncome)}
								</Text>
							</>
						)}
					</View>
				</>
			) : (
				<Text style={styles.budgetAmount}>Set Budget</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	header: {
		backgroundColor: "#16213e",
		padding: 24,
		paddingTop: 60,
		alignItems: "center",
		borderBottomLeftRadius: 32,
		borderBottomRightRadius: 32,
	},
	headerTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		width: "100%",
		marginBottom: 8,
	},
	headerLabel: {
		fontSize: 14,
		color: "#a0a0a0",
		textTransform: "uppercase",
		letterSpacing: 2,
	},
	settingsIcon: {
		fontSize: 24,
	},
	budgetAmount: {
		fontSize: 56,
		fontWeight: "bold",
		color: "#4CAF50",
		marginBottom: 4,
	},
	dailyAllowance: {
		fontSize: 16,
		color: "#4CAF50",
		marginBottom: 12,
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	statText: {
		fontSize: 13,
		color: "#a0a0a0",
	},
	statDivider: {
		fontSize: 13,
		color: "#a0a0a0",
		marginHorizontal: 8,
	},
});

export default BudgetHeader;
