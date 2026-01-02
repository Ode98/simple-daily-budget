const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Expo config plugin to add Android Notification Listener Service
 * required for react-native-android-notification-listener
 */
function withAndroidNotificationListener(config) {
	return withAndroidManifest(config, async (config) => {
		const manifest = config.modResults.manifest;

		// Add tools namespace if not present
		if (!manifest.$) {
			manifest.$ = {};
		}
		manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

		// Ensure we have the application node
		if (!manifest.application) {
			manifest.application = [{}];
		}

		const application = manifest.application[0];

		// Fix manifest merger conflict: library has allowBackup=false, Expo has true
		if (!application.$) {
			application.$ = {};
		}
		application.$["tools:replace"] = "android:allowBackup";

		// Add the service for notification listening
		if (!application.service) {
			application.service = [];
		}

		// Check if service already exists
		const serviceExists = application.service.some(
			(service) =>
				service.$?.["android:name"] ===
				"com.lesimoes.androidnotificationlistener.NotificationService"
		);

		if (!serviceExists) {
			application.service.push({
				$: {
					"android:name":
						"com.lesimoes.androidnotificationlistener.NotificationService",
					"android:label": "Notification Listener",
					"android:permission":
						"android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
					"android:exported": "false",
				},
				"intent-filter": [
					{
						action: [
							{
								$: {
									"android:name":
										"android.service.notification.NotificationListenerService",
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

module.exports = withAndroidNotificationListener;
