import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config';

export default function EditPesan() {
  const { id } = useLocalSearchParams(); // Ambil ID dari navigasi
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // State Form (Samakan dengan Tambah Pesan)
  const [nama, setNama] = useState('');
  const [nomorHp, setNomorHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kategori, setKategori] = useState('');
  const [berat, setBerat] = useState('');
  const [layanan, setLayanan] = useState('');
  const [totalHarga, setTotalHarga] = useState('');

  // 1. Ambil data lama saat halaman dibuka
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await axios.get(`${API_URL}/orders/${id}`);
        const data = response.data.data;
        
        setNama(data.nama_pelanggan);
        setNomorHp(data.nomor_hp);
        setAlamat(data.alamat);
        setKategori(data.kategori_pesanan);
        setBerat(data.berat.toString());
        setLayanan(data.layanan);
        setTotalHarga(data.total_harga.toString());
      } catch (error) {
        Alert.alert("Error", "Gagal mengambil detail data");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // 2. Fungsi Simpan Perubahan
  const handleUpdate = async () => {
    if (!nama || !nomorHp || !berat || !totalHarga) {
      Alert.alert("Peringatan", "Data penting tidak boleh kosong!");
      return;
    }

    setUpdating(true);
    try {
      await axios.put(`${API_URL}/orders/${id}`, {
        nama_pelanggan: nama,
        nomor_hp: nomorHp,
        alamat: alamat,
        kategori_pesanan: kategori,
        berat: parseFloat(berat),
        layanan: layanan,
        total_harga: parseInt(totalHarga)
      });

      Alert.alert("Berhasil", "Pesanan telah diperbarui!");
      router.replace('/(admin)'); // Balik ke dashboard
    } catch (error) {
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan data");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#673AB7" />
        <Text>Memuat data...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Pesanan</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Nama Pelanggan</Text>
        <TextInput style={styles.input} value={nama} onChangeText={setNama} />

        <Text style={styles.label}>Nomor HP</Text>
        <TextInput style={styles.input} value={nomorHp} onChangeText={setNomorHp} keyboardType="phone-pad" />

        <Text style={styles.label}>Alamat</Text>
        <TextInput style={[styles.input, {height: 80}]} value={alamat} onChangeText={setAlamat} multiline />

        <Text style={styles.label}>Berat (Kg)</Text>
        <TextInput style={styles.input} value={berat} onChangeText={setBerat} keyboardType="numeric" />

        <Text style={styles.label}>Total Harga (Rp)</Text>
        <TextInput style={styles.input} value={totalHarga} onChangeText={setTotalHarga} keyboardType="numeric" />

        <TouchableOpacity 
          style={[styles.btnSimpan, updating && { opacity: 0.7 }]} 
          onPress={handleUpdate}
          disabled={updating}
        >
          {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>SIMPAN PERUBAHAN</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.btnBatal}>
          <Text style={{color: '#666'}}>Batal</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center' },
  form: { gap: 5 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  btnSimpan: { backgroundColor: '#673AB7', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold' },
  btnBatal: { padding: 15, alignItems: 'center', marginTop: 5 }
});