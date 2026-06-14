import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  RefreshControl,
  BackHandler,
  ToastAndroid,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config'; 
import { Ionicons } from '@expo/vector-icons'; 

// TYPE DEFINITION BARU: Menyesuaikan JSON Relasi Laravel
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
  customer?: Customer;
  service?: ServiceRelasi;
};

export default function CustomerDashboard() {
  const { username, nomor_hp } = useLocalSearchParams();
  const router = useRouter();

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

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription.remove(); 
      };
    }, [])
  );

  // Menghitung cucian aktif (abaikan status diambil / selesai jika mau)
  const activeOrdersCount = orders.filter(item => item.status.toLowerCase() !== 'diambil').length;

const fetchMyOrders = async () => {
  try {
    setLoading(true);
    
    // Tembak endpoint check-status membawa parameter nomor_hp
    const response = await axios.post(`${API_URL}/orders/check-status`, {
      nomor_hp: nomor_hp,
    });
    
    // PERBAIKAN: Langsung masukkan array 'orders' dari Laravel ke dalam state
    if (response.data.success && response.data.orders) {
      setOrders(response.data.orders); // <--- Sudah otomatis berbentuk Array []
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

  useEffect(() => {
    if (nomor_hp) {
      fetchMyOrders();
    }
  }, [nomor_hp]);

  const handleLogout = () => {
    Alert.alert("Logout", "Apakah anda yakin ingin keluar dari akun pelanggan?", [
      { text: "Batal", style: "cancel" },
      { 
        text: "Keluar", 
        style: "destructive", 
        onPress: () => {
          router.replace('/(auth)/login_customer'); 
        } 
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Halo, Pelanggan Setia</Text>
          <Text style={styles.usernameText}>{username || 'Pelanggan'} 👋</Text>
        </View>
        <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      {/* STATS AREA */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Cucian Aktif</Text>
          <Text style={styles.statValue}>{activeOrdersCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>No. HP Anda</Text>
          <Text style={styles.statValueSmall}>{nomor_hp}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Riwayat Cucian Anda</Text>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#673AB7" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => {
                setRefreshing(true); 
                fetchMyOrders();
              }} 
            />
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  {/* MEMANGGIL NAMA LAYANAN VIA RELASI OBJECT */}
                  <Text style={styles.layananText}>{item.service?.nama_layanan || 'Layanan Laundry'}</Text>
                  <Text style={styles.dateText}>ID Pesanan: #00{item.id}</Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: item.status.toLowerCase() === 'diambil' ? '#4CAF50' : '#FF9800' }
                ]}>
                  <Text style={styles.statusText}>{item.status ? item.status.toUpperCase() : 'ANTRE'}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Kategori:</Text>
                  <Text style={styles.infoValue}>{item.berat > 0 ? 'Kiloan' : 'Satuan'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Detail:</Text>
                  <Text style={styles.infoValue}>
                    {item.berat > 0 ? `${item.berat} Kg` : 'Paket Satuan'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Alamat Kirim:</Text>
                  {/* MEMANGGIL ALAMAT VIA RELASI CUSTOMER */}
                  <Text style={styles.infoValue} numberOfLines={1}>{item.customer?.alamat || '-'}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.totalLabel}>Total Bayar:</Text>
                <Text style={styles.totalValue}>Rp {item.total_harga ? item.total_harga.toLocaleString('id-ID') : '0'}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Belum ada riwayat cucian untuk nomor ini.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcomeText: { fontSize: 14, color: '#888' },
  usernameText: { fontSize: 24, fontWeight: 'bold', color: '#673AB7' },
  logoutIcon: { padding: 10, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { backgroundColor: '#673AB7', width: '48%', padding: 15, borderRadius: 15, elevation: 4 },
  statLabel: { color: '#E1D5F5', fontSize: 12 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statValueSmall: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  orderCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 15, elevation: 2, borderTopWidth: 4, borderTopColor: '#673AB7' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  layananText: { fontSize: 16, fontWeight: 'bold', color: '#333', flexWrap: 'wrap' },
  dateText: { fontSize: 12, color: '#AAA', marginTop: 2 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardBody: { backgroundColor: '#F9F9F9', borderRadius: 12, padding: 12, marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, color: '#444', fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#333' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#673AB7' },
  emptyBox: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#BBB', textAlign: 'center' }
});