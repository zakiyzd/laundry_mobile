import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import "react-native-reanimated";
// 1. IMPORT SPLASH SCREEN NATIVE 👇
import * as SplashScreen from "expo-splash-screen";

// 2. TAHAN SPLASH SCREEN JANGAN DILEPAS OTOMATIS 👇
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Ambil session dari memori HP saat pertama kali menyala
  useEffect(() => {
    async function checkSession() {
      try {
        const role = await AsyncStorage.getItem("userRole");
        setUserRole(role);
      } catch (e) {
        console.error("Gagal membaca session booting:", e);
      } finally {
        // Jangan matikan loading dulu di sini agar sinkron
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  // Logika Auto-Login Redirect
  useEffect(() => {
    if (loading || hasRedirected) return;

    const currentSegment = segments.length > 0 ? segments[0] : "";
    const inAuthGroup = currentSegment === "(auth)" || currentSegment === "";

    const performRedirect = async () => {
      if (userRole) {
        if (inAuthGroup) {
          setHasRedirected(true);
          
          if (userRole === "customer") router.replace("/(customer)");
          else if (userRole === "admin") router.replace("/(admin)");
          else if (userRole === "owner") router.replace("/(owner)");
          
          // 3. SEMBUNYIKAN SPLASH SCREEN SETELAH RUTE BERHASIL DI-REPLACE 
          await SplashScreen.hideAsync();
        } else {
          // Jika sudah berada di dalam dashboard, langsung lepas splash screen
          await SplashScreen.hideAsync();
        }
      } else {
        if (!inAuthGroup) {
          setHasRedirected(true);
          router.replace("/");
        }
        // 4. LEPAS SPLASH SCREEN JIKA MEMANG USER BELUM LOGIN (Masuk landing page)
        await SplashScreen.hideAsync();
      }
    };

    performRedirect();
  }, [userRole, loading, segments, hasRedirected]);

  // 5. UBAH DI SINI: Jika masih loading, return null (biar Splash Screen bawaan yang nampil)
  if (loading) {
    return null; 
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/login_customer" />
      <Stack.Screen name="(auth)/register" />
      <Stack.Screen name="(admin)/index" />
      <Stack.Screen name="(customer)/index" />
      <Stack.Screen name="(owner)/index" />
    </Stack>
  );
}