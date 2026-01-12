// Polyfills for headless task compatibility with Hermes in release builds
// This MUST be the very first import before anything else
import "./polyfills";

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

const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat("fi-FI", {
		style: "currency",
		currency: "EUR",
	}).format(Math.abs(amount));
};

interface HeadlessTaskData {
	notification: string | RawNotification | null;
}

async function updateWidget(transactions: Transaction[]): Promise<void> {
	try {
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
			widgetNotFound: () => {},
		});

		console.log("Widget updated with budget:", formattedBudget);
	} catch (error) {
		console.error("Error updating widget:", error);
	}
}

/**
 * Headless task that runs in the background when notifications are received.
 * This runs even when the app is closed.
 *
 * IMPORTANT: We wrap all async work in setTimeout to defer it off the microtask queue.
 * This is required because Hermes disables microtasks in headless/background runtime,
 * which causes crashes when using async/await directly.
 */
const headlessNotificationListener = ({
	notification,
}: HeadlessTaskData): Promise<void> => {
	return new Promise((resolve) => {
		// Defer all async work using setTimeout to avoid microtask queue issues in Hermes
		setTimeout(() => {
			(async () => {
				if (!notification) return;

				try {
					// Parse the notification JSON safely
					let data: RawNotification;
					if (typeof notification === "string") {
						const parsed = safeJsonParse<RawNotification | null>(
							notification,
							null
						);
						if (!parsed) {
							console.error("Failed to parse notification JSON");
							return;
						}
						data = parsed;
					} else {
						data = notification;
					}

					if (data.app !== GOOGLE_WALLET_PACKAGE) {
						return;
					}

					console.log("Google Wallet notification received:", data);

					const transaction: Transaction | null =
						parsePaymentNotification(data);

					if (transaction) {
						const existingData = await AsyncStorage.getItem(STORAGE_KEY);
						const existing = ensureArray<Transaction>(
							safeJsonParse<Transaction[]>(existingData ?? "", [])
						);
						const updated = [transaction, ...existing];
						await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
						console.log("Transaction saved:", transaction);

						await updateWidget(updated);
					}
				} catch (error) {
					console.error("Error in headless notification listener:", error);
				}
			})().finally(() => {
				resolve();
			});
		}, 0);
	});
};

try {
	AppRegistry.registerHeadlessTask(
		RNAndroidNotificationListenerHeadlessJsName,
		() => headlessNotificationListener
	);
} catch (error) {
	console.error("Failed to register headless task:", error);
}

registerRootComponent(App);

try {
	registerWidgetTaskHandler(widgetTaskHandler);
} catch (error) {
	console.error("Failed to register widget task handler:", error);
}
