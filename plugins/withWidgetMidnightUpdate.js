const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

function getReceiverJava(androidPackage, widgetPackage) {
	return `package ${widgetPackage};

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import java.util.Calendar;

public class WidgetMidnightUpdateReceiver extends BroadcastReceiver {
    private static final String ACTION_MIDNIGHT_UPDATE = "${androidPackage}.MIDNIGHT_UPDATE";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && (ACTION_MIDNIGHT_UPDATE.equals(intent.getAction()) || Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()))) {
            scheduleNextUpdate(context);

            // Trigger a widget update
            Intent updateIntent = new Intent(context, BudgetWidget.class);
            updateIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            int[] ids = AppWidgetManager.getInstance(context).getAppWidgetIds(new ComponentName(context, BudgetWidget.class));
            updateIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            context.sendBroadcast(updateIntent);
        }
    }

    public static void scheduleNextUpdate(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, WidgetMidnightUpdateReceiver.class);
        intent.setAction(ACTION_MIDNIGHT_UPDATE);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, flags);

        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(System.currentTimeMillis());
        calendar.add(Calendar.DAY_OF_YEAR, 1);
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);

        if (alarmManager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
            }
        }
    }
}
`;
}

function getWidgetJavaDir(projectRoot, androidPackage) {
	return path.join(
		projectRoot,
		"android",
		"app",
		"src",
		"main",
		"java",
		...androidPackage.split("."),
		"widget"
	);
}

/**
 * Expo config plugin to add Widget Midnight Update receiver
 * for scheduling widget updates at midnight.
 */
function withWidgetMidnightUpdate(config) {
	const androidPackage = config.android?.package;
	if (!androidPackage) {
		throw new Error(
			"withWidgetMidnightUpdate requires android.package in app config"
		);
	}
	const widgetPackage = `${androidPackage}.widget`;
	const midnightAction = `${androidPackage}.MIDNIGHT_UPDATE`;

	config = withAndroidManifest(config, async (config) => {
		const manifest = config.modResults.manifest;

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

		if (!manifest.application) {
			manifest.application = [{}];
		}

		const application = manifest.application[0];

		if (!application.receiver) {
			application.receiver = [];
		}

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
									"android:name": midnightAction,
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

	config = withDangerousMod(config, [
		"android",
		async (config) => {
			const projectRoot = config.modRequest.projectRoot;
			const widgetDirPath = getWidgetJavaDir(projectRoot, androidPackage);

			if (!fs.existsSync(widgetDirPath)) {
				fs.mkdirSync(widgetDirPath, { recursive: true });
			}

			const receiverPath = path.join(
				widgetDirPath,
				"WidgetMidnightUpdateReceiver.java"
			);
			fs.writeFileSync(
				receiverPath,
				getReceiverJava(androidPackage, widgetPackage)
			);

			// Written after react-native-android-widget (dangerous mods run in reverse
			// registration order, so this plugin must be registered before it).
			const budgetWidgetPath = path.join(widgetDirPath, "BudgetWidget.java");
			fs.writeFileSync(
				budgetWidgetPath,
				`package ${widgetPackage};

import com.reactnativeandroidwidget.RNWidgetProvider;
import android.content.Context;
import android.appwidget.AppWidgetManager;

public class BudgetWidget extends RNWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        super.onUpdate(context, appWidgetManager, appWidgetIds);
        WidgetMidnightUpdateReceiver.scheduleNextUpdate(context);
    }
}
`
			);

			return config;
		},
	]);

	return config;
}

module.exports = withWidgetMidnightUpdate;
