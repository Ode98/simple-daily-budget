import {
	Transaction,
	BudgetStatus,
	MonthProjection,
	TRANSACTION_TYPES,
} from "./types";

/**
 * Get the number of days in a given month
 */
export function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

/**
 * Get today's date at midnight (local time)
 */
export function getToday(): Date {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Get the start of the current month
 */
export function getMonthStart(): Date {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Get the current day of the month (1-indexed)
 */
export function getCurrentDayOfMonth(): number {
	return new Date().getDate();
}

/**
 * Get days remaining in the current month (including today)
 */
export function getDaysRemainingInMonth(): number {
	const now = new Date();
	const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());
	return daysInMonth - now.getDate() + 1;
}

/**
 * Calculate daily allowance from monthly budget
 */
export function getDailyAllowance(monthlyBudget: number): number {
	const now = new Date();
	const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());
	return monthlyBudget / daysInMonth;
}

/**
 * Parse a timestamp into a Date object, handling various formats
 */
function parseTimestamp(timestamp: string | number | undefined): Date | null {
	if (!timestamp) return null;

	let date: Date;

	if (typeof timestamp === "number") {
		date = new Date(timestamp);
	} else if (typeof timestamp === "string") {
		// Try parsing as ISO string first
		date = new Date(timestamp);

		// If invalid, try parsing as number string (Unix timestamp)
		if (isNaN(date.getTime())) {
			const numTimestamp = Number(timestamp);
			if (!isNaN(numTimestamp)) {
				date = new Date(numTimestamp);
			}
		}
	} else {
		return null;
	}

	// Return null if still invalid
	if (isNaN(date.getTime())) {
		return null;
	}

	return date;
}

/**
 * Calculate the available budget for today with rollover logic
 */
export function calculateBudgetStatus(
	transactions: Transaction[],
	monthlyBudget: number
): BudgetStatus {
	const now = new Date();
	const monthStart = getMonthStart();

	// Calculate days elapsed (including today)
	const daysElapsed = getCurrentDayOfMonth();

	// Daily allowance
	const dailyAllowance = getDailyAllowance(monthlyBudget);

	// Total budget accumulated so far (daily allowance × days elapsed)
	const totalBudgetAccumulated = dailyAllowance * daysElapsed;

	// Filter transactions for current month only
	const currentMonthTransactions = transactions.filter((t) => {
		const txDate = parseTimestamp(t.timestamp);
		if (!txDate) return false; // Skip invalid timestamps
		return txDate >= monthStart && txDate <= now;
	});

	// Calculate totals
	let totalSpent = 0;
	let totalIncome = 0;

	for (const tx of currentMonthTransactions) {
		if (tx.type === TRANSACTION_TYPES.INCOME) {
			totalIncome += tx.amount;
		} else {
			// Both expense and auto_payment are deductions
			totalSpent += tx.amount;
		}
	}

	// Available budget = accumulated budget - spent + income
	const availableBudget = totalBudgetAccumulated - totalSpent + totalIncome;

	return {
		availableBudget,
		dailyAllowance,
		totalSpent,
		totalIncome,
		totalBudgetAccumulated,
		daysElapsed,
		daysRemaining: getDaysRemainingInMonth(),
		daysInMonth: getDaysInMonth(now.getFullYear(), now.getMonth()),
	};
}

/**
 * Get a summary for the end of month projection
 */
export function getMonthProjection(
	budgetStatus: BudgetStatus,
	monthlyBudget: number
): MonthProjection {
	const { availableBudget, daysRemaining, dailyAllowance } = budgetStatus;

	// If user continues their current pace, how much will they have at month end?
	// Current available + remaining daily allowances
	const projectedEndBalance =
		availableBudget + dailyAllowance * (daysRemaining - 1);

	// Savings rate (how much of the monthly budget is projected to be saved)
	const savingsRate = Math.max(0, projectedEndBalance / monthlyBudget) * 100;

	return {
		projectedEndBalance,
		savingsRate,
	};
}

/**
 * Format a date for display
 */
export function formatDate(timestamp: string | number | undefined): string {
	if (!timestamp) return "Unknown date";

	let date: Date;

	// Handle different timestamp formats
	if (typeof timestamp === "number") {
		date = new Date(timestamp);
	} else if (typeof timestamp === "string") {
		// Try parsing as ISO string first
		date = new Date(timestamp);

		// If invalid, try parsing as number string (Unix timestamp)
		if (isNaN(date.getTime())) {
			const numTimestamp = Number(timestamp);
			if (!isNaN(numTimestamp)) {
				date = new Date(numTimestamp);
			}
		}
	} else {
		return "Unknown date";
	}

	// Check if date is valid
	if (isNaN(date.getTime())) {
		return "Unknown date";
	}

	return date.toLocaleDateString("fi-FI", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Group transactions by day
 */
export function groupTransactionsByDay(
	transactions: Transaction[]
): Record<string, Transaction[]> {
	const groups: Record<string, Transaction[]> = {};

	for (const tx of transactions) {
		const date = new Date(tx.timestamp);
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
			2,
			"0"
		)}-${String(date.getDate()).padStart(2, "0")}`;

		if (!groups[key]) {
			groups[key] = [];
		}
		groups[key].push(tx);
	}

	return groups;
}
