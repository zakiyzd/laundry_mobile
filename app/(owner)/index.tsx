import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config';

export default function DashboardOwner() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDataSelesai = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      const rawData = Array.isArray(response.data) ? response.data : response.data.data;

      if (rawData && Array.isArray(rawData)) {
        const dataSelesai = rawData.filter((item: any) => item.status === 'Diambil');
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDataSelesai().finally(() => setRefreshing(false));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Panel Owner Laundry</Text>

      <View style={styles.row}>
        <TouchableOpacity 
          style={[styles.cardNav, { backgroundColor: '#4CAF50' }]}
          onPress={() => router.push('/(owner)/laporan-pemasukan' as any)}
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
                <Text style={styles.customerName}>{item.nama_pelanggan}</Text>
                <Text style={styles.serviceName}>{item.layanan}</Text>
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
                  {/* Menampilkan Kiloan (Express) atau Kiloan (Biasa) */}
                  <Text style={styles.detailValue}>
                    {item.kategori_pesanan} ({item.tipe_paket || 'Reguler'})
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Detail :</Text>
                  {/* Menampilkan angka berat saja + Kg */}
                  <Text style={styles.detailValue}>
                    {item.berat_jumlah || item.berat || '0'} Kg
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Alamat :</Text>
                  <Text style={styles.detailValue}>{item.alamat_pelanggan || item.alamat || '-'}</Text>
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
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#673AB7', textAlign: 'center', marginBottom: 30 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  cardNav: { width: '48%', padding: 15, borderRadius: 15, elevation: 3 },
  cardLabel: { color: '#eee', fontSize: 11 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 5 },
  sectionTitle: { fontSize: 16, color: '#333', marginBottom: 15 },
  orderCard: { backgroundColor: '#fff', borderRadius: 15, elevation: 4, marginBottom: 20, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: '#eee' },
  cardTopAccent: { height: 8, backgroundColor: '#673AB7' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, paddingBottom: 10 },
  customerName: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  serviceName: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  detailBox: { backgroundColor: '#f5f5f5', marginHorizontal: 15, padding: 10, borderRadius: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  detailLabel: { color: '#888', fontSize: 13 },
  detailValue: { color: '#444', fontSize: 13, fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  totalLabel: { color: '#888', fontSize: 13 },
  totalValue: { color: '#673AB7', fontWeight: 'bold', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 }
});