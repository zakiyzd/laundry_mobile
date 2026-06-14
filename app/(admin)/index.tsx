import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  TextInput,
  Modal,
  BackHandler,
  ToastAndroid
} from 'react-native';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config'; 
import * as Print from 'expo-print';
import { Ionicons } from '@expo/vector-icons'; 

type Customer = {
  id: number;
  username: string;
  nomor_hp: string;
  alamat: string;
};

type Kategori = {
  id: number;
  nama: string;
  harga_per_kg: number;
};

type ServiceRelasi = {
  id: number;
  id_kategori: number;
  nama_layanan: string;
  kategori?: Kategori;
};

type Order = {
  id: number;
  id_pelanggan: number;
  id_services: number;
  berat: number;
  total_berat: number;
  status: string;
  total_harga: number;
  created_at: string; 
  customer?: Customer;
  service?: ServiceRelasi;
  jenis_satuan?: string;
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  const router = useRouter();
  const navigation = useNavigation();

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

  const handlePrintLabel = async (item: Order) => {
    const htmlContent = `
      <html>
        <body style="display: flex; justify-content: center; align-items: center; font-family: 'Arial';">
          <div style="width: 250px; border: 2px dashed #000; padding: 10px; border-radius: 10px;">
            <h2 style="text-align: center; margin: 0; font-size: 18px;">LABEL CUCIAN</h2>
            <hr/>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Nama:</strong> ${item.customer?.username || 'Tanpa Nama'}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Alamat:</strong> ${item.customer?.alamat || '-'}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Layanan:</strong> ${item.service?.nama_layanan || 'Layanan'}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Detail:</strong> ${item.berat > 0 ? item.berat + ' Kg' : 'Satuan'}</p>
            <hr/>
            <p style="text-align: right; margin: 0; font-size: 16px; font-weight: bold;">Rp ${item.total_harga.toLocaleString()}</p>
            <p style="text-align: center; font-size: 10px; margin-top: 10px;">Terima kasih!</p>
          </div>
        </body>
      </html>
    `;
    try {
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      Alert.alert("Error", "Gagal mencetak");
    }
  };

  const formatTanggal = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/orders`);
      setTotal(response.data.total || 0);
      setOrders(response.data.data || []);
      setFilteredOrders(response.data.data || []);
    } catch (error) {
      console.error("Gagal ambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter((item) =>
        item.customer?.username.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  };

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    let nextStatus = '';
    const statusClean = currentStatus.toLowerCase();

    if (statusClean === 'antre') nextStatus = 'diproses';
    else if (statusClean === 'diproses') nextStatus = 'selesai';
    else if (statusClean === 'selesai') nextStatus = 'diambil';
    else {
      Alert.alert("Info", "Cucian sudah diambil.");
      return;
    }
    try {
      await axios.put(`${API_URL}/orders/${id}/status`, { status: nextStatus });
      Alert.alert("Berhasil", `Status: ${nextStatus}`);
      fetchData();
    } catch (error) {
      Alert.alert("Gagal", "Kesalahan koneksi");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Hapus?", "Yakin hapus pesanan ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
          try {
            await axios.delete(`${API_URL}/orders/${id}`);
            fetchData();
          } catch (error) {
            Alert.alert("Gagal", "Gagal hapus data");
          }
        } 
      }
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: () => router.replace('/(auth)/login') }
    ]);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerSubtitle}>Selamat Datang,</Text>
          <Text style={styles.headerTitle}>Admin Laundry</Text>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.avatarWrapper}>
          <Ionicons name="person" size={20} color="#673AB7" />
        </TouchableOpacity>
      </View>

      {/* POPUP MODAL PROFILE */}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuBox}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/(auth)/register'); }}>
              <Ionicons name="person-add-outline" size={18} color="#333" />
              <Text style={styles.menuItemText}>Tambah Akun</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); handleLogout(); }}>
              <Ionicons name="log-out-outline" size={18} color="#D32F2F" />
              <Text style={[styles.menuItemText, { color: '#D32F2F' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

     {/* GRADIENT HERO BANNER */}
      <View style={styles.heroGradientCard}>
        <View style={styles.heroLeftSection}>
          <Text style={styles.heroCardLabel}>TOTAL ANTRIAN</Text>
          <Text style={styles.heroCardNumber}>{total}</Text>
          <Text style={styles.heroCardSub}>Nota Menunggu</Text>
        </View>
        
        <View style={styles.heroRightSection}>
          {/* Tombol Pendapatan: Hijau Cerah Solid (Contoh Laporan Pendapatan) */}
          <TouchableOpacity 
            style={[styles.glassButton, { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }]} 
            onPress={() => router.push('/(admin)/laporan')}
          >
            <Ionicons name="stats-chart" size={14} color="#FFF" />
            <Text style={styles.glassButtonText}>Pendapatan</Text>
          </TouchableOpacity>
          
          {/* Tombol Pengeluaran: Merah Cerah Solid (Contoh Laporan Pengeluaran) */}
          <TouchableOpacity 
            style={[styles.glassButton, { backgroundColor: '#D32F2F', borderColor: '#D32F2F' }]} 
            onPress={() => router.push('/(admin)/tambah_pengeluaran')}
          >
            <Ionicons name="wallet" size={14} color="#FFF" />
            <Text style={styles.glassButtonText}>Pengeluaran</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity style={styles.primeActionButton} onPress={() => router.push('/(admin)/tambah_pesan')}>
        <View style={styles.primeIconCircle}>
          <Ionicons name="add-sharp" size={22} color="#673AB7" />
        </View>
        <Text style={styles.primeActionText}>INPUT TRANSAKSI BARU</Text>
      </TouchableOpacity>

      {/* SEARCH BAR & TITLE */}
      <View style={styles.searchRow}>
        <Text style={styles.sectionHeading}>Daftar Orderan</Text>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={14} color="#A0A0A0" style={{ marginRight: 6 }} />
          <TextInput 
            style={styles.searchInputField} 
            placeholder="Cari nama..." 
            placeholderTextColor="#A0A0A0"
            value={searchQuery} 
            onChangeText={handleSearch} 
          />
        </View>
      </View>

      {/* FEED LIST ORDER */}
      {loading ? (
        <ActivityIndicator size="large" color="#673AB7" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.neoOrderCard}>
              <View style={styles.cardMainHeader}>
                <View>
                  <Text style={styles.neoCustName}>{item.customer?.username || 'Tanpa Nama'}</Text>
                  <Text style={styles.neoDateText}>{formatTanggal(item.created_at)}</Text>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.capsuleBadge, 
                    { backgroundColor: item.status.toLowerCase() === 'diambil' ? '#E8F5E9' : '#FFF3E0' }
                  ]}
                  onPress={() => handleUpdateStatus(item.id, item.status)}
                >
                  <View style={[
                    styles.dotIndicator, 
                    { backgroundColor: item.status.toLowerCase() === 'diambil' ? '#4CAF50' : '#FF9800' }
                  ]} />
                  <Text style={[
                    styles.capsuleBadgeText, 
                    { color: item.status.toLowerCase() === 'diambil' ? '#2E7D32' : '#E65100' }
                  ]}>
                    {item.status.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* DETAILS METADATA */}
              <View style={styles.metaDataContainer}>
                <View style={styles.metaRow}>
                  <Ionicons name="call-outline" size={13} color="#777" />
                  <Text style={styles.metaText}>{item.customer?.nomor_hp || '-'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color="#777" />
                  <Text style={styles.metaText} numberOfLines={1}>{item.customer?.alamat || '-'}</Text>
                </View>
                
                <View style={styles.innerCardDivider} />
                
                <Text style={styles.textServiceTitle}>
                  {item.berat > 0 ? 'Kiloan' : 'Satuan'} • {item.service?.nama_layanan || 'Layanan'}
                </Text>
                <Text style={styles.textServiceDetail}>
                  {item.berat > 0 ? `Berat: ${item.berat} Kg` : `Item: ${item.jenis_satuan || '-'}`}
                </Text>
              </View>

              {/* CARD BOTTOM PRICE AND ACTIONS */}
              <View style={styles.cardFooterArea}>
                <View>
                  <Text style={styles.priceMetaLabel}>TOTAL</Text>
                  <Text style={styles.priceMetaValue}>Rp {item.total_harga.toLocaleString('id-ID')}</Text>
                </View>
                
                <View style={styles.neoActionGroup}>
                  <TouchableOpacity onPress={() => handlePrintLabel(item)} style={styles.neoIconBtn}>
                    <Ionicons name="print" size={15} color="#555" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => router.push({ pathname: '/(admin)/edit_pesan', params: { id: item.id } })} 
                    style={[styles.neoIconBtn, { backgroundColor: '#E3F2FD' }]}
                  >
                    <Ionicons name="create" size={15} color="#1E88E5" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.neoIconBtn, { backgroundColor: '#FFEBEE' }]}>
                    <Ionicons name="trash" size={15} color="#E53935" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#F4F6FA' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 25 },
  headerSubtitle: { fontSize: 13, color: '#8E8E93', fontWeight: '500', letterSpacing: 0.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginTop: 1 },
  avatarWrapper: { backgroundColor: '#EFEFF4', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E5E5EA' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  menuBox: { backgroundColor: '#fff', marginTop: 95, marginRight: 20, borderRadius: 12, padding: 8, width: 180, elevation: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  menuItemText: { marginLeft: 10, fontSize: 14, fontWeight: '500', color: '#333' },
  menuDivider: { height: 1, backgroundColor: '#eee', marginVertical: 4 },

  heroGradientCard: { backgroundColor: '#673AB7', borderRadius: 24, padding: 22, flexDirection: 'row', elevation: 4, marginBottom: 15 },
  heroLeftSection: { flex: 1, justifyContent: 'center' },
  heroCardLabel: { color: '#D1C4E9', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroCardNumber: { color: '#FFF', fontSize: 44, fontWeight: '900', marginVertical: 2 },
  heroCardSub: { color: '#E1D5F5', fontSize: 12, fontWeight: '500' },
  
  heroRightSection: { flex: 1, justifyContent: 'center', gap: 8, paddingLeft: 10 },
  glassButton: { backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)' },
  glassButtonText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  primeActionButton: { backgroundColor: '#673AB7', padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 3, marginBottom: 25 },
  primeIconCircle: { backgroundColor: '#FFF', padding: 3, borderRadius: 12 },
  primeActionText: { color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 0.8 },

  searchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, width: '50%' },
  searchInputField: { flex: 1, fontSize: 12, color: '#1C1C1E', padding: 0 },

  neoOrderCard: { backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#EAEAEA', elevation: 1 },
  cardMainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  neoCustName: { fontSize: 16, fontWeight: '800', color: '#1C1C1E' },
  neoDateText: { fontSize: 11, color: '#8E8E93', marginTop: 2, fontWeight: '500' },
  
  capsuleBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, gap: 5 },
  dotIndicator: { width: 6, height: 6, borderRadius: 3 },
  capsuleBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  
  metaDataContainer: { marginVertical: 14, backgroundColor: '#F8F9FA', padding: 12, borderRadius: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: { fontSize: 12, color: '#555', fontWeight: '500' },
  innerCardDivider: { height: 1, backgroundColor: '#EAEAEA', marginVertical: 10 },
  textServiceTitle: { fontSize: 13, fontWeight: '800', color: '#1C1C1E' },
  textServiceDetail: { fontSize: 12, color: '#666', marginTop: 2, fontWeight: '500' },
  
  cardFooterArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  priceMetaLabel: { fontSize: 9, color: '#8E8E93', fontWeight: '700', letterSpacing: 0.5 },
  priceMetaValue: { fontSize: 18, fontWeight: '900', color: '#673AB7', marginTop: 1 },
  neoActionGroup: { flexDirection: 'row', gap: 6 },
  neoIconBtn: { padding: 9, backgroundColor: '#F2F2F7', borderRadius: 12, justifyContent: 'center', alignItems: 'center', minWidth: 36 }
});