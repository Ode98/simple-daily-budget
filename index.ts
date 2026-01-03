import { registerRootComponent } from "expo";
import { AppRegistry } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RNAndroidNotificationListenerHeadlessJsName } from "react-native-android-notification-listener";
import { parsePaymentNotification, GOOGLE_WALLET_PACKAGE } from "./src/parser";
import { RawNotification, Transaction } from "./src/types";

import App from "./App";

const STORAGE_KEY = "@budget_transactions";

interface HeadlessTaskData {
	notification: string | RawNotification | null;
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
		// Parse the notification JSON
		const data: RawNotification =
			typeof notification === "string"
				? JSON.parse(notification)
				: notification;

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
			const existing: Transaction[] = existingData
				? JSON.parse(existingData)
				: [];
			const updated = [transaction, ...existing];
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
			console.log("Transaction saved:", transaction);
		}
	} catch (error) {
		console.error("Error in headless notification listener:", error);
	}
};

// Register the headless task - this MUST be done early in the app lifecycle
AppRegistry.registerHeadlessTask(
	RNAndroidNotificationListenerHeadlessJsName,
	() => headlessNotificationListener
);

// Register the main app component
registerRootComponent(App);
