import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity, 
  Linking 
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';

export default function LaporanAdmin() {
  const [data, setData] = useState({ omzet: 0, jumlah_transaksi: 0, data: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State Periode
  const [bulanDipilih, setBulanDipilih] = useState(new Date().getMonth() + 1);
  const [tahunDipilih, setTahunDipilih] = useState(new Date().getFullYear());

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/laporan-admin`, {
        params: { bulan: bulanDipilih, tahun: tahunDipilih }
      });
      setData(response.data);
    } catch (error) {
      console.error("Gagal ambil laporan:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, [bulanDipilih, tahunDipilih]);

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

  const downloadPDF = () => {
    const url = `${API_URL}/laporan-admin/pdf?bulan=${bulanDipilih}&tahun=${tahunDipilih}`;
    Linking.openURL(url);
  };

  const namaBulan = new Date(tahunDipilih, bulanDipilih - 1).toLocaleString('id-ID', { month: 'long' });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Laporan Pemasukan</Text>

      {/* Filter Periode */}
      <View style={styles.filterContainer}>
        <TouchableOpacity onPress={() => gantiBulan('prev')}>
          <Text style={styles.filterArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.filterText}>{namaBulan} {tahunDipilih}</Text>
        <TouchableOpacity onPress={() => gantiBulan('next')}>
          <Text style={styles.filterArrow}>{">"}</Text>
        </TouchableOpacity>
      </View>

      {/* Card Omzet */}
      <View style={styles.mainCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Total Omzet (Selesai)</Text>
          <TouchableOpacity style={styles.btnPdf} onPress={downloadPDF}>
            <Text style={styles.btnPdfText}>PDF</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.omzetValue}>Rp {data.omzet.toLocaleString('id-ID')}</Text>
        <View style={styles.divider} />
        <Text style={styles.subText}>{data.jumlah_transaksi} Transaksi Berhasil</Text>
      </View>

      <Text style={styles.sectionTitle}>Riwayat Pendapatan</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#673AB7" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item: any) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchLaporan()} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada pemasukan di periode ini.</Text>}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <View>
                <Text style={styles.custName}>{item.nama_pelanggan}</Text>
                <Text style={styles.dateText}>{item.layanan} - {new Date(item.created_at).toLocaleDateString('id-ID')}</Text>
              </View>
              <Text style={styles.priceText}>+ Rp {item.total_harga.toLocaleString('id-ID')}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa', paddingTop: 50 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center' },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 12, elevation: 2, marginBottom: 20 },
  filterText: { fontSize: 16, fontWeight: 'bold', color: '#673AB7' },
  filterArrow: { fontSize: 24, fontWeight: 'bold', color: '#673AB7', paddingHorizontal: 20 },
  mainCard: { backgroundColor: '#673AB7', padding: 20, borderRadius: 20, elevation: 5, marginBottom: 25 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: '#E1D5F5', fontSize: 14 },
  btnPdf: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  btnPdfText: { color: '#673AB7', fontWeight: 'bold', fontSize: 12 },
  omzetValue: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginVertical: 10 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 10 },
  subText: { color: '#fff', fontSize: 14, opacity: 0.9 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#555' },
  historyItem: { backgroundColor: '#fff', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  custName: { fontWeight: 'bold', fontSize: 15 },
  dateText: { fontSize: 12, color: '#888' },
  priceText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#999' }
});