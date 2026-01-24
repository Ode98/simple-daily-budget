const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Expo config plugin to add Widget Midnight Update receiver
 * for scheduling widget updates at midnight.
 */
function withWidgetMidnightUpdate(config) {
	return withAndroidManifest(config, async (config) => {
		const manifest = config.modResults.manifest;

		// Add permissions
		if (!manifest["uses-permission"]) {
			manifest["uses-permission"] = [];
		}

		const permissions = [
			"android.permission.RECEIVE_BOOT_COMPLETED",
			"android.permission.SCHEDULE_EXACT_ALARM",
			"android.permission.USE_EXACT_ALARM",
		];

		for (const permission of permissions) {
			const exists = manifest["uses-permission"].some(
				(p) => p.$?.["android:name"] === permission
			);
			if (!exists) {
				manifest["uses-permission"].push({
					$: { "android:name": permission },
				});
			}
		}

		// Ensure we have the application node
		if (!manifest.application) {
			manifest.application = [{}];
		}

		const application = manifest.application[0];

		// Add the receiver for midnight updates
		if (!application.receiver) {
			application.receiver = [];
		}

		// Check if receiver already exists
		const receiverExists = application.receiver.some(
			(receiver) =>
				receiver.$?.["android:name"] === ".widget.WidgetMidnightUpdateReceiver"
		);

		if (!receiverExists) {
			application.receiver.push({
				$: {
					"android:name": ".widget.WidgetMidnightUpdateReceiver",
					"android:exported": "false",
				},
				"intent-filter": [
					{
						action: [
							{
								$: {
									"android:name": "com.dailybudget.app.MIDNIGHT_UPDATE",
								},
							},
							{
								$: {
									"android:name": "android.intent.action.BOOT_COMPLETED",
								},
							},
						],
					},
				],
			});
		}

		return config;
	});
}

module.exports = withWidgetMidnightUpdate;
