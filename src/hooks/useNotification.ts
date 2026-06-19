import { useEffect, useState } from 'react';
import { requestNotificationPermissions, scheduleLocalNotification } from '../api/notificationService';

export const useNotification = () => {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const init = async () => {
      const granted = await requestNotificationPermissions();
      setHasPermission(granted);
    };
    init();
  }, []);

  const scheduleReminder = async (title: string, body: string, date: Date) => {
    if (hasPermission) {
      await scheduleLocalNotification(title, body, date);
    }
  };

  return { hasPermission, scheduleReminder };
};
