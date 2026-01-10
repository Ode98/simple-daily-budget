const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

export default {
	expo: {
		name: IS_DEV
			? "Daily Budget (Dev)"
			: IS_PREVIEW
			? "Daily Budget (Prev)"
			: "Daily Budget",
		slug: "simple-daily-budget",
		version: "1.0.0",
		orientation: "portrait",
		icon: "./assets/icon.png",
		userInterfaceStyle: "dark",
		newArchEnabled: true,
		splash: {
			image: "./assets/splash-icon.png",
			resizeMode: "contain",
			backgroundColor: "#1a1a2e",
		},
		android: {
			adaptiveIcon: {
				foregroundImage: "./assets/adaptive-icon.png",
				backgroundColor: "#1a1a2e",
			},
			package: IS_DEV
				? "com.dailybudget.app.dev"
				: IS_PREVIEW
				? "com.dailybudget.app.preview"
				: "com.dailybudget.app",
		},
		plugins: [
			"./plugins/withAndroidNotificationListener",
			"expo-asset",
			[
				"react-native-android-widget",
				{
					widgets: [
						{
							name: "BudgetWidget",
							label: "Daily Budget",
							minWidth: "110dp",
							minHeight: "40dp",
							targetCellWidth: 2,
							targetCellHeight: 1,
						},
					],
				},
			],
		],
		extra: {
			eas: {
				projectId: "a77ebbed-00e9-47e5-a379-10665aea5767",
			},
		},
		ios: {
			bundleIdentifier: "com.dailybudget.app",
		},
	},
};
