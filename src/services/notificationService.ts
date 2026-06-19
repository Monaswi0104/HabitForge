import notifee, { AndroidImportance, TriggerType, TimestampTrigger, RepeatFrequency, AndroidVisibility } from '@notifee/react-native';
import { Platform } from 'react-native';

class NotificationService {
  private channelId: string = 'habit-reminders';

  configure = async () => {
    // Request permissions (required for iOS and Android 13+)
    await notifee.requestPermission();

    // Create Android Channel
    if (Platform.OS === 'android') {
      this.channelId = await notifee.createChannel({
        id: 'habit-reminders',
        name: 'Habit Reminders',
        description: 'A channel for daily habit reminders',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: 'default',
        vibration: true,
      });
    }
  };

  scheduleHabitReminder = async (habitId: string, title: string, time: Date) => {
    const notificationId = `habit-${habitId}`;
    
    let scheduleDate = new Date(time);
    const now = new Date();
    
    // Align the year, month, and day to today's date so only the time matters
    scheduleDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

    // If that time today has already passed, schedule for tomorrow
    if (scheduleDate <= now) {
      scheduleDate.setDate(scheduleDate.getDate() + 1);
    }

    // Create a time-based trigger
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: scheduleDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY, // Repeat daily
    };

    // Create the notification
    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: 'HabitForge',
        body: `Time to: ${title}`,
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        }
      },
      trigger,
    );
  };

  cancelHabitReminder = async (habitId: string) => {
    await notifee.cancelNotification(`habit-${habitId}`);
  };

  cancelAll = async () => {
    await notifee.cancelAllNotifications();
  };
}

export const notificationService = new NotificationService();
