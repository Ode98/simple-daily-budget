import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

interface BudgetWidgetProps {
	budget: string;
}

/**
 * Android home screen widget that displays the current available budget.
 * Clicking the widget opens the main app.
 */
export function BudgetWidget({ budget }: BudgetWidgetProps) {
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
					fontSize: 12,
					color: "#a0a0a0",
					marginBottom: 4,
				}}
			/>
			<TextWidget
				text={budget}
				style={{
					fontSize: 24,
					fontWeight: "bold",
					color: "#4ade80",
				}}
			/>
		</FlexWidget>
	);
}
