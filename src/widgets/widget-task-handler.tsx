import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BudgetWidget } from "./BudgetWidget";
import { BudgetSettings, Transaction } from "../types";
import { calculateBudgetStatus } from "../budget";
import { safeJsonParse, ensureArray, ensureObject } from "../utils/safeJson";

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
				const [settingsData, transactionsData] = await Promise.all([
					AsyncStorage.getItem(BUDGET_SETTINGS_KEY),
					AsyncStorage.getItem(STORAGE_KEY),
				]);

				if (!settingsData) {
					props.renderWidget(
						<BudgetWidget budget="Setup app" isNegative={false} />
					);
					break;
				}

				const settings = ensureObject<BudgetSettings>(
					safeJsonParse<BudgetSettings | null>(settingsData, null)
				);
				if (!settings) {
					props.renderWidget(
						<BudgetWidget budget="Data error" isNegative={false} />
					);
					break;
				}

				const transactions = ensureArray<Transaction>(
					safeJsonParse<Transaction[]>(transactionsData ?? "", [])
				);

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
				props.renderWidget(<BudgetWidget budget="Error" />);
			}
			break;

		case "WIDGET_DELETED":
			break;

		case "WIDGET_CLICK":
			break;

		default:
			break;
	}
}
