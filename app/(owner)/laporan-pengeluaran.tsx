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

export default function TambahPengeluaran() {
  const [nama, setNama] = useState('');
  const [totalHarga, setTotalHarga] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // State untuk Filter & Total
  const [bulanDipilih, setBulanDipilih] = useState(new Date().getMonth() + 1);
  const [tahunDipilih, setTahunDipilih] = useState(new Date().getFullYear());
  const [totalAkumulasi, setTotalAkumulasi] = useState(0);

  // Fetch data setiap kali bulan/tahun berubah
  useEffect(() => {
    fetchExpenses();
  }, [bulanDipilih, tahunDipilih]);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API_URL}/expenses`, {
        params: { bulan: bulanDipilih, tahun: tahunDipilih }
      });
      setExpenses(response.data);
      
      // Hitung Total Otomatis
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
      <Text style={styles.title}>Laporan Pengeluaran</Text>
      
      {/* <View style={styles.formCard}>
        <TextInput 
          style={styles.input} 
          placeholder="Nama Pengeluaran (misal: Sabun)" 
          value={nama} 
          onChangeText={setNama} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Total Harga (Rp)" 
          keyboardType="numeric" 
          value={totalHarga} 
          onChangeText={setTotalHarga} 
        />
        <TouchableOpacity 
          style={[styles.btnSimpan, loading && { opacity: 0.7 }]} 
          onPress={handleSimpan} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>SIMPAN PENGELUARAN</Text>}
        </TouchableOpacity>
      </View> */}

      {/* Ringkasan & Filter */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Total {namaBulan}:</Text>
          <Text style={styles.summaryValue}>Rp {totalAkumulasi.toLocaleString('id-ID')}</Text>
        </View>
        <TouchableOpacity style={styles.btnPdf} onPress={downloadLaporan}>
          <Text style={styles.btnPdfText}>CETAK PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity onPress={() => gantiBulan('prev')}>
          <Text style={styles.filterArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.filterText}>{namaBulan} {tahunDipilih}</Text>
        <TouchableOpacity onPress={() => gantiBulan('next')}>
          <Text style={styles.filterArrow}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item: any) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchExpenses().then(()=>setRefreshing(false))}} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada data di bulan ini.</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.nama_barang}</Text>
              <Text style={styles.itemDate}>{new Date(item.created_at).toLocaleDateString('id-ID')}</Text>
            </View>
            <Text style={styles.itemTotal}>Rp {Number(item.total_harga).toLocaleString('id-ID')}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', paddingTop: 50 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#D32F2F', textAlign: 'center' },
  formCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  btnSimpan: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  summaryCard: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  summaryLabel: { color: '#fff', fontSize: 12 },
  summaryValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  btnPdf: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  btnPdfText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 12 },

  filterContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 10, elevation: 1, marginBottom: 15 },
  filterText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  filterArrow: { fontSize: 20, fontWeight: 'bold', color: '#D32F2F', paddingHorizontal: 15 },

  itemCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 5, borderLeftColor: '#D32F2F' },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  itemDate: { fontSize: 11, color: '#888' },
  itemTotal: { fontSize: 15, fontWeight: 'bold', color: '#D32F2F' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999' }
});