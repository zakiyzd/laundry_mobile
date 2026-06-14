import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator,
  Modal,
  Alert,
  BackHandler,
  ToastAndroid
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config';
import { Ionicons } from '@expo/vector-icons'; 

export default function DashboardOwner() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const lastBackButtonPress = useRef(0);

  // LOGIKA BACK BUTTON FIXED
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

  // FIX AMBIL DATA RELASI BARU
  const fetchDataSelesai = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      const rawData = Array.isArray(response.data) ? response.data : response.data.data;

      if (rawData && Array.isArray(rawData)) {
        // PERBAIKAN 1: Mengubah 'Diambil' menjadi 'diambil' (Huruf kecil menyesuaikan DB baru)
        const dataSelesai = rawData.filter((item: any) => item.status === 'diambil');
        setOrders(dataSelesai);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Gagal mengambil data owner:", error);
      setOrders([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDataSelesai().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDataSelesai().finally(() => setRefreshing(false));
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Apakah anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: () => router.replace('/(auth)/login') }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Panel Owner Laundry</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.profileBtn}>
          <Ionicons name="person-circle-outline" size={32} color="#673AB7" />
        </TouchableOpacity>
      </View>

      {/* POP-UP MODAL MENU PROFIL */}
      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setMenuVisible(false);
                router.push('/(auth)/register');
              }}
            >
              <Ionicons name="person-add-outline" size={18} color="#333" />
              <Text style={styles.menuItemText}>Tambah Akun Baru</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setMenuVisible(false);
                handleLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={18} color="#D32F2F" />
              <Text style={[styles.menuItemText, { color: '#D32F2F' }]}>Keluar / Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.row}>
        <TouchableOpacity 
          style={[styles.cardNav, { backgroundColor: '#4CAF50' }]}
          onPress={() => router.push('/(admin)/laporan' as any)} // Disesuaikan ke file laporan.tsx kita tadi
        >
          <Text style={styles.cardLabel}>Cek</Text>
          <Text style={styles.cardTitle}>Laporan Pemasukan</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.cardNav, { backgroundColor: '#D32F2F' }]}
          onPress={() => router.push('/(owner)/laporan-pengeluaran' as any)}
        >
          <Text style={styles.cardLabel}>Cek</Text>
          <Text style={styles.cardTitle}>Laporan Pengeluaran</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Riwayat Cucian (Selesai)</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#673AB7" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item: any) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Belum ada riwayat transaksi selesai.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.cardTopAccent} />
              <View style={styles.orderHeader}>
                {/* PERBAIKAN 2: Mengambil nama dari object customer */}
                <Text style={styles.customerName}>{item.customer?.username || 'Pelanggan'}</Text>
                {/* PERBAIKAN 3: Mengambil nama layanan master dari object service */}
                <Text style={styles.serviceName}>{item.service?.nama_layanan || 'Layanan'}</Text>
              </View>

              <View style={styles.detailBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tanggal :</Text>
                  <Text style={styles.detailValue}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kategori :</Text>
                  <Text style={styles.detailValue}>
                    {/* PERBAIKAN 4: Kondisional penentu kategori kiloan vs satuan */}
                    {item.berat > 0 ? 'Kiloan' : 'Satuan'} {item.jenis_satuan ? `(${item.jenis_satuan})` : ''}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Detail Berat :</Text>
                  <Text style={styles.detailValue}>
                    {item.berat > 0 ? `${parseFloat(item.berat).toFixed(2).replace(/\.?0+$/, "")} Kg` : 'Paket Per Item'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Alamat :</Text>
                  {/* PERBAIKAN 5: Mengambil dari alamat object customer baru */}
                  <Text style={styles.detailValue}>{item.customer?.alamat || item.alamat || '-'}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.totalLabel}>Total Bayar :</Text>
                <Text style={styles.totalValue}>Rp {Number(item.total_harga).toLocaleString('id-ID')}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 50 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#673AB7' },
  profileBtn: { padding: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  menuBox: { backgroundColor: '#fff', marginTop: 85, marginRight: 20, borderRadius: 12, padding: 8, width: 190, elevation: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  menuItemText: { marginLeft: 10, fontSize: 14, fontWeight: '500', color: '#333' },
  menuDivider: { height: 1, backgroundColor: '#eee', marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  cardNav: { width: '48%', padding: 15, borderRadius: 15, elevation: 3 },
  cardLabel: { color: '#eee', fontSize: 11 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 5 },
  sectionTitle: { fontSize: 16, color: '#333', marginBottom: 15, fontWeight: '600' },
  orderCard: { backgroundColor: '#fff', borderRadius: 15, elevation: 4, marginBottom: 20, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: '#eee' },
  cardTopAccent: { height: 8, backgroundColor: '#673AB7' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, paddingBottom: 10 },
  customerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  serviceName: { fontSize: 14, fontWeight: 'bold', color: '#673AB7' },
  detailBox: { backgroundColor: '#f5f5f5', marginHorizontal: 15, padding: 10, borderRadius: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  detailLabel: { color: '#888', fontSize: 13 },
  detailValue: { color: '#444', fontSize: 13, fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  totalLabel: { color: '#888', fontSize: 13 },
  totalValue: { color: '#673AB7', fontWeight: 'bold', fontSize: 15 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 50, fontSize: 14 }
});