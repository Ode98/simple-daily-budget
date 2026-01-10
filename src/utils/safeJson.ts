/**
 * Safely parse JSON with a fallback value
 * Prevents crashes from corrupted or invalid JSON data
 */
export function safeJsonParse<T>(json: string | null, fallback: T): T {
	if (!json) {
		return fallback;
	}

	try {
		return JSON.parse(json) as T;
	} catch (error) {
		console.error("Failed to parse JSON:", error);
		console.error("Invalid JSON string:", json.substring(0, 100));
		return fallback;
	}
}

/**
 * Validate that a value is an array, return empty array if not
 */
export function ensureArray<T>(value: unknown): T[] {
	if (Array.isArray(value)) {
		return value as T[];
	}
	console.error("Expected array but got:", typeof value);
	return [];
}

/**
 * Validate that a value is an object (non-null), return null if not
 */
export function ensureObject<T extends object>(value: unknown): T | null {
	if (value !== null && typeof value === "object" && !Array.isArray(value)) {
		return value as T;
	}
	console.error("Expected object but got:", typeof value);
	return null;
}
