import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  let token = null;

  // 1. Set saluran notifikasi khusus Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#673AB7',
    });
  }

  // 2. Minta izin resmi ke OS Android untuk memunculkan Notifikasi
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Izin notifikasi ditolak oleh pengguna!');
      return null;
    }
    
    // 3. Ambil Token Asli dari Server Expo berdasarkan Project ID kamu
    try {
      const expoPushTokenTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "750a276a-333a-4c55-9b3c-c17ee7d219ed", // Project ID dari app.json kamu
      });
      token = expoPushTokenTokenData.data;
    } catch (error) {
      console.log("Gagal mengambil token asli:", error);
    }
  }

  return token;
}
