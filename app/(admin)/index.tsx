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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  

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
            
            <p style="margin: 5px 0; font-size: 14px;">
              <strong>Detail:</strong> ${item.berat > 0 ? item.berat + ' Kg' : `Satuan (${item.jenis_satuan || '-'})`}
            </p>
            
            <hr/>
            <p style="text-align: right; margin: 0; font-size: 16px; font-weight: bold;">Rp ${item.total_harga.toLocaleString('id-ID')}</p>
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

  const handlePrintStruk = async (item: Order) => {
    const htmlContent = `
      <html>
        <body style="font-family: 'Courier New', Courier, monospace; width: 280px; margin: 0 auto; padding: 10px; color: #000;">
          <div style="text-align: center;">
            <h2 style="margin: 0; font-size: 16px; font-weight: bold;">MM LAUNDRY</h2>
            <p style="margin: 2px 0; font-size: 11px;">Solusi Bersih & Cepat</p>
            <p style="margin: 2px 0; font-size: 11px;">Jln. Raya Bantarkawung (Pertigaan Ciomas-Pakiringan)</p>
            <p style="margin: 5px 0;">===============================</p>
          </div>
          <div style="font-size: 11px; line-height: 1.4;">
            <p style="margin: 2px 0;"><strong>No. Nota :</strong> #${String(item.id).padStart(4, '0')}</p>
            <p style="margin: 2px 0;"><strong>Tanggal  :</strong> ${formatTanggal(item.created_at)}</p>
            <p style="margin: 2px 0;"><strong>Pelanggan:</strong> ${item.customer?.username || 'Tanpa Nama'}</p>
            <p style="margin: 2px 0;"><strong>No. HP    :</strong> ${item.customer?.nomor_hp || '-'}</p>
            <p style="margin: 5px 0;">-------------------------------</p>
            <p style="margin: 2px 0; font-weight: bold;">Layanan:</p>
            <p style="margin: 2px 0; padding-left: 5px;">
              ${item.berat > 0 ? 'Kiloan' : 'Satuan'} - ${item.service?.nama_layanan || 'Layanan'}
            </p>
            <p style="margin: 2px 0; padding-left: 5px;">
              ${item.berat > 0 ? `Berat: ${item.berat} Kg` : `Item: ${item.jenis_satuan || '-'}`}
            </p>
            <p style="margin: 5px 0;">-------------------------------</p>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 5px;">
              <span>TOTAL BAYAR:</span>
              <span>Rp ${item.total_harga.toLocaleString('id-ID')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; margin-top: 2px;">
              <span>STATUS     :</span>
              <span>${item.status.toUpperCase()} (LUNAS)</span>
            </div>
          </div>
          <div style="text-align: center; margin-top: 15px; font-size: 11px;">
            <p style="margin: 2px 0;">=== TERIMA KASIH ===</p>
            <p style="margin: 2px 0;">Cucian Bersih, Hati Tenang</p>
          </div>
        </body>
      </html>
    `;
    try {
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      Alert.alert("Error", "Gagal mencetak struk belanja");
    }
  };

  const formatTanggal = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const fetchData = async () => {
    if (isLoggingOut) return; // 🔥 1. SELIPKAN INI DI BARIS PERTAMA
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

    Alert.alert(
      "Konfirmasi Perubahan", 
      `Apakah Anda yakin ingin merubah status cucian ini menjadi "${nextStatus.toUpperCase()}"?`,
      [
        { text: "Tidak", style: "cancel" },
        { 
          text: "Iya", 
          onPress: async () => {
            try {
              await axios.put(`${API_URL}/orders/${id}/status`, { status: nextStatus });
              Alert.alert("Berhasil", `Status berhasil diperbarui menjadi: ${nextStatus.toUpperCase()}`);
              fetchData();
            } catch (error) {
              Alert.alert("Gagal", "Kesalahan koneksi internet / server");
            }
          } 
        }
      ]
    );
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
              // 1. Set saklar logout jadi true
              setIsLoggingOut(true);

              // 2. Bersihkan paksa memori HP
              await AsyncStorage.clear();

              // 3. 🔥 UBAH RUTENYA: Jangan ke "/", tapi langsung tembak ke form login admin
              router.replace("/(auth)/login");

            } catch (error) {
              console.error("Gagal logout:", error);
              router.replace("/(auth)/login");
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    fetchData();
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
        </View>
        
        <View style={styles.heroRightSection}>
          <TouchableOpacity 
            style={[styles.glassButton, { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }]} 
            onPress={() => router.push('/(admin)/laporan')}
          >
            <Ionicons name="stats-chart" size={14} color="#FFF" />
            <Text style={styles.glassButtonText}>Pendapatan</Text>
          </TouchableOpacity>
          
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
        <Text style={styles.sectionHeading}>Daftar Cucian</Text>
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
                  <Ionicons name="barcode-outline" size={13} color="#777" />
                  <Text style={styles.metaText}>ID #{String(item.id).padStart(4, '0')}</Text>
                </View>

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

              {/* CARD BOTTOM PRICE (DIUBAH MENJADI HORIZONTAL KIRI-KANAN SEJAJAR) */}
              <View style={styles.cardFooterArea}>
                <Text style={styles.priceMetaLabel}>TOTAL</Text>
                <Text style={styles.priceMetaValue}>Rp {item.total_harga.toLocaleString('id-ID')}</Text>
              </View>

              {/* LINE SEPARATOR FOR ACTION BUTTONS */}
              <View style={styles.actionSeparator} />

              {/* ACTION GROUP: 5 ROW BUTTONS SIDE-BY-SIDE (DIPERBESAR & ROUNDED KOTAK TUMPUL) */}
              <View style={styles.neoActionRow}>
                {/* 1. UPDATE STATUS */}
                <TouchableOpacity style={styles.actionButton} onPress={() => handleUpdateStatus(item.id, item.status)}>
                  <View style={[styles.iconCircle, { backgroundColor: '#EFEBE9' }]}>
                    <Ionicons name="sync" size={16} color="#5D4037" />
                  </View>
                  <Text style={styles.actionText}>Update{"\n"}Cucian</Text>
                </TouchableOpacity>

                {/* 2. CETAK STRUK */}
                <TouchableOpacity style={styles.actionButton} onPress={() => handlePrintStruk(item)}>
                  <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="receipt" size={16} color="#2E7D32" />
                  </View>
                  <Text style={styles.actionText}>Cetak{"\n"}Struk</Text>
                </TouchableOpacity>

                {/* 3. CETAK LABEL */}
                <TouchableOpacity style={styles.actionButton} onPress={() => handlePrintLabel(item)}>
                  <View style={[styles.iconCircle, { backgroundColor: '#F5F5F5' }]}>
                    <Ionicons name="print" size={16} color="#555" />
                  </View>
                  <Text style={styles.actionText}>Cetak{"\n"}Label</Text>
                </TouchableOpacity>

                {/* 4. EDIT DATA */}
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => router.push({ pathname: '/(admin)/edit_pesan', params: { id: item.id } })}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="create" size={16} color="#1E88E5" />
                  </View>
                  <Text style={styles.actionText}>Edit{"\n"}Data</Text>
                </TouchableOpacity>

                {/* 5. HAPUS PESANAN */}
                <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id)}>
                  <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
                    <Ionicons name="trash" size={16} color="#E53935" />
                  </View>
                  <Text style={styles.actionText}>Hapus{"\n"}Pesanan</Text>
                </TouchableOpacity>
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
  
  // MODIFIKASI LATEOUT HARGA: MENJADI SEJAJAR KIRI (LABEL) DAN KANAN (VALUE)
  cardFooterArea: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 4,
    paddingHorizontal: 2
  },
  priceMetaLabel: { fontSize: 12, color: '#1C1C1E', fontWeight: '800', letterSpacing: 0.5 },
  priceMetaValue: { fontSize: 18, fontWeight: '900', color: '#673AB7' },

  actionSeparator: { height: 1, backgroundColor: '#F2F2F7', marginTop: 14, marginBottom: 12 },
  neoActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionButton: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 },
  
  // MODIFIKASI ICON: BOX UKURAN DIPERBESAR (38) DAN BENTUK ROUNDED KOTAK TUMPUL (8)
  iconCircle: { 
    width: 38, 
    height: 38, 
    borderRadius: 8, // Mengubah dari bulat lingkaran penuh menjadi kotak tumpul/rounded
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 5 
  },
  actionText: { fontSize: 10, fontWeight: '700', color: '#555', textAlign: 'center' }
});