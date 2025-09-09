package com.commutetimely;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import androidx.annotation.NonNull;

public class AlarmManagerModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "AlarmManager";
    private final ReactApplicationContext reactContext;

    public AlarmManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void canScheduleExactAlarms(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                AlarmManager alarmManager = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
                if (alarmManager != null) {
                    promise.resolve(alarmManager.canScheduleExactAlarms());
                } else {
                    promise.resolve(false);
                }
            } else {
                // For Android versions below 12, exact alarms are allowed by default
                promise.resolve(true);
            }
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to check exact alarm permission", e);
        }
    }

    @ReactMethod
    public void scheduleExactAlarm(String alarmId, double triggerTime, String title, String message, Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                AlarmManager alarmManager = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
                if (alarmManager == null) {
                    promise.resolve(false);
                    return;
                }

                if (!alarmManager.canScheduleExactAlarms()) {
                    promise.resolve(false);
                    return;
                }
            }

            Context context = reactContext.getApplicationContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            
            if (alarmManager == null) {
                promise.resolve(false);
                return;
            }

            // Create intent for the alarm receiver
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra("alarmId", alarmId);
            intent.putExtra("title", title);
            intent.putExtra("message", message);
            intent.setAction("com.commutetimely.COMMUTE_ALARM_" + alarmId);

            // Create pending intent
            int requestCode = alarmId.hashCode();
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            long triggerTimeMillis = (long) triggerTime;

            // Schedule the exact alarm
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    // Android 12+ - use setExactAndAllowWhileIdle with exact permission
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerTimeMillis,
                        pendingIntent
                    );
                } else {
                    // Android 6-11 - use setExactAndAllowWhileIdle
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerTimeMillis,
                        pendingIntent
                    );
                }
            } else {
                // Android 5 and below - use setExact
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerTimeMillis,
                    pendingIntent
                );
            }

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to schedule exact alarm", e);
        }
    }

    @ReactMethod
    public void cancelAlarm(String alarmId, Promise promise) {
        try {
            Context context = reactContext.getApplicationContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            
            if (alarmManager == null) {
                promise.resolve(null);
                return;
            }

            // Create the same intent used for scheduling
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.setAction("com.commutetimely.COMMUTE_ALARM_" + alarmId);

            int requestCode = alarmId.hashCode();
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // Cancel the alarm
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();

            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to cancel alarm", e);
        }
    }
}
