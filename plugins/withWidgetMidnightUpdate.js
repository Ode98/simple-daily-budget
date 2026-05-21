const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const RECEIVER_JAVA = `package com.dailybudget.app.widget;

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
    private static final String ACTION_MIDNIGHT_UPDATE = "com.dailybudget.app.MIDNIGHT_UPDATE";

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

/**
 * Expo config plugin to add Widget Midnight Update receiver
 * for scheduling widget updates at midnight.
 */
function withWidgetMidnightUpdate(config) {
	config = withAndroidManifest(config, async (config) => {
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

	config = withDangerousMod(config, [
		"android",
		async (config) => {
			const projectRoot = config.modRequest.projectRoot;
			const widgetDirPath = path.join(
				projectRoot,
				"android",
				"app",
				"src",
				"main",
				"java",
				"com",
				"dailybudget",
				"app",
				"widget"
			);

			if (!fs.existsSync(widgetDirPath)) {
				fs.mkdirSync(widgetDirPath, { recursive: true });
			}

			// Write WidgetMidnightUpdateReceiver.java
			const receiverPath = path.join(widgetDirPath, "WidgetMidnightUpdateReceiver.java");
			fs.writeFileSync(receiverPath, RECEIVER_JAVA);

			// Modify BudgetWidget.java to call scheduleNextUpdate in onUpdate
			const budgetWidgetPath = path.join(widgetDirPath, "BudgetWidget.java");
			if (fs.existsSync(budgetWidgetPath)) {
				let content = fs.readFileSync(budgetWidgetPath, "utf-8");
				
				// Ensure we have imports (Context, AppWidgetManager)
				if (!content.includes("import android.content.Context;")) {
					content = content.replace(
						"import com.reactnativeandroidwidget.RNWidgetProvider;",
						"import com.reactnativeandroidwidget.RNWidgetProvider;\nimport android.content.Context;\nimport android.appwidget.AppWidgetManager;"
					);
				}

				// Check if onUpdate is already overridden
				if (!content.includes("public void onUpdate(")) {
					const onUpdateMethod = `
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        super.onUpdate(context, appWidgetManager, appWidgetIds);
        WidgetMidnightUpdateReceiver.scheduleNextUpdate(context);
    }
`;
					// Insert the method before the last brace
					const lastBraceIndex = content.lastIndexOf("}");
					if (lastBraceIndex !== -1) {
						content = content.substring(0, lastBraceIndex) + onUpdateMethod + "}\n";
					}
				}
				
				fs.writeFileSync(budgetWidgetPath, content);
			}

			return config;
		},
	]);

	return config;
}

module.exports = withWidgetMidnightUpdate;
