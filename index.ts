import { registerRootComponent } from "expo";
import { AppRegistry } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RNAndroidNotificationListenerHeadlessJsName } from "react-native-android-notification-listener";
import {
	registerWidgetTaskHandler,
	requestWidgetUpdate,
} from "react-native-android-widget";
import { parsePaymentNotification, GOOGLE_WALLET_PACKAGE } from "./src/parser";
import { RawNotification, Transaction, BudgetSettings } from "./src/types";
import { calculateBudgetStatus } from "./src/budget";
import { widgetTaskHandler } from "./src/widgets/widget-task-handler";
import { safeJsonParse, ensureArray, ensureObject } from "./src/utils/safeJson";

import App from "./App";

const STORAGE_KEY = "@budget_transactions";
const BUDGET_SETTINGS_KEY = "@budget_settings";

// Format currency helper (same as in App.tsx)
const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat("fi-FI", {
		style: "currency",
		currency: "EUR",
	}).format(Math.abs(amount));
};

interface HeadlessTaskData {
	notification: string | RawNotification | null;
}

/**
 * Update the widget with the current budget
 */
async function updateWidget(transactions: Transaction[]): Promise<void> {
	try {
		// Get budget settings
		const settingsData = await AsyncStorage.getItem(BUDGET_SETTINGS_KEY);
		if (!settingsData) {
			console.log("No budget settings found, skipping widget update");
			return;
		}

		const settings = ensureObject<BudgetSettings>(
			safeJsonParse<BudgetSettings | null>(settingsData, null)
		);
		if (!settings) {
			console.log("Invalid budget settings data, skipping widget update");
			return;
		}
		const budgetStatus = calculateBudgetStatus(
			transactions,
			settings.monthlyBudget
		);
		const formattedBudget = formatCurrency(budgetStatus.availableBudget);
		const isNegative = budgetStatus.availableBudget < 0;

		// Update the widget (using require to avoid JSX in .ts file)
		requestWidgetUpdate({
			widgetName: "BudgetWidget",
			renderWidget: () => {
				const React = require("react");
				const { BudgetWidget } = require("./src/widgets/BudgetWidget");
				return React.createElement(BudgetWidget, {
					budget: formattedBudget,
					isNegative,
				});
			},
			widgetNotFound: () => {
				// Widget not added to home screen yet
			},
		});

		console.log("Widget updated with budget:", formattedBudget);
	} catch (error) {
		console.error("Error updating widget:", error);
	}
}

/**
 * Headless task that runs in the background when notifications are received.
 * This runs even when the app is closed.
 */
const headlessNotificationListener = async ({
	notification,
}: HeadlessTaskData): Promise<void> => {
	if (!notification) return;

	try {
		// Parse the notification JSON safely
		let data: RawNotification;
		if (typeof notification === "string") {
			const parsed = safeJsonParse<RawNotification | null>(notification, null);
			if (!parsed) {
				console.error("Failed to parse notification JSON");
				return;
			}
			data = parsed;
		} else {
			data = notification;
		}

		// Only process Google Wallet notifications
		if (data.app !== GOOGLE_WALLET_PACKAGE) {
			return;
		}

		console.log("Google Wallet notification received:", data);

		// Parse into transaction object (now in new format)
		const transaction: Transaction | null = parsePaymentNotification(data);

		if (transaction) {
			// Save to storage
			const existingData = await AsyncStorage.getItem(STORAGE_KEY);
			const existing = ensureArray<Transaction>(
				safeJsonParse<Transaction[]>(existingData ?? "", [])
			);
			const updated = [transaction, ...existing];
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
			console.log("Transaction saved:", transaction);

			// Update the widget with new budget
			await updateWidget(updated);
		}
	} catch (error) {
		console.error("Error in headless notification listener:", error);
	}
};

// Register the headless task - this MUST be done early in the app lifecycle
try {
	AppRegistry.registerHeadlessTask(
		RNAndroidNotificationListenerHeadlessJsName,
		() => headlessNotificationListener
	);
} catch (error) {
	console.error("Failed to register headless task:", error);
}

// Register the main app component
registerRootComponent(App);

// Register the widget task handler
try {
	registerWidgetTaskHandler(widgetTaskHandler);
} catch (error) {
	console.error("Failed to register widget task handler:", error);
}
