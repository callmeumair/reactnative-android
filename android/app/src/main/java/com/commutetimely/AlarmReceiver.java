package com.commutetimely;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "commute-alarms";
    private static final String CHANNEL_NAME = "Commute Alarms";

    @Override
    public void onReceive(Context context, Intent intent) {
        String alarmId = intent.getStringExtra("alarmId");
        String title = intent.getStringExtra("title");
        String message = intent.getStringExtra("message");

        if (alarmId == null || title == null || message == null) {
            return;
        }

        createNotificationChannel(context);
        showNotification(context, alarmId, title, message);
    }

    private void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications for commute reminders");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 1000, 500, 1000});
            channel.enableLights(true);

            NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private void showNotification(Context context, String alarmId, String title, String message) {
        try {
            // Create intent to open the app when notification is tapped
            Intent appIntent = new Intent(context, MainActivity.class);
            appIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                alarmId.hashCode(),
                appIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // Build the notification
            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setVibrate(new long[]{0, 1000, 500, 1000})
                .setDefaults(NotificationCompat.DEFAULT_SOUND | NotificationCompat.DEFAULT_LIGHTS);

            // Show the notification
            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
            notificationManager.notify(alarmId.hashCode(), builder.build());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
