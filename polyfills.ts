/**
 * Polyfills for Hermes headless task compatibility.
 * This file MUST be imported at the very top of index.ts before anything else.
 *
 * Hermes disables microtasks in headless/background mode for release builds,
 * which causes crashes when using setImmediate (and thus async/await via Promises).
 */

// Polyfill setImmediate if not available
if (typeof setImmediate === "undefined") {
	(global as any).setImmediate = (
		fn: (...args: any[]) => void,
		...args: any[]
	) => setTimeout(() => fn(...args), 0);
}

// Polyfill queueMicrotask to use setTimeout instead
// This prevents "Could not enqueue microtask" errors in Hermes headless mode
if (typeof queueMicrotask === "undefined") {
	(global as any).queueMicrotask = (fn: () => void) => setTimeout(fn, 0);
} else {
	// Override queueMicrotask even if defined, as it may throw in headless mode
	const originalQueueMicrotask = queueMicrotask;
	(global as any).queueMicrotask = (fn: () => void) => {
		try {
			originalQueueMicrotask(fn);
		} catch {
			setTimeout(fn, 0);
		}
	};
}

export {};
