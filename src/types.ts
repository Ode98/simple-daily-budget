/**
 * Shared TypeScript types for the budget app
 */

/**
 * Transaction type constants
 */
export const TRANSACTION_TYPES = {
	EXPENSE: "expense",
	INCOME: "income",
	AUTO_PAYMENT: "auto_payment",
} as const;

export type TransactionType =
	(typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

/**
 * Transaction data structure
 */
export interface Transaction {
	id: string;
	timestamp: string;
	amount: number;
	type: TransactionType;
	description: string;
	source: "manual" | "auto";
}

/**
 * Budget settings stored in AsyncStorage
 */
export interface BudgetSettings {
	monthlyBudget: number;
	startDate: string;
}

/**
 * Calculated budget status returned by calculateBudgetStatus
 */
export interface BudgetStatus {
	availableBudget: number;
	dailyAllowance: number;
	totalSpent: number;
	totalIncome: number;
	totalBudgetAccumulated: number;
	daysElapsed: number;
	daysRemaining: number;
	daysInMonth: number;
}

/**
 * Month projection data
 */
export interface MonthProjection {
	projectedEndBalance: number;
	savingsRate: number;
}

/**
 * Raw notification data from Android notification listener
 */
export interface RawNotification {
	app: string;
	title?: string;
	titleBig?: string;
	text?: string;
	bigText?: string;
	time?: string | number;
}

/**
 * Transaction updates for editing
 */
export interface TransactionUpdates {
	amount?: number;
	description?: string;
}
