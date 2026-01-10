export const TRANSACTION_TYPES = {
	EXPENSE: "expense",
	INCOME: "income",
	AUTO_PAYMENT: "auto_payment",
} as const;

export type TransactionType =
	(typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

export interface Transaction {
	id: string;
	timestamp: string;
	amount: number;
	type: TransactionType;
	description: string;
	source: "manual" | "auto";
	/** Raw notification data for auto transactions (for debugging) */
	rawNotification?: RawNotification;
}

export interface BudgetSettings {
	monthlyBudget: number;
	startDate: string;
}

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

export interface MonthProjection {
	projectedEndBalance: number;
	savingsRate: number;
}

export interface RawNotification {
	app: string;
	title?: string;
	titleBig?: string;
	text?: string;
	bigText?: string;
	time?: string | number;
}

export interface TransactionUpdates {
	amount?: number;
	description?: string;
}
