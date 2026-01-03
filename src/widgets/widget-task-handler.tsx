import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BudgetWidget } from "./BudgetWidget";
import { BudgetSettings, Transaction } from "../types";
import { calculateBudgetStatus } from "../budget";

const STORAGE_KEY = "@budget_transactions";
const BUDGET_SETTINGS_KEY = "@budget_settings";

const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat("fi-FI", {
		style: "currency",
		currency: "EUR",
	}).format(Math.abs(amount));
};

/**
 * Widget task handler that renders the BudgetWidget.
 * This is called by Android when the widget needs to be rendered.
 *
 * It fetches the latest data from AsyncStorage to ensure the widget
 * stays up to date with background updates.
 */
export async function widgetTaskHandler(
	props: WidgetTaskHandlerProps
): Promise<void> {
	switch (props.widgetAction) {
		case "WIDGET_ADDED":
		case "WIDGET_UPDATE":
		case "WIDGET_RESIZED":
			try {
				// Fetch settings and transactions
				const [settingsData, transactionsData] = await Promise.all([
					AsyncStorage.getItem(BUDGET_SETTINGS_KEY),
					AsyncStorage.getItem(STORAGE_KEY),
				]);

				if (!settingsData) {
					// No budget set yet
					props.renderWidget(
						<BudgetWidget budget="Setup app" isNegative={false} />
					);
					break;
				}

				const settings: BudgetSettings = JSON.parse(settingsData);
				const transactions: Transaction[] = transactionsData
					? JSON.parse(transactionsData)
					: [];

				// Calculate budget status
				const budgetStatus = calculateBudgetStatus(
					transactions,
					settings.monthlyBudget
				);
				const formattedBudget = formatCurrency(budgetStatus.availableBudget);
				const isNegative = budgetStatus.availableBudget < 0;

				props.renderWidget(
					<BudgetWidget budget={formattedBudget} isNegative={isNegative} />
				);
			} catch (error) {
				console.error("Error updating widget:", error);
				// Fallback in case of error
				props.renderWidget(<BudgetWidget budget="Error" />);
			}
			break;

		case "WIDGET_DELETED":
			// Clean up if needed
			break;

		case "WIDGET_CLICK":
			// Handle click action - OPEN_APP is handled automatically
			break;

		default:
			break;
	}
}
