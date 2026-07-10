import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

export default function RootLayout() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<string>("index");

  // 1. Cek memori internal HANYA SEKALI saat aplikasi pertama kali menyala
  useEffect(() => {
    async function determineInitialRoute() {
      try {
        const role = await AsyncStorage.getItem("userRole");
        
        if (role === "customer") {
          setInitialRoute("(customer)/index");
        } else if (role === "admin") {
          setInitialRoute("(admin)/index");
        } else if (role === "owner") {
          setInitialRoute("(owner)/index");
        } else {
          setInitialRoute("index"); // Jika null, tetap di landing page
        }
      } catch (e) {
        console.error("Gagal membaca session booting:", e);
      } finally {
        setLoading(false);
      }
    }

    determineInitialRoute();
  }, []);

  // 2. Selama ngecek AsyncStorage, tahan di Splash/Loading Screen bawaan
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator size="large" color="#673AB7" />
      </View>
    );
  }

  // 3. Render Stack dengan mengunci 'initialRouteName' sesuai hasil memori HP
  return (
    <Stack 
      screenOptions={{ headerShown: false }} 
      initialRouteName={initialRoute as any} // 👈 KUNCINYA DI SINI
    >
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