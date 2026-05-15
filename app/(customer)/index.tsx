import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config'; 

interface Order {
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
}

export default function CustomerDashboard() {
  // Menerima parameter username dan nomor_hp dari LoginCustomer
  const { username, nomor_hp } = useLocalSearchParams();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Menghitung hanya cucian yang belum selesai
  const activeOrdersCount = orders.filter(item => item.status !== 'Diambil').length;

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      // Mengambil data dari API
      const response = await axios.get(`${API_URL}/orders`);
      
      // Mengantisipasi jika response.data.data bernilai null atau undefined
      const allOrders = response.data.data || [];
      
      // Filter berdasarkan nomor HP yang login secara presisi
      const myData = allOrders.filter((item: Order) => item.nomor_hp === nomor_hp);
      
      setOrders(myData);
    } catch (error) {
      console.error("Gagal ambil data customer:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Pastikan nomor_hp ada sebelum fetch
    if (nomor_hp) {
      fetchMyOrders();
    }
  }, [nomor_hp]);

  return (
    <View style={styles.container}>
      {/* Header Profile */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Halo, Pelanggan Setia</Text>
          {/* Menampilkan nama yang dikirim dari Login (Inputan Admin) */}
          <Text style={styles.usernameText}>{username || 'Pelanggan'} 👋</Text>
        </View>
        <TouchableOpacity style={styles.logoutIcon} onPress={() => router.replace('/')}>
          <Text style={{ fontSize: 20 }}>🚪</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Cucian Aktif</Text>
          <Text style={styles.statValue}>{activeOrdersCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>No. HP Anda</Text>
          <Text style={styles.statValueSmall}>{nomor_hp}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Riwayat Cucian Anda</Text>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#673AB7" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => {
                setRefreshing(true); 
                fetchMyOrders();
              }} 
            />
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.layananText}>{item.layanan}</Text>
                  <Text style={styles.dateText}>ID Pesanan: #00{item.id}</Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: item.status === 'Diambil' ? '#4CAF50' : '#FF9800' }
                ]}>
                  <Text style={styles.statusText}>{item.status ? item.status.toUpperCase() : 'ANTRE'}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Kategori:</Text>
                  <Text style={styles.infoValue}>{item.kategori_pesanan} ({item.tipe_paket || 'Satuan'})</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Detail:</Text>
                  <Text style={styles.infoValue}>
                    {item.kategori_pesanan === 'Kiloan' ? `${item.berat} Kg` : item.jenis_satuan}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Alamat:</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{item.alamat || '-'}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.totalLabel}>Total Bayar:</Text>
                <Text style={styles.totalValue}>Rp {item.total_harga ? item.total_harga.toLocaleString('id-ID') : '0'}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Belum ada riwayat cucian untuk nomor ini.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcomeText: { fontSize: 14, color: '#888' },
  usernameText: { fontSize: 24, fontWeight: 'bold', color: '#673AB7' },
  logoutIcon: { padding: 10, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { backgroundColor: '#673AB7', width: '48%', padding: 15, borderRadius: 15, elevation: 4 },
  statLabel: { color: '#E1D5F5', fontSize: 12 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statValueSmall: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  orderCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 15, elevation: 2, borderTopWidth: 4, borderTopColor: '#673AB7' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  layananText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  dateText: { fontSize: 12, color: '#AAA' },
  statusBadge: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardBody: { backgroundColor: '#F9F9F9', borderRadius: 12, padding: 12, marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, color: '#444', fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#333' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#673AB7' },
  emptyBox: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#BBB', textAlign: 'center' }
});