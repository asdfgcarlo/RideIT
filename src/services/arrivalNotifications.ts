import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function enableArrivalNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('arrivals', {
      name: 'Station arrival alerts',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function showArrivalNotification(station: string) {
  if (!(await Notifications.getPermissionsAsync()).granted) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Arriving at ${station}`,
      body: `You are arriving at ${station}. Prepare to get off at your destination.`,
      sound: 'default',
      data: { station, kind: 'arrival' },
    },
    trigger: Platform.OS === 'android' ? { channelId: 'arrivals' } : null,
  });
  return true;
}
