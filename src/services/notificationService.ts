import PushNotification from 'react-native-push-notification';
import { Platform, Alert } from 'react-native';

class NotificationService {
  configure = () => {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        // Scheduled local notifications on Android do not trigger JS when they fire, 
        // they only trigger this callback when the user TAPS them.
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'habit-reminders',
          channelName: 'Habit Reminders',
          channelDescription: 'A channel for daily habit reminders',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`createChannel returned '${created}'`)
      );

      if (Platform.Version >= 33) {
        import('react-native').then(({ PermissionsAndroid }) => {
          PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        });
      }
    }
  };

  scheduleHabitReminder = (habitId: string, title: string, time: Date) => {
    // Generate a consistent numeric ID based on the string UUID
    const numericId = parseInt(habitId.replace(/[^0-9]/g, '').slice(0, 8)) || Math.floor(Math.random() * 100000);
    
    let scheduleDate = new Date(time);
    const now = new Date();
    
    // Align the year, month, and day to today's date so only the time matters
    scheduleDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

    // If that time today has already passed, schedule for tomorrow
    if (scheduleDate <= now) {
      scheduleDate.setDate(scheduleDate.getDate() + 1);
    }

    PushNotification.localNotificationSchedule({
      id: numericId.toString(),
      channelId: 'habit-reminders',
      title: 'Time for your habit!',
      message: `Don't forget to complete: ${title}`,
      date: scheduleDate,
      allowWhileIdle: true,
      repeatType: 'day',
    });
  };

  cancelHabitReminder = (habitId: string) => {
    const numericId = parseInt(habitId.replace(/[^0-9]/g, '').slice(0, 8)) || 0;
    if (numericId) {
      PushNotification.cancelLocalNotification(numericId.toString());
    }
  };

  cancelAll = () => {
    PushNotification.cancelAllLocalNotifications();
  };
}

export const notificationService = new NotificationService();
