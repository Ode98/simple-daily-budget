import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
	TRANSACTIONS: "@budget_transactions",
	BUDGET_SETTINGS: "@budget_settings",
};

/**
 * Transaction types
 */
export const TRANSACTION_TYPES = {
	EXPENSE: "expense",
	INCOME: "income",
	AUTO_PAYMENT: "auto_payment",
};

/**
 * Get budget settings
 * @returns {Promise<Object|null>} Budget settings or null if not set
 */
export async function getBudgetSettings() {
	try {
		const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGET_SETTINGS);
		return data ? JSON.parse(data) : null;
	} catch (error) {
		console.error("Error reading budget settings:", error);
		return null;
	}
}

/**
 * Save budget settings
 * @param {Object} settings - Budget settings { monthlyBudget: number, startDate: ISO string }
 */
export async function saveBudgetSettings(settings) {
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

/**
 * Save a new transaction
 * @param {Object} transaction - Transaction object
 * @returns {Promise<Array>} Updated transactions array
 */
export async function saveTransaction(transaction) {
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

/**
 * Get all stored transactions
 * @returns {Promise<Array>} Array of transactions
 */
export async function getTransactions() {
	try {
		const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
		return data ? JSON.parse(data) : [];
	} catch (error) {
		console.error("Error reading transactions:", error);
		return [];
	}
}

/**
 * Clear all stored transactions
 */
export async function clearTransactions() {
	try {
		await AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
	} catch (error) {
		console.error("Error clearing transactions:", error);
	}
}

/**
 * Delete a transaction by ID
 * @param {string} id - Transaction ID to delete
 * @returns {Promise<Array>} Updated transactions array
 */
export async function deleteTransaction(id) {
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

/**
 * Update a transaction by ID
 * @param {string} id - Transaction ID to update
 * @param {Object} updates - Fields to update { amount, description }
 * @returns {Promise<Array>} Updated transactions array
 */
export async function updateTransaction(id, updates) {
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

/**
 * Create a manual transaction
 * @param {number} amount - Transaction amount (positive)
 * @param {string} type - Transaction type (expense, income)
 * @param {string} description - Transaction description
 * @returns {Object} Transaction object
 */
export function createTransaction(amount, type, description) {
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

// Legacy support - migrate old notifications to new format
export async function migrateOldData() {
	try {
		const oldData = await AsyncStorage.getItem("@payment_notifications");
		if (oldData) {
			const oldNotifications = JSON.parse(oldData);
			const migratedTransactions = oldNotifications.map((n) => ({
				id: n.id,
				timestamp: n.timestamp,
				amount: n.amount,
				type: TRANSACTION_TYPES.AUTO_PAYMENT,
				description: n.merchant || "Unknown",
				source: "auto",
			}));

			// Merge with existing transactions (avoid duplicates)
			const existing = await getTransactions();
			const existingIds = new Set(existing.map((t) => t.id));
			const newTransactions = migratedTransactions.filter(
				(t) => !existingIds.has(t.id)
			);

			if (newTransactions.length > 0) {
				const merged = [...existing, ...newTransactions].sort(
					(a, b) => new Date(b.timestamp) - new Date(a.timestamp)
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
