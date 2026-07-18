import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView, 
  StatusBar,
  Platform
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// URL domain API VPS MMLaundry
const API_URL = 'https://api.mmlaundry.my.id/api';

interface ServiceItem {
  id: number;
  nama_layanan?: string;
  nama?: string;
  harga: number;
  [key: string]: any;
}

export default function KelolaHargaScreen() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputHarga, setInputHarga] = useState<{ [key: number]: string }>({});
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // 1. Ambil data harga layanan dari Laravel VPS
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/services`);
      if (response.data.success) {
        setServices(response.data.data);
        
        const initialHarga: { [key: number]: string } = {};
        response.data.data.forEach((item: ServiceItem) => {
          initialHarga[item.id] = item.harga.toString();
        });
        setInputHarga(initialHarga);
      }
    } catch (error) {
      console.error("Gagal mengambil data harga:", error);
      Alert.alert("Eror", "Gagal mengambil data tarif dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleHargaChange = (id: number, val: string) => {
    setInputHarga(prev => ({ ...prev, [id]: val }));
  };

  // 2. Kirim perubahan harga baru ke Laravel VPS via PUT
  const handleUpdateHarga = async (id: number, displayName: string) => {
    const hargaBaru = inputHarga[id];
    if (!hargaBaru || isNaN(Number(hargaBaru))) {
      Alert.alert("Peringatan", "Masukkan nominal harga yang valid.");
      return;
    }

    try {
      setUpdatingId(id);
      
      const response = await axios.put(`${API_URL}/services/${id}/update-harga`, {
        harga: Number(hargaBaru) 
      });

      if (response.data.success) {
        Alert.alert("Sukses", `Harga ${displayName} berhasil diubah!`);
        await fetchServices(); 
      }
    } catch (error) {
      console.error("Gagal mengupdate harga:", error);
      Alert.alert("Eror", "Gagal memperbarui harga di server.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#673AB7" />
        <Text style={styles.loadingText}>Memuat tarif laundry...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>💰 Tarif Laundry</Text>
          <Text style={styles.subtitle}>Sesuaikan harga paket jika ada perubahan disini</Text>
        </View>
        
        <FlatList
          data={services}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const displayName = item.nama_layanan || item.nama || 'Layanan Tanpa Nama';
            // Cek apakah kategori express atau biasa untuk pewarnaan label khusus
            const isExpress = displayName.toUpperCase().includes('EXPRESS');

            return (
              <View style={styles.card}>
                {/* Bagian Informasi Atas */}
                <View style={styles.cardHeader}>
                  <Text style={styles.serviceName}>{displayName}</Text>
                  <View style={[styles.badge, isExpress ? styles.badgeExpress : styles.badgeBiasa]}>
                    <Text style={[styles.badgeText, isExpress ? styles.badgeTextExpress : styles.badgeTextBiasa]}>
                      {isExpress ? 'EXPRESS' : 'REGULER'}
                    </Text>
                  </View>
                </View>

                {/* Garis Pembatas Halus */}
                <View style={styles.divider} />

                {/* Bagian Aksi Kolom Harga & Tombol */}
                <View style={styles.actionBox}>
                  <View style={styles.inputWrapper}>
                    <View style={styles.rpBox}>
                      <Text style={styles.rpLabel}>Rp</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="0"
                      value={inputHarga[item.id] || ''}
                      onChangeText={(val) => handleHargaChange(item.id, val)}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.btnSimpan, updatingId === item.id && styles.btnDisabled]}
                    disabled={updatingId === item.id}
                    onPress={() => handleUpdateHarga(item.id, displayName)}
                    activeOpacity={0.7}
                  >
                    {updatingId === item.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="save-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
                        <Text style={styles.btnText}>Simpan</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F8F9FA',
    // Memberikan padding atas ekstra khusus untuk Android agar terhindar dari tabrakan status bar
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 20 
  },
  header: {
    marginTop: 15,
    marginBottom: 20,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#1A1A1A' 
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F8F9FA' 
  },
  loadingText: { 
    marginTop: 12, 
    color: '#666', 
    fontSize: 14,
    fontWeight: '500' 
  },
  card: { 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 14, 
    marginBottom: 14, 
    // Soft shadow modern
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2 
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  serviceName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#222',
    flex: 1,
    paddingRight: 10
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeBiasa: { backgroundColor: '#E8F5E9' },
  badgeExpress: { backgroundColor: '#FFF3E0' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  badgeTextBiasa: { color: '#2E7D32' },
  badgeTextExpress: { color: '#E65100' },
  
  divider: {
    height: 1,
    backgroundColor: '#F1F3F5',
    marginBottom: 12
  },
  actionBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden'
  },
  rpBox: {
    backgroundColor: '#ECEFF1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  rpLabel: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#555' 
  },
  input: { 
    flex: 1,
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    fontSize: 16, 
    fontWeight: '600',
    color: '#333',
  },
  btnSimpan: { 
    backgroundColor: '#673AB7', // Menyelaraskan tema ungu utama
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 11, 
    borderRadius: 8,
    minWidth: 90
  },
  btnDisabled: {
    backgroundColor: '#B39DDB',
  },
  btnText: { 
    color: 'white', 
    fontWeight: '700', 
    fontSize: 14 
  }
});