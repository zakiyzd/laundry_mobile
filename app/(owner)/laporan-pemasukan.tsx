import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  Linking,
  Alert
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { Ionicons } from '@expo/vector-icons'; 

export default function LaporanPendapatan() {
  // Menggunakan struktur data awalmu agar sinkron saat setData(response.data)
  const [data, setData] = useState({ omzet: 0, jumlah_transaksi: 0, data: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State Periode
  const [bulanDipilih, setBulanDipilih] = useState(new Date().getMonth() + 1);
  const [tahunDipilih, setTahunDipilih] = useState(new Date().getFullYear());

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      // KEMBALI KE ENDPOINT ASAL: /laporan-admin agar data 100% masuk
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLaporan();
  };

  const downloadPDF = () => {
    // KEMBALI KE ENDPOINT PDF ASAL
    const url = `${API_URL}/laporan-admin/pdf?bulan=${bulanDipilih}&tahun=${tahunDipilih}`;
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
          <Text style={styles.headerTitle}>Laporan Pendapatan</Text>
        </View>
        <TouchableOpacity style={styles.btnPdfHeader} onPress={downloadPDF}>
          <Ionicons name="cloud-download-outline" size={18} color="#4CAF50" />
          <Text style={styles.btnPdfTextHeader}>PDF</Text>
        </TouchableOpacity>
      </View>

      {/* METRIC HERO CARD TOTAL OMZET (TETAP HIJAU CERAH MODERNISED) */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>TOTAL OMZET</Text>
     {/* GANTI BARIS YANG SUDAH ADA DENGAN INI: */}
<Text style={styles.summaryValue}>Rp {Number(data.omzet).toLocaleString('id-ID')}</Text>
        </View>
        <View style={styles.summaryRightBadge}>
          <Text style={styles.summaryBadgeText}>{data.jumlah_transaksi} Transaksi</Text>
        </View>
      </View>

      {/* FILTER CAROUSEL MONTH SEJAJAR JUDUL LIST */}
      <View style={styles.listHeadingRow}>
        <Text style={styles.sectionHeading}>Riwayat Pendapatan</Text>
        
        <View style={styles.filterContainer}>
          <TouchableOpacity onPress={() => gantiBulan('prev')} style={styles.arrowClickable}>
            <Ionicons name="chevron-back" size={14} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={styles.filterText}>{namaBulan} {tahunDipilih}</Text>
          <TouchableOpacity onPress={() => gantiBulan('next')} style={styles.arrowClickable}>
            <Ionicons name="chevron-forward" size={14} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>

      {/* LIST DATA RIWAYAT PENDAPATAN */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item: any) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4CAF50"]} />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada riwayat pendapatan di bulan ini.</Text>}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.itemCard}>
              <View style={styles.iconPastelContainer}>
                <Ionicons name="wallet" size={16} color="#4CAF50" />
              </View>
              
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.itemName}>{item.customer?.username || 'Pelanggan Anonim'}</Text>
                <Text style={styles.itemServiceDetail} numberOfLines={1}>
                  {item.service?.nama_layanan || 'Layanan'} 
                  {item.jenis_satuan ? ` (${item.jenis_satuan})` : ''}
                </Text>
                <Text style={styles.itemDate}>
                   {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </Text>
              </View>
              
              <View style={styles.itemRight}>
                <Text style={styles.itemTotal}>+ Rp {item.total_harga?.toLocaleString('id-ID')}</Text>
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
  
  // HEADER BAR STYLES
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 20 },
  headerSubtitle: { fontSize: 13, color: '#8E8E93', fontWeight: '500', letterSpacing: 0.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginTop: 1 },
  btnPdfHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12, gap: 4, elevation: 1 },
  btnPdfTextHeader: { color: '#4CAF50', fontWeight: '800', fontSize: 12 },
  
  // TOTAL SUMMARY HERO CARD STYLE (HIJAU CERAH MODERNISED)
  summaryCard: { backgroundColor: '#4CAF50', padding: 20, borderRadius: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, elevation: 3 },
  summaryLeft: { flex: 1 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  summaryValue: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 4 },
  summaryRightBadge: { backgroundColor: 'rgba(255, 255, 255, 0.25)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  summaryBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  // LIST HEADING ROW WITH COMPACT FILTER
  listHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: '#1C1C1E' },
  filterContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 14, paddingVertical: 4, paddingHorizontal: 6 },
  filterText: { fontSize: 12, fontWeight: '700', color: '#444', marginHorizontal: 4 },
  arrowClickable: { padding: 4 },

  // MODERN LIST REVENUE CARDS
  itemCard: { backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#EAEAEA', elevation: 1 },
  iconPastelContainer: { padding: 10, backgroundColor: '#E8F5E9', borderRadius: 12 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#1C1C1E' },
  itemServiceDetail: { fontSize: 12, color: '#555', marginTop: 2, fontWeight: '500' },
  itemDate: { fontSize: 11, color: '#8E8E93', marginTop: 4, fontWeight: '500' },
  itemRight: { justifyContent: 'center', alignItems: 'flex-end' },
  itemTotal: { fontSize: 15, fontWeight: '900', color: '#4CAF50' },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#999', fontSize: 13, fontWeight: '500' }
});