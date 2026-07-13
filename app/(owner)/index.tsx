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
  ToastAndroid,
  TextInput
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config';
import { Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DashboardOwner() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  // FUNGSI GAYA STATUS DINAMIS (HIJAU UNTUK DIAMBIL, OREN UNTUK SISANYA)
  const getStatusStyle = (status: string) => {
    const statusClean = status ? status.toLowerCase() : 'antre';
    switch (statusClean) {
      case 'diambil':
        return { bg: '#E8F5E9', text: '#2E7D32', dot: '#4CAF50' };
      case 'antre':
      case 'proses':
      case 'diproses':
      case 'selesai':
      default:
        return { bg: '#FFF3E0', text: '#E65100', dot: '#FF9800' };
    }
  };

  // AMBIL DATA RELASI BARU (SEMUA TRANSAKSI TANPA FILTER STATUS DI LINGKUP AKUN OWNER)
  const fetchDataSelesai = async () => {
    if (isLoggingOut) return; // 🔥 1. SELIPKAN INI DI BARIS PERTAMA
    try {
      const response = await axios.get(`${API_URL}/orders`);
      const rawData = Array.isArray(response.data) ? response.data : response.data.data;

      if (rawData && Array.isArray(rawData)) {
        // PERBAIKAN: Mengambil seluruh data cucian tanpa memfilternya ke status 'diambil' saja
        const dataSemua = rawData; 
        setOrders(dataSemua);
        
        if (searchQuery.trim() === '') {
          setFilteredOrders(dataSemua);
        } else {
          const filtered = dataSemua.filter((item: any) =>
            item.customer?.username?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setFilteredOrders(filtered);
        }
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (error) {
      console.error("Gagal mengambil data owner:", error);
      setOrders([]);
      setFilteredOrders([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDataSelesai().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDataSelesai().finally(() => setRefreshing(false));
  }, [searchQuery]);

  // LOGIKA FILTER PENCARIAN NAMA
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter((item: any) =>
        item.customer?.username?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  };

 const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Apakah anda yakin ingin keluar?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Keluar",
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Set saklar logout jadi true (jika di owner kamu pakai fetchData juga)
              if (typeof setIsLoggingOut === "function") {
                setIsLoggingOut(true);
              }

              // 2. Sapu bersih memori penyimpanan di HP
              await AsyncStorage.clear();

              // 3. Tembak langsung ke halaman login biar fix anti-mental
              router.replace("/(auth)/login");

            } catch (error) {
              console.error("Gagal logout owner:", error);
              router.replace("/(auth)/login");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER BAR PREMIUM */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerSubtitle}>Selamat Datang,</Text>
          <Text style={styles.headerTitle}>Owner Laundry</Text>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.avatarWrapper}>
          <Ionicons name="person" size={20} color="#673AB7" />
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
                handleLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={18} color="#D32F2F" />
              <Text style={[styles.menuItemText, { color: '#D32F2F' }]}>Keluar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FIX: LAYOUT TOMBOL LAPORAN SAMPINGAN KANAN KIRI */}
      <View style={styles.menuRowSejajar}>
        <TouchableOpacity 
          style={[styles.btnMenuHalf, { backgroundColor: '#4CAF50' }]}
          onPress={() => router.push('/(admin)/laporan' as any)}
        >
          <Ionicons name="receipt" size={18} color="white" style={{ marginBottom: 4 }} />
          <Text style={styles.cardLabel}>Cek</Text>
          <Text style={styles.cardTitle}>Laporan Pendapatan</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btnMenuHalf, { backgroundColor: '#D32F2F' }]}
          onPress={() => router.push('/(owner)/laporan-pengeluaran' as any)}
        >
          <Ionicons name="wallet" size={18} color="white" style={{ marginBottom: 4 }} />
          <Text style={styles.cardLabel}>Cek</Text>
          <Text style={styles.cardTitle}>Laporan Pengeluaran</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH ROW SEJAJAR JUDUL */}
      <View style={styles.searchRow}>
        <Text style={styles.sectionTitle}>Riwayat Cucian</Text>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={13} color="#A0A0A0" style={{ marginRight: 6 }} />
          <TextInput 
            style={styles.searchInputField} 
            placeholder="Cari nama..." 
            placeholderTextColor="#A0A0A0"
            value={searchQuery} 
            onChangeText={handleSearch} 
          />
        </View>
      </View>

      {/* FEED LIST ORDER RIWAYAT */}
      {loading ? (
        <ActivityIndicator size="large" color="#673AB7" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item: any) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Tidak ada riwayat transaksi yang cocok.</Text>
          }
          renderItem={({ item }) => {
            // Memanggil konfigurasi style warna dinamis berdasarkan status item
            const currentStatusStyle = getStatusStyle(item.status);

            return (
              <View style={styles.neoOrderCard}>
                <View style={styles.cardMainHeader}>
                  <View>
                    <Text style={styles.neoCustName}>{item.customer?.username || 'Pelanggan'}</Text>
                    <Text style={styles.neoDateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</Text>
                  </View>
                  {/* PERBAIKAN: Pewarnaan dinamis diatur mengikuti status cucian */}
                  <View style={[styles.capsuleBadge, { backgroundColor: currentStatusStyle.bg }]}>
                    <View style={[styles.dotIndicator, { backgroundColor: currentStatusStyle.dot }]} />
                    <Text style={[styles.capsuleBadgeText, { color: currentStatusStyle.text }]}>
                      {item.status ? item.status.toUpperCase() : 'ANTRE'}
                    </Text>
                  </View>
                </View>

                {/* DETAILS METADATA BOX */}
                <View style={styles.metaDataContainer}>
                  {/* TAMBAHAN BARIS ID PESANAN DI ATAS KATEGORI */}
                  <View style={styles.metaRow}>
                    <Ionicons name="barcode-outline" size={13} color="#777" />
                    <Text style={styles.metaText}>
                      ID: #{String(item.id).padStart(4, '0')}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="cube-outline" size={13} color="#777" />
                    <Text style={styles.metaText}>
                      Kategori: {item.berat > 0 ? 'Kiloan' : 'Satuan'} {item.jenis_satuan ? `(${item.jenis_satuan})` : ''}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="scale-outline" size={13} color="#777" />
                    <Text style={styles.metaText}>
                      Detail: {item.berat > 0 ? `${parseFloat(item.berat).toFixed(2).replace(/\.?0+$/, "")} Kg` : 'Paket Per Item'}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={13} color="#777" />
                    <Text style={styles.metaText} numberOfLines={1}>Alamat: {item.customer?.alamat || item.alamat || '-'}</Text>
                  </View>
                  
                  <View style={styles.innerCardDivider} />
                  
                  <Text style={styles.textServiceTitle}>
                    Layanan: <Text style={{ color: '#673AB7' }}>{item.service?.nama_layanan || 'Layanan'}</Text>
                  </Text>
                </View>

                {/* FOOTER TOTAL BAYAR */}
                <View style={styles.cardFooterArea}>
                  <Text style={styles.priceMetaLabel}>TOTAL</Text>
                  <Text style={styles.priceMetaValue}>Rp {Number(item.total_harga).toLocaleString('id-ID')}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA', paddingHorizontal: 20 },
  
  // HEADER BAR STYLES
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 25 },
  headerSubtitle: { fontSize: 13, color: '#8E8E93', fontWeight: '500', letterSpacing: 0.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginTop: 1 },
  avatarWrapper: { backgroundColor: '#EFEFF4', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E5E5EA' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  menuBox: { backgroundColor: '#fff', marginTop: 95, marginRight: 20, borderRadius: 12, padding: 8, width: 180, elevation: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  menuItemText: { marginLeft: 10, fontSize: 14, fontWeight: '500', color: '#333' },
  menuDivider: { height: 1, backgroundColor: '#eee', marginVertical: 4 },

  // STYLING BARU: TOMBOL SAKLAR SEJAJAR KANAN KIRI KASIR ADMIN STYLE
  menuRowSejajar: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 25 },
  btnMenuHalf: { flex: 1, padding: 16, borderRadius: 18, elevation: 3, justifyContent: 'center' },
  cardLabel: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 11, fontWeight: '500' },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 2 },

  // SEARCH BAR & TITLE ROW
  searchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, width: '50%' },
  searchInputField: { flex: 1, fontSize: 12, color: '#1C1C1E', padding: 0 },
  
  // PREMIUM FLAT RIWAYAT CARD
  neoOrderCard: { backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#EAEAEA', elevation: 1 },
  cardMainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  neoCustName: { fontSize: 16, fontWeight: '800', color: '#1C1C1E' },
  neoDateText: { fontSize: 11, color: '#8E8E93', marginTop: 3, fontWeight: '500' },
  
  // CAPSULE BADGE PASTEL STYLE
  capsuleBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10, gap: 5 },
  dotIndicator: { width: 6, height: 6, borderRadius: 3 },
  capsuleBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  
  metaDataContainer: { marginVertical: 14, backgroundColor: '#F8F9FA', padding: 14, borderRadius: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  metaText: { fontSize: 12, color: '#555', fontWeight: '500' },
  innerCardDivider: { height: 1, backgroundColor: '#EAEAEA', marginVertical: 10 },
  textServiceTitle: { fontSize: 13, fontWeight: '800', color: '#1C1C1E' },
  
  cardFooterArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingHorizontal: 2 },
  priceMetaLabel: { fontSize: 10, color: '#8E8E93', fontWeight: '700', letterSpacing: 0.5 },
  priceMetaValue: { fontSize: 18, fontWeight: '900', color: '#673AB7' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 50, fontSize: 14 }
});