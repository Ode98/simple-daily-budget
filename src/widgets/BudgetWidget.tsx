import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

interface BudgetWidgetProps {
	budget: string;
	isNegative?: boolean;
}

/**
 * Android home screen widget that displays the current available budget.
 * Clicking the widget opens the main app.
 */
export function BudgetWidget({
	budget,
	isNegative = false,
}: BudgetWidgetProps) {
	// Add minus sign for negative values and choose color
	// Note: formatCurrency usually adds the minus sign, but we ensure it here if needed
	const displayBudget = isNegative ? `-${budget}` : budget;
	const budgetColor = isNegative ? "#ef4444" : "#4ade80";

	return (
		<FlexWidget
			style={{
				height: "match_parent",
				width: "match_parent",
				backgroundColor: "#1a1a2e",
				borderRadius: 16,
				padding: 12,
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
			}}
			clickAction="OPEN_APP"
		>
			<TextWidget
				text="Available"
				style={{
					fontSize: 14,
					color: "#a0a0a0",
					marginBottom: 4,
				}}
			/>
			<TextWidget
				text={displayBudget}
				style={{
					fontSize: 32,
					fontWeight: "bold",
					color: budgetColor,
				}}
			/>
		</FlexWidget>
	);
}
