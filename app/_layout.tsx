import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const router = useRouter();
  const [isAppReady, setIsAppReady] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // 1. Jalankan pengecekan memori HANYA SATU KALI saat aplikasi benar-benar booting dari awal
  useEffect(() => {
    async function prepareApp() {
      try {
        // Ambil data login dari memori HP
        const role = await AsyncStorage.getItem("userRole");
        setUserRole(role);
      } catch (e) {
        console.error("Gagal membaca AsyncStorage", e);
      } finally {
        // Tandai bahwa aplikasi sudah selesai membaca memori
        setIsAppReady(true);
      }
    }

    prepareApp();
  }, []);

// 2. Lakukan pengalihan halaman secara aman HANYA setelah proses baca memori selesai
  useEffect(() => {
    if (!isAppReady) return;

    if (userRole === "customer") {
      router.replace("/(customer)");
    } else if (userRole === "admin") {
      router.replace("/(admin)");
    } 
    // 🔥 TAMBAHKAN BLOK INI BIAR ROLE OWNER IKUT DIKENALI
    else if (userRole === "owner") {
      router.replace("/(owner)");
    }
    // Jika userRole === null atau selain di atas, rute otomatis diam di halaman utama (index.tsx)
  }, [isAppReady, userRole]);

  // 3. Selama aplikasi masih membaca memori HP, kunci di layar loading agar tidak kedut-kedut
  if (!isAppReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator size="large" color="#673AB7" />
      </View>
    );
  }

  // 4. Jika sudah siap, tampilkan Stack Navigator
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