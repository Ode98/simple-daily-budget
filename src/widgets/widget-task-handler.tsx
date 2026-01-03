import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { BudgetWidget } from "./BudgetWidget";

const DEFAULT_BUDGET = "Open app";

/**
 * Widget task handler that renders the BudgetWidget.
 * This is called by Android when the widget needs to be rendered.
 *
 * Note: Without SharedPreferences, the widget shows a default message
 * until the app runs and triggers an update via requestWidgetUpdate().
 */
export async function widgetTaskHandler(
	props: WidgetTaskHandlerProps
): Promise<void> {
	switch (props.widgetAction) {
		case "WIDGET_ADDED":
		case "WIDGET_UPDATE":
		case "WIDGET_RESIZED":
			// Render widget with default/placeholder text
			// The actual budget will be provided when the app triggers
			// requestWidgetUpdate() with the real data
			props.renderWidget(<BudgetWidget budget={DEFAULT_BUDGET} />);
			break;

		case "WIDGET_DELETED":
			// Clean up if needed
			break;

		case "WIDGET_CLICK":
			// Handle click action - OPEN_APP is handled automatically
			break;

		default:
			break;
	}
}
