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
  const [tipePaket, setTipePaket] = useState('Biasa'); // Biasa atau Express
  const [layanan, setLayanan] = useState('Cuci+Setrika');
  const [berat, setBerat] = useState('');
  const [totalTagihan, setTotalTagihan] = useState(0);

  // LOGIKA HITUNG HARGA KILOAN
  useEffect(() => {
    if (kategori === 'Kiloan' && berat) {
      let hargaBase = 0;
      if (layanan === 'Cuci+Setrika') hargaBase = 6000;
      else if (layanan === 'Cuci Saja') hargaBase = 4000;
      else if (layanan === 'Setrika Saja') hargaBase = 4000;

      let pengali = tipePaket === 'Express' ? 2 : 1;
      setTotalTagihan(parseFloat(berat) * hargaBase * pengali);
    }
  }, [berat, layanan, tipePaket, kategori]);

  const handleSimpan = async () => {
    try {
      
      await axios.post(`${API_URL}/orders`, {
        nama_pelanggan: nama,
        nomor_hp: nomorHp,
        alamat: alamat,
        kategori_pesanan: kategori,
        jenis_satuan: kategori === 'Satuan' ? jenisSatuan : null,
        tipe_paket: kategori === 'Kiloan' ? tipePaket : null,
        layanan: layanan,
        berat: kategori === 'Kiloan' ? parseFloat(berat) : 0,
        total_harga: totalTagihan,
        status: 'Antre'
      });
      Alert.alert("Sukses", "Pesanan Berhasil Disimpan");
      router.replace('/(admin)');
    } catch (e) {
      Alert.alert("Gagal", "Cek koneksi server");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Input Pesanan Baru</Text>

      <TextInput style={styles.input} placeholder="Nama Pelanggan" value={nama} onChangeText={setNama} />
      <TextInput style={styles.input} placeholder="Nomor HP" keyboardType="phone-pad" value={nomorHp} onChangeText={setNomorHp} />
      <TextInput style={styles.input} placeholder="Alamat" value={alamat} onChangeText={setAlamat} />

      <Text style={styles.label}>Kategori Pesanan</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={kategori} onValueChange={(v) => setKategori(v)}>
          <Picker.Item label="Kiloan" value="Kiloan" />
          <Picker.Item label="Satuan" value="Satuan" />
        </Picker>
      </View>

      {kategori === 'Kiloan' ? (
        <>
          <Text style={styles.label}>Tipe Paket</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={tipePaket} onValueChange={(v) => setTipePaket(v)}>
              <Picker.Item label="Biasa" value="Biasa" />
              <Picker.Item label="Express (2x Lipat)" value="Express" />
            </Picker>
          </View>

          <Text style={styles.label}>Layanan</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={layanan} onValueChange={(v) => setLayanan(v)}>
              <Picker.Item label="Cuci+Setrika" value="Cuci+Setrika" />
              <Picker.Item label="Cuci Saja" value="Cuci Saja" />
              <Picker.Item label="Setrika Saja" value="Setrika Saja" />
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
        <Text style={styles.btnText}>Simpan Pesanan</Text>
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
  btnSimpan: { backgroundColor: '#673AB7', padding: 18, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});