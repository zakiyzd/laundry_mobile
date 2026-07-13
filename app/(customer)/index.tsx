import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../config";

// TYPE DEFINITION
type Customer = {
  id: number;
  username: string;
  nomor_hp: string;
  alamat: string;
};

type ServiceRelasi = {
  id: number;
  nama_layanan: string;
};

type Order = {
  id: number;
  id_pelanggan: number;
  id_services: number;
  berat: number;
  status: string;
  total_harga: number;
  created_at: string;
  jenis_satuan?: string; // <-- TAMBAHAN: Properti jenis satuan dari backend
  customer?: Customer;
  service?: ServiceRelasi;
};

export default function CustomerDashboard() {
  const params = useLocalSearchParams(); // Jangan langsung di-destructure di sini agar tidak error
  const router = useRouter();

  //  2. Buat state dinamis untuk menampung data profil customer
  const [displayUsername, setDisplayUsername] = useState("");
  const [displayNomorHp, setDisplayNomorHp] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- LOGIKA BACK BUTTON (DOUBLE TAP TO EXIT) ---
  const lastBackButtonPress = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const currentTime = Date.now();
        if (currentTime - lastBackButtonPress.current < 2000) {
          BackHandler.exitApp();
          return true;
        }

        lastBackButtonPress.current = currentTime;
        ToastAndroid.show("Klik sekali lagi untuk keluar", ToastAndroid.SHORT);
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => {
        subscription.remove();
      };
    }, []),
  );

  const activeOrdersCount = orders.filter(
    (item) => item.status.toLowerCase() !== "diambil",
  ).length;

  // 🔥 3. Fungsi fetch data disesuaikan untuk menerima parameter noHp lokal
  const fetchMyOrders = async (currentHp: string) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/orders/check-status`, {
        nomor_hp: currentHp, // 🔥 Pakai no HP hasil deteksi storage/params
      });

      if (response.data.success && response.data.orders) {
        setOrders(response.data.orders);
      } else {
        setOrders([]);
      }
    } catch (error: any) {
      console.error("Gagal ambil data customer:", error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔥 4. Logika inisialisasi data profil & penembakan API
  useEffect(() => {
    async function initDashboard() {
      // Skenario A: Masuk dari login normal (params bawa data lengkap)
      if (params.username && params.nomor_hp) {
        setDisplayUsername(params.username as string);
        setDisplayNomorHp(params.nomor_hp as string);
        fetchMyOrders(params.nomor_hp as string);
      }
      // Skenario B: Masuk lewat pintu Auto-Login (params kosong)
      else {
        const storedUsername = await AsyncStorage.getItem("customerUsername");
        const storedHp = await AsyncStorage.getItem("customerHp");

        if (storedHp) {
          setDisplayUsername(storedUsername || "Pelanggan");
          setDisplayNomorHp(storedHp);
          fetchMyOrders(storedHp); // Tembak API pakai data dari memori HP
        } else {
          // Jika di memori juga kosong (kondisi tidak normal), paksa balik ke login
          router.replace("/(auth)/login_customer");
        }
      }
    }

    initDashboard();
  }, [params.nomor_hp]);

  // 🔥 5. Bersihkan data AsyncStorage saat klik LOGOUT
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Apakah anda yakin ingin keluar dari akun pelanggan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Keluar",
          style: "destructive",
          onPress: async () => {
            // Hapus semua data session login customer dari HP
            await AsyncStorage.removeItem("userRole");
            await AsyncStorage.removeItem("customerHp");
            await AsyncStorage.removeItem("customerUsername");

            router.replace("/");
          },
        },
      ],
    );
  };

  const getStatusStyle = (status: string) => {
    const statusClean = status ? status.toLowerCase() : "antre";
    switch (statusClean) {
      case "diambil":
        return { bg: "#E8F5E9", text: "#2E7D32", dot: "#4CAF50" };
      case "antre":
      case "proses":
      case "diproses":
      case "selesai":
      default:
        return { bg: "#FFF3E0", text: "#E65100", dot: "#FF9800" };
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER BAR PREMIUM */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerSubtitle}>
            Selamat Datang, Pelanggan Setia
          </Text>
          <Text style={styles.headerTitle}>
            {displayUsername || "Pelanggan"} 👋
          </Text>
        </View>
        <TouchableOpacity style={styles.avatarWrapper} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      {/* METRIC CARD DASHBOARD HERO */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>CUCIAN AKTIF</Text>
          <Text style={styles.statValue}>{activeOrdersCount}</Text>
          {/* <Text style={styles.statSubText}>Nota Diproses</Text> */}
        </View>

        <View style={[styles.statCard, { backgroundColor: "#673AB7" }]}>
          <Text style={[styles.statLabel, { color: "#E1D5F5" }]}>
            NOMOR HP ANDA
          </Text>
          <Text style={[styles.statValueSmall, { color: "#FFF" }]}>
            {displayNomorHp || "-"}
          </Text>
          <Text style={[styles.statSubText, { color: "#E1D5F5" }]}>
            ID Terverifikasi
          </Text>
        </View>
      </View>

      <Text style={styles.sectionHeading}>Riwayat Cucian Anda</Text>

      {/* FEED LIST DATA ORDERS */}
      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color="#673AB7"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchMyOrders(displayNomorHp);
              }}
              colors={["#673AB7"]}
            />
          }
          renderItem={({ item }) => {
            const statusStyle = getStatusStyle(item.status);
            return (
              <View style={styles.neoOrderCard}>
                <View style={styles.cardMainHeader}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.neoLayananText}>
                      {item.service?.nama_layanan || "Layanan Laundry"}
                    </Text>
                    <Text style={styles.neoDateText}>
                      ID Pesanan: #00{item.id}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.capsuleBadge,
                      { backgroundColor: statusStyle.bg },
                    ]}
                  >
                    <View
                      style={[
                        styles.dotIndicator,
                        { backgroundColor: statusStyle.dot },
                      ]}
                    />
                    <Text
                      style={[
                        styles.capsuleBadgeText,
                        { color: statusStyle.text },
                      ]}
                    >
                      {(item.status || "ANTRE").toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* DETAILS METADATA CONTAINER */}
                <View style={styles.metaDataContainer}>
                  <View style={styles.metaRow}>
                    <Ionicons name="cube-outline" size={13} color="#777" />
                    <Text style={styles.metaText}>
                      Kategori: {item.berat > 0 ? "Kiloan" : "Satuan"}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="scale-outline" size={13} color="#777" />
                    <Text style={styles.metaText}>
                      {/* Label dinamis: Jika berat > 0 tampilkan 'Berat:', jika tidak tampilkan 'Item:' */}
                      {item.berat > 0 ? "Berat: " : "Item: "}

                      {/* Nilai dinamis */}
                      {item.berat > 0
                        ? `${item.berat} Kg`
                        : `${item.jenis_satuan || "-"}`}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={13} color="#777" />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "long", year: "numeric" },
                          )
                        : "-"}
                    </Text>
                  </View>
                </View>

                {/* FOOTER AREA */}
                <View style={styles.cardFooterArea}>
                  <Text style={styles.priceMetaLabel}>TOTAL</Text>
                  <Text style={styles.priceMetaValue}>
                    Rp{" "}
                    {item.total_harga
                      ? item.total_harga.toLocaleString("id-ID")
                      : "0"}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons
                name="information-circle-outline"
                size={40}
                color="#BBB"
              />
              <Text style={styles.emptyText}>
                Belum ada riwayat cucian untuk nomor ini.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: "#F4F6FA" },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 50,
    marginBottom: 25,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#673AB7",
    marginTop: 1,
  },
  avatarWrapper: {
    backgroundColor: "#EFEFF4",
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#673AB7",
    padding: 16,
    borderRadius: 22,
    elevation: 2,
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statValue: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 2 },
  statValueSmall: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 13,
    marginBottom: 1,
  },
  statSubText: {
    color: "#E1D5F5",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1C1C1E",
    marginBottom: 15,
  },
  neoOrderCard: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    elevation: 1,
  },
  cardMainHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  neoLayananText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1C1C1E",
    flexWrap: "wrap",
  },
  neoDateText: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 3,
    fontWeight: "500",
  },
  capsuleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 5,
  },
  dotIndicator: { width: 6, height: 6, borderRadius: 3 },
  capsuleBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  metaDataContainer: {
    marginVertical: 14,
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metaText: { fontSize: 12, color: "#555", fontWeight: "500" },
  cardFooterArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 2,
  },
  priceMetaLabel: {
    fontSize: 10,
    color: "#8E8E93",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  priceMetaValue: { fontSize: 18, fontWeight: "900", color: "#673AB7" },
  emptyBox: { alignItems: "center", marginTop: 60, gap: 8 },
  emptyText: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
