/**
 * Google Wallet package name (same for all of Europe including Finland)
 */
export const GOOGLE_WALLET_PACKAGE = "com.google.android.apps.walletnfcrel";

/**
 * Parse amount from Google Pay notification text
 * Handles Finnish locale (comma as decimal separator)
 *
 * Examples:
 * - "Payment of €12,50 at Store Name"
 * - "12,50 € maksu Store Name"
 * - "Paid €12.50 to Store Name"
 *
 * @param {string} text - Notification text
 * @returns {number|null} Amount in euros or null if not found
 */
export function parseAmount(text) {
	if (!text) return null;

	// Match patterns like "€12,50", "12,50 €", "€12.50", "12.50€"
	// Also handles thousands separator: "1 234,50 €" or "1,234.50 €"
	const patterns = [
		/€\s*([\d\s]+[,.][\d]{2})/, // €12,50 or € 12,50
		/([\d\s]+[,.][\d]{2})\s*€/, // 12,50 € or 12,50€
		/EUR\s*([\d\s]+[,.][\d]{2})/i, // EUR 12,50
		/([\d\s]+[,.][\d]{2})\s*EUR/i, // 12,50 EUR
	];

	for (const pattern of patterns) {
		const match = text.match(pattern);
		if (match) {
			// Clean up the number: remove spaces, replace comma with dot
			let numStr = match[1].replace(/\s/g, "").replace(",", ".");
			const amount = parseFloat(numStr);
			if (!isNaN(amount)) {
				return amount;
			}
		}
	}

	return null;
}

/**
 * Parse merchant/company name from Google Pay notification
 *
 * @param {string} text - Notification text
 * @param {string} title - Notification title
 * @returns {string} Merchant name or 'Unknown'
 */
export function parseMerchant(text, title) {
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

/**
 * Parse a notification into a payment object
 *
 * @param {Object} notification - Raw notification object from listener
 * @returns {Object|null} Parsed payment or null if not a payment notification
 */
export function parsePaymentNotification(notification) {
	try {
		const data =
			typeof notification === "string"
				? JSON.parse(notification)
				: notification;

		// Only process Google Wallet notifications
		if (data.app !== GOOGLE_WALLET_PACKAGE) {
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
			type: "auto_payment",
			description: parseMerchant(text, title),
			source: "auto",
		};
	} catch (error) {
		console.error("Error parsing notification:", error);
		return null;
	}
}
