import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	Transaction,
	TransactionUpdates,
	BudgetSettings,
	TRANSACTION_TYPES,
	TransactionType,
} from "./types";

export { TRANSACTION_TYPES } from "./types";

const STORAGE_KEYS = {
	TRANSACTIONS: "@budget_transactions",
	BUDGET_SETTINGS: "@budget_settings",
} as const;

export async function getBudgetSettings(): Promise<BudgetSettings | null> {
	try {
		const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGET_SETTINGS);
		return data ? JSON.parse(data) : null;
	} catch (error) {
		console.error("Error reading budget settings:", error);
		return null;
	}
}

export async function saveBudgetSettings(
	settings: BudgetSettings
): Promise<boolean> {
	try {
		await AsyncStorage.setItem(
			STORAGE_KEYS.BUDGET_SETTINGS,
			JSON.stringify(settings)
		);
		return true;
	} catch (error) {
		console.error("Error saving budget settings:", error);
		return false;
	}
}

export async function saveTransaction(
	transaction: Transaction
): Promise<Transaction[]> {
	try {
		const existing = await getTransactions();
		const updated = [transaction, ...existing];
		await AsyncStorage.setItem(
			STORAGE_KEYS.TRANSACTIONS,
			JSON.stringify(updated)
		);
		return updated;
	} catch (error) {
		console.error("Error saving transaction:", error);
		return [];
	}
}

export async function getTransactions(): Promise<Transaction[]> {
	try {
		const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
		return data ? JSON.parse(data) : [];
	} catch (error) {
		console.error("Error reading transactions:", error);
		return [];
	}
}

export async function clearTransactions(): Promise<void> {
	try {
		await AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
	} catch (error) {
		console.error("Error clearing transactions:", error);
	}
}

export async function deleteTransaction(id: string): Promise<Transaction[]> {
	try {
		const existing = await getTransactions();
		const updated = existing.filter((t) => t.id !== id);
		await AsyncStorage.setItem(
			STORAGE_KEYS.TRANSACTIONS,
			JSON.stringify(updated)
		);
		return updated;
	} catch (error) {
		console.error("Error deleting transaction:", error);
		return [];
	}
}

export async function updateTransaction(
	id: string,
	updates: TransactionUpdates
): Promise<Transaction[]> {
	try {
		const existing = await getTransactions();
		const updated = existing.map((t) => {
			if (t.id === id) {
				return {
					...t,
					amount:
						updates.amount !== undefined ? Math.abs(updates.amount) : t.amount,
					description:
						updates.description !== undefined
							? updates.description
							: t.description,
				};
			}
			return t;
		});
		await AsyncStorage.setItem(
			STORAGE_KEYS.TRANSACTIONS,
			JSON.stringify(updated)
		);
		return updated;
	} catch (error) {
		console.error("Error updating transaction:", error);
		return [];
	}
}

export function createTransaction(
	amount: number,
	type: TransactionType,
	description?: string
): Transaction {
	return {
		id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		timestamp: new Date().toISOString(),
		amount: Math.abs(amount),
		type,
		description:
			description || (type === TRANSACTION_TYPES.INCOME ? "Income" : "Expense"),
		source: "manual",
	};
}

export async function migrateOldData(): Promise<void> {
	try {
		const oldData = await AsyncStorage.getItem("@payment_notifications");
		if (oldData) {
			interface OldNotification {
				id: string;
				timestamp: string;
				amount: number;
				merchant?: string;
			}

			const oldNotifications: OldNotification[] = JSON.parse(oldData);
			const migratedTransactions: Transaction[] = oldNotifications.map((n) => ({
				id: n.id,
				timestamp: n.timestamp,
				amount: n.amount,
				type: TRANSACTION_TYPES.AUTO_PAYMENT,
				description: n.merchant || "Unknown",
				source: "auto" as const,
			}));

			// Merge with existing transactions (avoid duplicates)
			const existing = await getTransactions();
			const existingIds = new Set(existing.map((t) => t.id));
			const newTransactions = migratedTransactions.filter(
				(t) => !existingIds.has(t.id)
			);

			if (newTransactions.length > 0) {
				const merged = [...existing, ...newTransactions].sort(
					(a, b) =>
						new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
				);
				await AsyncStorage.setItem(
					STORAGE_KEYS.TRANSACTIONS,
					JSON.stringify(merged)
				);
			}

			// Remove old data
			await AsyncStorage.removeItem("@payment_notifications");
		}
	} catch (error) {
		console.error("Error migrating old data:", error);
	}
}
