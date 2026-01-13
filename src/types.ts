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

export interface CurrencyConfig {
	code: string;
	symbol: string;
	locale: string;
	name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
	{ code: "EUR", symbol: "€", locale: "fi-FI", name: "Euro" },
	{ code: "USD", symbol: "$", locale: "en-US", name: "US Dollar" },
	{ code: "GBP", symbol: "£", locale: "en-GB", name: "British Pound" },
	{ code: "JPY", symbol: "¥", locale: "ja-JP", name: "Japanese Yen" },
	{ code: "AUD", symbol: "$", locale: "en-AU", name: "Australian Dollar" },
	{ code: "CAD", symbol: "$", locale: "en-CA", name: "Canadian Dollar" },
	{ code: "CHF", symbol: "Fr", locale: "de-CH", name: "Swiss Franc" },
	{ code: "SEK", symbol: "kr", locale: "sv-SE", name: "Swedish Krona" },
	{ code: "NOK", symbol: "kr", locale: "nb-NO", name: "Norwegian Krone" },
	{ code: "DKK", symbol: "kr", locale: "da-DK", name: "Danish Krone" },
	{ code: "PLN", symbol: "zł", locale: "pl-PL", name: "Polish Zloty" },
	{ code: "INR", symbol: "₹", locale: "en-IN", name: "Indian Rupee" },
	{ code: "SGD", symbol: "$", locale: "en-SG", name: "Singapore Dollar" },
	{ code: "HKD", symbol: "$", locale: "en-HK", name: "Hong Kong Dollar" },
	{ code: "NZD", symbol: "$", locale: "en-NZ", name: "New Zealand Dollar" },
	{ code: "MXN", symbol: "$", locale: "es-MX", name: "Mexican Peso" },
	{ code: "BRL", symbol: "R$", locale: "pt-BR", name: "Brazilian Real" },
	{ code: "KRW", symbol: "₩", locale: "ko-KR", name: "South Korean Won" },
];

export interface AppSettings {
	currency: string;
	locale: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
	currency: "EUR",
	locale: "fi-FI",
};
