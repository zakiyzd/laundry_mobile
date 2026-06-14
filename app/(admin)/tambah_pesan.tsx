import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { API_URL } from '../config'; 

export default function TambahPesananV2() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [nomorHp, setNomorHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kategori, setKategori] = useState('Kiloan'); // Kiloan atau Satuan
  const [jenisSatuan, setJenisSatuan] = useState('');
  
  // STATE BARU: Menyimpan ID Layanan (default 1 = [BIASA] Cuci+Setrika)
  const [idServices, setIdServices] = useState<number>(1);
  const [berat, setBerat] = useState('');
  const [totalTagihan, setTotalTagihan] = useState(0);

  // LOGIKA HITUNG HARGA KILOAN DINAMIS (Menyesuaikan master harga database baru)
  useEffect(() => {
    if (kategori === 'Kiloan' && berat) {
      let hargaBase = 0;
      
      // Pemetaan harga mengikuti ID master data services yang baru saja di-insert
      if (idServices === 1) hargaBase = 6000;       // [BIASA] Cuci+Setrika
      else if (idServices === 2) hargaBase = 4000;  // [BIASA] Cuci Saja
      else if (idServices === 3) hargaBase = 4000;  // [BIASA] Setrika Saja
      else if (idServices === 5) hargaBase = 12000; // [EXPRESS] Cuci+Setrika
      else if (idServices === 6) hargaBase = 8000;  // [EXPRESS] Cuci Saja
      else if (idServices === 7) hargaBase = 8000;  // [EXPRESS] Setrika Saja

      setTotalTagihan(parseFloat(berat) * hargaBase);
    }
  }, [berat, idServices, kategori]);

  const handleSimpan = async () => {
    if (!nama || !nomorHp || !alamat || (kategori === 'Kiloan' && !berat)) {
      Alert.alert("Gagal", "Mohon lengkapi semua data formulir!");
      return;
    }

    try {
      // Menembak payload baru yang sesuai dengan Request Validation Laravel
      await axios.post(`${API_URL}/orders`, {
        nama_pelanggan: nama,
        nomor_hp: nomorHp,
        alamat: alamat,
        kategori: kategori, // Dikirim agar Laravel tahu jenis transaksinya
        id_services: kategori === 'Kiloan' ? Number(idServices) : 4, // ID 4 khusus penampung Satuan di database
        jenis_satuan: kategori === 'Satuan' ? jenisSatuan : null,
        berat: kategori === 'Kiloan' ? parseFloat(berat) : 0,
        total_harga: totalTagihan,
      });

      Alert.alert("Sukses", "Pesanan Berhasil Disimpan");
      router.replace('/(admin)');
    } catch (e: any) {
      console.error(e);
      Alert.alert("Gagal", e.response?.data?.message || "Cek koneksi server");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Input Transaksi Baru</Text>

      <TextInput style={styles.input} placeholder="Nama Pelanggan" value={nama} onChangeText={setNama} />
      <TextInput style={styles.input} placeholder="Nomor HP" keyboardType="phone-pad" value={nomorHp} onChangeText={setNomorHp} />
      <TextInput style={styles.input} placeholder="Alamat" value={alamat} onChangeText={setAlamat} />

      <Text style={styles.label}>Kategori Pesanan</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={kategori} onValueChange={(v) => {
          setKategori(v);
          if (v === 'Satuan') setTotalTagihan(0); // Reset total jika pindah ke satuan
        }}>
          <Picker.Item label="Kiloan" value="Kiloan" />
          <Picker.Item label="Satuan" value="Satuan" />
        </Picker>
      </View>

      {kategori === 'Kiloan' ? (
        <>
          <Text style={styles.label}>Pilih Paket & Layanan Cucian</Text>
          <View style={styles.pickerContainer}>
            {/* SATU DROPDOWN GABUNGAN YANG JAUH LEBIH RINGKAS */}
            <Picker selectedValue={idServices} onValueChange={(v) => setIdServices(Number(v))}>
              {/* KELOMPOK BIASA */}
              <Picker.Item label="[BIASA] Cuci + Setrika" value={1} />
              <Picker.Item label="[BIASA] Cuci Saja" value={2} />
              <Picker.Item label="[BIASA] Setrika Saja" value={3} />
              
              {/* KELOMPOK EXPRESS (2x Lipat sesuai rancangan database baru) */}
              <Picker.Item label="[EXPRESS] Cuci + Setrika" value={5} />
              <Picker.Item label="[EXPRESS] Cuci Saja" value={6} />
              <Picker.Item label="[EXPRESS] Setrika Saja" value={7} />
            </Picker>
          </View>

          <TextInput style={styles.input} placeholder="Berat (Kg)" keyboardType="numeric" value={berat} onChangeText={setBerat} />
        </>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="Jenis Satuan (Bedcover, dll)" value={jenisSatuan} onChangeText={setJenisSatuan} />
          <TextInput 
            style={styles.input} 
            placeholder="Total Harga Manual" 
            keyboardType="numeric" 
            onChangeText={(v) => setTotalTagihan(parseInt(v) || 0)} 
          />
        </>
      )}

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total Tagihan:</Text>
        <Text style={styles.totalValue}>Rp {totalTagihan.toLocaleString()}</Text>
      </View>

      <TouchableOpacity style={styles.btnSimpan} onPress={handleSimpan}>
        <Text style={styles.btnText}>Simpan Transaksi</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 50 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15 },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 15 },
  totalBox: { padding: 20, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 20 },
  totalLabel: { fontSize: 16, color: '#333' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#673AB7' },
  btnSimpan: { backgroundColor: '#673AB7', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});