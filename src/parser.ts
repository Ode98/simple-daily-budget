import { Transaction, RawNotification, TRANSACTION_TYPES } from "./types";

/**
 * Google Pay/Wallet package names for different regions
 * - walletnfcrel: Google Wallet (Europe, USA tap-to-pay)
 * - nbu.paisa.user: Google Pay (India, Singapore, USA, etc.)
 */
export const GOOGLE_WALLET_PACKAGES = [
	"com.google.android.apps.walletnfcrel",
	"com.google.android.apps.nbu.paisa.user",
] as const;

export const isGooglePayApp = (packageName: string): boolean =>
	GOOGLE_WALLET_PACKAGES.includes(
		packageName as (typeof GOOGLE_WALLET_PACKAGES)[number]
	);

const CURRENCY_CONFIG = {
	symbols: [
		"€",
		"$",
		"£",
		"¥",
		"₹",
		"₽",
		"zł",
		"Kč",
		"Ft",
		"lei",
		"лв",
		"kn",
		"kr",
		"Fr",
		"R$",
		"₩",
		"NT$",
	],
	codes: [
		"EUR",
		"USD",
		"GBP",
		"JPY",
		"AUD",
		"CAD",
		"CHF",
		"SEK",
		"NOK",
		"DKK",
		"PLN",
		"CZK",
		"HUF",
		"RON",
		"BGN",
		"HRK",
		"INR",
		"SGD",
		"HKD",
		"NZD",
		"MXN",
		"BRL",
		"KRW",
		"TWD",
		"RUB",
		"TRY",
		"ZAR",
		"THB",
		"PHP",
		"IDR",
	],
} as const;

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildCurrencyPatterns(): RegExp[] {
	const symbolPattern = CURRENCY_CONFIG.symbols.map(escapeRegex).join("|");
	const codePattern = CURRENCY_CONFIG.codes.join("|");

	return [
		// Symbol before amount: €12,50 or $ 12.50 or £1,234.56
		new RegExp(`(?:${symbolPattern})\\s*([\\d\\s,.]+)`, "i"),
		// Symbol after amount: 12,50 € or 12.50$ or 1,234.56 £
		new RegExp(`([\\d\\s,.]+)\\s*(?:${symbolPattern})`, "i"),
		// Code before amount: EUR 12,50 or USD 12.50
		new RegExp(`(?:${codePattern})\\s*([\\d\\s,.]+)`, "i"),
		// Code after amount: 12,50 EUR or 12.50 USD
		new RegExp(`([\\d\\s,.]+)\\s*(?:${codePattern})`, "i"),
	];
}

const AMOUNT_PATTERNS = buildCurrencyPatterns();

function normalizeAmountString(numStr: string): number | null {
	const cleaned = numStr.trim().replace(/\s/g, "");

	// Determine decimal separator by checking the last separator
	const lastComma = cleaned.lastIndexOf(",");
	const lastDot = cleaned.lastIndexOf(".");

	let normalized: string;

	if (lastComma > lastDot) {
		// Comma is the decimal separator (European format: 1.234,56 or 1234,56)
		normalized = cleaned.replace(/\./g, "").replace(",", ".");
	} else if (lastDot > lastComma) {
		// Dot is the decimal separator (US format: 1,234.56 or 1234.56)
		normalized = cleaned.replace(/,/g, "");
	} else if (lastComma === -1 && lastDot === -1) {
		// No separator, whole number (common for JPY, KRW)
		normalized = cleaned;
	} else {
		// Single separator - determine by position (if 3 digits after, it's thousands separator)
		const separator = lastComma !== -1 ? "," : ".";
		const parts = cleaned.split(separator);
		if (parts.length === 2 && parts[1].length === 3) {
			// Thousands separator, remove it (e.g., 1,234 or 1.234)
			normalized = cleaned.replace(separator, "");
		} else {
			// Decimal separator
			normalized = cleaned.replace(",", ".");
		}
	}

	const amount = parseFloat(normalized);
	return isNaN(amount) ? null : amount;
}

export function parseAmount(text: string | undefined): number | null {
	if (!text) return null;

	for (const pattern of AMOUNT_PATTERNS) {
		const match = text.match(pattern);
		if (match && match[1]) {
			const amount = normalizeAmountString(match[1]);
			if (amount !== null && amount > 0) {
				return amount;
			}
		}
	}

	return null;
}

export function parseMerchant(
	text: string | undefined,
	title: string | undefined
): string {
	if (!text && !title) return "Unknown";

	// Common patterns in Google Pay notifications
	const patterns = [
		/(?:at|@)\s+(.+?)(?:\s+for|\s+€|$)/i, // "at Store Name"
		/(?:to|maksu)\s+(.+?)(?:\s+for|\s+€|$)/i, // "to Store Name" or "maksu Store Name"
		/(?:paid|maksettiin)\s+(?:.*?)\s+(?:at|@)\s+(.+)/i, // "Paid €X at Store"
	];

	const combined = `${title || ""} ${text || ""}`;

	for (const pattern of patterns) {
		const match = combined.match(pattern);
		if (match && match[1]) {
			return match[1].trim();
		}
	}

	// Fallback: if we have a title and it's not just "Google Pay", use it
	if (
		title &&
		!title.toLowerCase().includes("google pay") &&
		!title.toLowerCase().includes("google wallet")
	) {
		return title.trim();
	}

	return "Unknown";
}

export function parsePaymentNotification(
	notification: RawNotification | string
): Transaction | null {
	try {
		const data: RawNotification =
			typeof notification === "string"
				? JSON.parse(notification)
				: notification;

		// Only process Google Pay/Wallet notifications
		if (!isGooglePayApp(data.app)) {
			return null;
		}

		const text = data.text || data.bigText || "";
		const title = data.title || data.titleBig || "";

		const amount = parseAmount(text) || parseAmount(title);

		// If no amount found, this might not be a payment notification
		if (amount === null) {
			return null;
		}

		// Convert Unix timestamp (milliseconds) to ISO string for consistent date handling
		const timestamp = data.time
			? new Date(Number(data.time)).toISOString()
			: new Date().toISOString();

		return {
			id: `${data.time}_${Date.now()}`,
			timestamp,
			amount,
			type: TRANSACTION_TYPES.AUTO_PAYMENT,
			description: parseMerchant(text, title),
			source: "auto",
			rawNotification: data,
		};
	} catch (error) {
		console.error("Error parsing notification:", error);
		return null;
	}
}
