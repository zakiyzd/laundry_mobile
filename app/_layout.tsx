import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
 <Stack screenOptions={{ headerShown: false }}>
  {/* Halaman Pertama yang Muncul */}
  <Stack.Screen name="index" /> 
  
  {/* Halaman Lainnya */}
  <Stack.Screen name="(auth)/login" />
  <Stack.Screen name="(auth)/login_customer" />
  <Stack.Screen name="(auth)/register" />
  <Stack.Screen name="(admin)/index" />
  <Stack.Screen name="(customer)/index" />
</Stack>
  );
}
