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

type Order = {
  id: number;
  nama_pelanggan: string;
  nomor_hp: string;
  alamat: string;
  kategori_pesanan: string;
  jenis_satuan: string;
  tipe_paket: string;
  berat: number;
  layanan: string;
  status: string;
  total_harga: number;
  created_at: string; 
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

  // --- LOGIKA BACK BUTTON FIX (PENGUNCI DASHBOARD UTAMA) ---
  const lastBackButtonPress = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const currentTime = Date.now();
        // Jika diklik dua kali dalam jeda kurang dari 2 detik (2000 ms)
        if (currentTime - lastBackButtonPress.current < 2000) {
          BackHandler.exitApp(); // Tutup aplikasi sepenuhnya
          return true;
        }

        lastBackButtonPress.current = currentTime;
        ToastAndroid.show("Klik sekali lagi untuk keluar", ToastAndroid.SHORT);
        return true; // Menahan tombol back agar tidak bocor mundur ke halaman seleksi role
      };

      // Daftarkan listener saat halaman ini aktif/fokus
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        // Otomatis mencabut pengunci ketika admin membuka sub-menu (tambah/edit/laporan)
        subscription.remove(); 
      };
    }, [])
  );
  // --- END LOGIKA BACK BUTTON ---

  const handlePrintLabel = async (item: Order) => {
    const htmlContent = `
      <html>
        <body style="display: flex; justify-content: center; align-items: center; font-family: 'Arial';">
          <div style="width: 250px; border: 2px dashed #000; padding: 10px; border-radius: 10px;">
            <h2 style="text-align: center; margin: 0; font-size: 18px;">LABEL CUCIAN</h2>
            <hr/>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Nama:</strong> ${item.nama_pelanggan}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Alamat:</strong> ${item.alamat || '-'}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Layanan:</strong> ${item.kategori_pesanan} (${item.tipe_paket})</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Detail:</strong> ${item.kategori_pesanan === 'Kiloan' ? item.berat + ' Kg' : item.jenis_satuan}</p>
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
        item.nama_pelanggan.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  };

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'Antre') nextStatus = 'Diproses';
    else if (currentStatus === 'Diproses') nextStatus = 'Selesai';
    else if (currentStatus === 'Selesai') nextStatus = 'Diambil';
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
      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Panel Admin Laundry</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.profileBtn}>
          <Ionicons name="person-circle-outline" size={32} color="#673AB7" />
        </TouchableOpacity>
      </View>

      {/* MODAL PROFILE */}
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

      {/* DASHBOARD CONTENT */}
      <View style={styles.card}>
        <Text style={{color: '#666'}}>Pesanan Perlu Diproses</Text>
        <Text style={styles.totalNum}>{total}</Text>
      </View>

      <TouchableOpacity style={styles.btnTambah} onPress={() => router.push('/(admin)/tambah_pesan')}>
        <Text style={styles.btnText}>Input Pesanan Baru</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btnTambah, { backgroundColor: '#4CAF50', marginTop: -10 }]} onPress={() => router.push('/(admin)/laporan')}>
        <Text style={styles.btnText}>Laporan Pemasukan</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btnTambah, { backgroundColor: '#D32F2F', marginTop: -10 }]} onPress={() => router.push('/(admin)/tambah_pengeluaran')}>
        <Text style={styles.btnText}>Laporan Pengeluaran</Text>
      </TouchableOpacity>

      <View style={styles.searchRow}>
        <Text style={styles.subtitle}>Daftar Pesanan :</Text>
        <TextInput style={styles.searchInput} placeholder="Cari Nama.." value={searchQuery} onChangeText={handleSearch} />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#673AB7" />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.orderItem}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.custName}>{item.nama_pelanggan}</Text>
                  <Text style={styles.dateText}>📅 {formatTanggal(item.created_at)}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.badge, { backgroundColor: item.status === 'Diambil' ? '#4CAF50' : '#FF9800' }]}
                  onPress={() => handleUpdateStatus(item.id, item.status)}
                >
                  <Text style={styles.badgeText}>{item.status}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.detailBox}>
                <Text style={styles.infoText}>📱 {item.nomor_hp}</Text>
                <Text style={styles.infoText}>📍 {item.alamat || '-'}</Text>
                <View style={styles.divider} />
                <Text style={styles.serviceText}>{item.kategori_pesanan} ({item.tipe_paket || 'Satuan'}) - {item.layanan}</Text>
                <Text style={styles.subInfo}>{item.kategori_pesanan === 'Kiloan' ? `Berat: ${item.berat} Kg` : `Item: ${item.jenis_satuan}`}</Text>
              </View>

              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.priceLabel}>Tagihan:</Text>
                  <Text style={styles.priceValue}>Rp {item.total_harga.toLocaleString()}</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => handlePrintLabel(item)} style={styles.iconBtn}>
                    <Text style={{ fontSize: 16 }}>🖨️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push({ pathname: '/(admin)/edit_pesan', params: { id: item.id } })} style={[styles.iconBtn, { backgroundColor: '#E3F2FD' }]}>
                    <Text style={{ fontSize: 14 }}>📝</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.iconBtn, { backgroundColor: '#FFF5F5' }]}>
                    <Text style={{ fontSize: 16 }}>🗑️</Text>
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
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  profileBtn: { padding: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  menuBox: { backgroundColor: '#fff', marginTop: 85, marginRight: 20, borderRadius: 12, padding: 8, width: 190, elevation: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  menuItemText: { marginLeft: 10, fontSize: 14, fontWeight: '500', color: '#333' },
  menuDivider: { height: 1, backgroundColor: '#eee', marginVertical: 4 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, alignItems: 'center', elevation: 3, marginBottom: 15 },
  totalNum: { fontSize: 40, fontWeight: 'bold', color: '#673AB7' },
  btnTambah: { backgroundColor: '#673AB7', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20, elevation: 2 },
  btnText: { color: 'white', fontWeight: 'bold' },
  searchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, width: '50%', fontSize: 12 },
  subtitle: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  orderItem: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, elevation: 2, borderLeftWidth: 6, borderLeftColor: '#673AB7' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  custName: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  dateText: { fontSize: 11, color: '#999', marginTop: 2 },
  badge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 15 },
  badgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  detailBox: { marginVertical: 10 },
  infoText: { fontSize: 13, color: '#666', marginBottom: 2 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  serviceText: { fontSize: 14, fontWeight: '600', color: '#444' },
  subInfo: { fontSize: 13, color: '#888', marginTop: 2 },
  priceLabel: { fontSize: 12, color: '#999' },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: '#E91E63' },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: { padding: 8, backgroundColor: '#F0F0F0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', minWidth: 36 }
});