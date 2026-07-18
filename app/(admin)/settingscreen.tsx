import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();

  const menuItems = [
    {
      title: "Manajemen Akun",
      description: "Tambah akun baru untuk admin atau owner",
      icon: "people-outline",
      iconColor: "#4CAF50",
      path: "/register" as const,
    },
    {
      title: "Kelola Tarif Laundry",
      description: "Ubah nominal harga paket laundry",
      icon: "cash-outline",
      iconColor: "#FF9800",
      path: "/kelolaharga" as const,
    },
    {
      title: "WhatsApp Gateway",
      description: "Cek status server, scan QR baru, atau putus tautan nomor",
      icon: "logo-whatsapp",
      iconColor: "#25D366",
      path: "/configgateway" as const,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Pengaturan Sistem</Text>
      <Text style={styles.subtitle}>
        Konfigurasi dan kelola MM Laundry Anda
      </Text>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.item,
              index === menuItems.length - 1 && { borderBottomWidth: 0 }, // Hilangkan garis bawah untuk item terakhir
            ]}
            onPress={() => router.push(item.path)}
            activeOpacity={0.7}
          >
            {/* Bagian Kiri: Ikon */}
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: item.iconColor + "15" },
              ]}
            >
              <Ionicons
                name={item.icon as any}
                size={22}
                color={item.iconColor}
              />
            </View>

            {/* Bagian Tengah: Teks Konten */}
            <View style={styles.textWrapper}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>

            {/* Bagian Kanan: Tanda Panah */}
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer Info Versi Aplikasi Otomatis */}
      <Text style={styles.versionText}>
        MM Laundry v{Constants.expoConfig?.version || "1.0.0"}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 25,
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    // Soft Shadow Modern
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textWrapper: {
    flex: 1,
    paddingRight: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  itemDescription: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    color: "#BBB",
    marginTop: 40,
    fontWeight: "500",
  },
});
