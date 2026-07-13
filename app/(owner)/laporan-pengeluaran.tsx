import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Alert, 
  ActivityIndicator, 
  RefreshControl,
  Linking
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { Ionicons } from '@expo/vector-icons'; 

export default function TambahPengeluaran() {
  const [nama, setNama] = useState('');
  const [totalHarga, setTotalHarga] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [bulanDipilih, setBulanDipilih] = useState(new Date().getMonth() + 1);
  const [tahunDipilih, setTahunDipilih] = useState(new Date().getFullYear());
  const [totalAkumulasi, setTotalAkumulasi] = useState(0);

  useEffect(() => {
    fetchExpenses();
  }, [bulanDipilih, tahunDipilih]);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API_URL}/expenses`, {
        params: { bulan: bulanDipilih, tahun: tahunDipilih }
      });
      setExpenses(response.data);
      
      const total = response.data.reduce((sum: number, item: any) => sum + Number(item.total_harga), 0);
      setTotalAkumulasi(total);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  const handleSimpan = async () => {
    if (!nama || !totalHarga) {
      Alert.alert("Error", "Semua kolom harus diisi!");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/expenses`, {
        nama_barang: nama,
        total_harga: parseInt(totalHarga)
      });

      if (response.data.success) {
        Alert.alert("Sukses", "Pengeluaran berhasil dicatat");
        setNama(''); 
        setTotalHarga('');
        fetchExpenses();
      }
    } catch (error: any) {
      Alert.alert("Gagal", error.response?.data?.message || "Terjadi kesalahan");
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus data pengeluaran ini?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/expenses/${id}`);
              Alert.alert("Sukses", "Data berhasil dihapus");
              fetchExpenses(); 
            } catch (error) {
              Alert.alert("Gagal", "Gagal menghapus data dari server");
            }
          } 
        }
      ]
    );
  };

  const downloadLaporan = () => {
    const url = `${API_URL}/expenses/pdf?bulan=${bulanDipilih}&tahun=${tahunDipilih}`;
    Linking.openURL(url).catch(err => Alert.alert("Error", "Tidak bisa membuka link unduhan"));
  };

  const gantiBulan = (arah: 'next' | 'prev') => {
    if (arah === 'prev') {
      if (bulanDipilih === 1) {
        setBulanDipilih(12);
        setTahunDipilih(t => t - 1);
      } else {
        setBulanDipilih(prev => prev - 1);
      }
    } else {
      if (bulanDipilih === 12) {
        setBulanDipilih(1);
        setTahunDipilih(t => t + 1);
      } else {
        setBulanDipilih(prev => prev + 1);
      }
    }
  };

  const namaBulan = new Date(tahunDipilih, bulanDipilih - 1).toLocaleString('id-ID', { month: 'long' });

  return (
    <View style={styles.container}>
      {/* HEADER SECTION DENGAN AKSES PRINT MINIMALIS */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>Laporan Pengeluaran</Text>
        </View>
        <TouchableOpacity style={styles.btnPdfHeader} onPress={downloadLaporan}>
          <Ionicons name="cloud-download-outline" size={18} color="#D32F2F" />
          <Text style={styles.btnPdfTextHeader}>PDF</Text>
        </TouchableOpacity>
      </View>
      
      
      {/* FORM INPUT DENGAN DESAIN MODERN CLEAN
      <View style={styles.formCard}>
        <TextInput 
          style={styles.input} 
          placeholder="Nama pengeluaran (misal: Sabun)" 
          placeholderTextColor="#A0A0A0"
          value={nama} 
          onChangeText={setNama} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Total harga (Rp)" 
          placeholderTextColor="#A0A0A0"
          keyboardType="numeric" 
          value={totalHarga} 
          onChangeText={setTotalHarga} 
        />
        <TouchableOpacity 
          style={[styles.btnSimpan, loading && { opacity: 0.7 }]} 
          onPress={handleSimpan} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>SIMPAN DATA PENGELUARAN</Text>
          )}
        </TouchableOpacity>
      </View> */}

      {/* METRIC HERO CARD TOTAL AKUMULASI (MODERN DARK STYLE) */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>TOTAL PENGELUARAN</Text>
          <Text style={styles.summaryValue}>Rp {totalAkumulasi.toLocaleString('id-ID')}</Text>
        </View>
        <View style={styles.summaryRightBadge}>
          <Text style={styles.summaryMonthBadgeText}>{namaBulan.toUpperCase()}</Text>
        </View>
      </View>

      {/* FILTER CAROUSEL MONTH SEJAJAR JUDUL LIST */}
      <View style={styles.listHeadingRow}>
        <Text style={styles.sectionHeading}>Daftar Log</Text>
        
        <View style={styles.filterContainer}>
          <TouchableOpacity onPress={() => gantiBulan('prev')} style={styles.arrowClickable}>
            <Ionicons name="chevron-back" size={14} color="#D32F2F" />
          </TouchableOpacity>
          <Text style={styles.filterText}>{namaBulan} {tahunDipilih}</Text>
          <TouchableOpacity onPress={() => gantiBulan('next')} style={styles.arrowClickable}>
            <Ionicons name="chevron-forward" size={14} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      </View>

      {/* LIST DATA LOG PENGELUARAN */}
      <FlatList
        data={expenses}
        keyExtractor={(item: any) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchExpenses().then(() => setRefreshing(false)); }} 
            colors={["#D32F2F"]}
          />
        }
        ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada data di bulan ini.</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.iconPastelContainer}>
              <Ionicons name="cart" size={16} color="#D32F2F" />
            </View>
            
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemName}>{item.nama_barang}</Text>
              <Text style={styles.itemDate}>
                {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            
            <View style={styles.itemRight}>
              <Text style={styles.itemTotal}>Rp {Number(item.total_harga).toLocaleString('id-ID')}</Text>
              
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteIconWrapper}>
                <Ionicons name="trash" size={14} color="#E53935" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#F4F6FA' },
  
  // HEADER BAR STYLES
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 20 },
  headerSubtitle: { fontSize: 13, color: '#8E8E93', fontWeight: '500', letterSpacing: 0.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginTop: 1 },
  btnPdfHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12, gap: 4, elevation: 1 },
  btnPdfTextHeader: { color: '#D32F2F', fontWeight: '800', fontSize: 12 },

  // FORM CARD MODERNISED
  formCard: { backgroundColor: '#fff', padding: 18, borderRadius: 22, borderWidth: 1, borderColor: '#EAEAEA', marginBottom: 15, elevation: 1 },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#ECEFF1', padding: 12, borderRadius: 14, marginBottom: 12, fontSize: 14, color: '#1C1C1E', fontWeight: '500' },
  btnSimpan: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 16, alignItems: 'center', elevation: 2 },
  btnText: { color: 'white', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  
  // TOTAL SUMMARY HERO CARD STYLE
  summaryCard: { backgroundColor: '#D32F2F', padding: 18, borderRadius: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, elevation: 2 },
  summaryLeft: { flex: 1 },
  summaryLabel: { color: '#ffffffff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  summaryValue: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 2 },
  summaryRightBadge: { backgroundColor: 'rgba(211, 47, 47, 0.2)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  summaryRightBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  summaryMonthBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  // LIST HEADING ROW WITH COMPACT FILTER
  listHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: '#1C1C1E' },
  filterContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 14, paddingVertical: 4, paddingHorizontal: 6 },
  filterText: { fontSize: 12, fontWeight: '700', color: '#444', marginHorizontal: 4 },
  arrowClickable: { padding: 4 },

  // MODERN LOG CARDS
  itemCard: { backgroundColor: '#fff', padding: 14, borderRadius: 18, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#EAEAEA', elevation: 1 },
  iconPastelContainer: { padding: 10, backgroundColor: '#FFEBEE', borderRadius: 12 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#1C1C1E' },
  itemDate: { fontSize: 11, color: '#8E8E93', marginTop: 3, fontWeight: '500' },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemTotal: { fontSize: 15, fontWeight: '900', color: '#D32F2F' },
  deleteIconWrapper: { padding: 8, backgroundColor: '#F2F2F7', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#999', fontSize: 13, fontWeight: '500' }
});