import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { API_URL } from '../config'; 
import { Ionicons } from '@expo/vector-icons'; 

type Customer = {
  id: number;
  username: string;
  nomor_hp: string;
  alamat: string;
};

// 1. Tipe data untuk menampung Master Layanan dari database
type ServiceItem = {
  id: number;
  nama_layanan?: string;
  nama?: string;
  harga: number;
};

export default function TambahPesananV2() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [nomorHp, setNomorHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kategori, setKategori] = useState('Kiloan'); // Kiloan atau Satuan
  const [jenisSatuan, setJenisSatuan] = useState('');
  
  const [idServices, setIdServices] = useState<number>(1);
  const [berat, setBerat] = useState('');
  const [totalTagihan, setTotalTagihan] = useState(0);

  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // STATE BARU: Untuk menyimpan master data tarif layanan dari database VPS
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);

  // STATE BARU: Untuk Manajemen Status Validasi WhatsApp Gateway
  const [isNumberValid, setIsNumberValid] = useState<boolean | null>(null);
  const [checkingNumber, setCheckingNumber] = useState(false);

  // 2. FUNGSI BARU: Mengambil data tarif ter-update dari VPS saat halaman dibuka
  const fetchServicesData = async () => {
    try {
      const response = await axios.get(`${API_URL}/services`);
      if (response.data.success) {
        setServicesList(response.data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil master data tarif laundry:", error);
    }
  };

  useEffect(() => {
    fetchServicesData();
  }, []);

  // 3. LOGIKA BARU: Kalkulasi total tagihan secara dinamis mengikuti database
  useEffect(() => {
    if (kategori === 'Kiloan' && berat) {
      // Cari kecocokan data layanan berdasarkan idServices yang dipilih di Picker
      const layananTerpilih = servicesList.find((s) => Number(s.id) === Number(idServices));
      
      // Ambil harga dari database, jika data API belum termuat maka pakai fallback harga lama kamu
      let hargaBase = layananTerpilih?.harga;

      if (hargaBase === undefined || hargaBase === null) {
        if (idServices === 1) hargaBase = 7000;       
        else if (idServices === 2) hargaBase = 5000;  
        else if (idServices === 3) hargaBase = 5000;  
        else if (idServices === 5) hargaBase = 14000; 
        else if (idServices === 6) hargaBase = 10000;  
        else if (idServices === 7) hargaBase = 10000;  
        else hargaBase = 0;
      }

      setTotalTagihan(parseFloat(berat) * Number(hargaBase));
    }
  }, [berat, idServices, kategori, servicesList]); // Jalankan ulang jika berat, id, atau list data berubah

  const handleCustomerInputChange = async (text: string) => {
    setNama(text);

    if (text.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/customers/search?query=${text}`);
      setSuggestions(response.data);
      setShowSuggestions(response.data.length > 0);
    } catch (error) {
      console.error("Gagal mengambil sugesti pelanggan:", error);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setNama(customer.username);
    setNomorHp(customer.nomor_hp);
    setAlamat(customer.alamat);
    
    setShowSuggestions(false);
    setSuggestions([]);
    setIsNumberValid(true); 
  };

  const validateWhatsAppNumber = async () => {
    if (!nomorHp || nomorHp.trim().length < 9) {
      setIsNumberValid(false);
      return;
    }

    try {
      setCheckingNumber(true);
      setIsNumberValid(null); 

      const response = await axios.get(`${API_URL}/check-number?number=${nomorHp}`);
      setIsNumberValid(response.data.status);
      
      if (!response.data.status) {
        Alert.alert(
          "Peringatan Validasi", 
          "Nomor HP yang diinput tidak terdaftar di WhatsApp. Mohon periksa kembali agar notifikasi nota digital tidak salah kirim!"
        );
      }
    } catch (error) {
      console.error("Gagal validasi nomor WA:", error);
      setIsNumberValid(null); 
      Alert.alert(
        "Koneksi Gateway Gagal", 
        "Gagal terhubung ke server WhatsApp Gateway. Pastikan server Node.js Baileys sudah aktif di VPS Anda."
      );
    } finally {
      setCheckingNumber(false);
    }
  };

  const handleSimpan = async () => {
    if (!nama || !nomorHp || !alamat || (kategori === 'Kiloan' && !berat)) {
      Alert.alert("Gagal", "Mohon lengkapi semua data formulir!");
      return;
    }

    try {
      await axios.post(`${API_URL}/orders`, {
        nama_pelanggan: nama,
        nomor_hp: nomorHp,
        alamat: alamat,
        kategori: kategori, 
        id_services: kategori === 'Kiloan' ? Number(idServices) : 4, 
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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Input Transaksi Baru</Text>

      <View style={{ zIndex: 999, position: 'relative' }}>
        <TextInput 
          style={styles.input} 
          placeholder="Nama Pelanggan" 
          value={nama} 
          onChangeText={handleCustomerInputChange} 
        />
        
        {showSuggestions && (
          <View style={styles.suggestionContainer}>
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => handleSelectCustomer(item)}
              >
                <Ionicons name="person-outline" size={14} color="#673AB7" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.suggestionTextName}>{item.username}</Text>
                  <Text style={styles.suggestionTextDetail}>{item.alamat} • {item.nomor_hp}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View>
        <TextInput 
          style={[
            styles.input,
            isNumberValid === true && { borderColor: '#4CAF50', borderWidth: 1.5 },
            isNumberValid === false && { borderColor: '#D32F2F', borderWidth: 1.5 }
          ]} 
          placeholder="Nomor HP" 
          keyboardType="phone-pad" 
          value={nomorHp} 
          onChangeText={(text) => {
            setNomorHp(text);
            setIsNumberValid(null); 
          }} 
          onBlur={validateWhatsAppNumber} 
        />
        
        {checkingNumber && (
          <View style={styles.statusIndicatorRow}>
            <ActivityIndicator size="small" color="#673AB7" style={{ marginRight: 6 }} />
            <Text style={[styles.indicatorText, { color: '#666' }]}>Memvalidasi status nomor WhatsApp...</Text>
          </View>
        )}
        {isNumberValid === true && !checkingNumber && (
          <Text style={[styles.indicatorText, { color: '#4CAF50' }]}>✓ Nomor terhubung valid dengan sistem WhatsApp</Text>
        )}
        {isNumberValid === false && !checkingNumber && (
          <Text style={[styles.indicatorText, { color: '#D32F2F' }]}>⚠ Nomor tidak valid / tidak terdaftar di WhatsApp</Text>
        )}
      </View>

      <TextInput style={styles.input} placeholder="Alamat" value={alamat} onChangeText={setAlamat} />

      <Text style={styles.label}>Kategori Pesanan</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={kategori} onValueChange={(v) => {
          setKategori(v);
          if (v === 'Satuan') setTotalTagihan(0); 
        }}>
          <Picker.Item label="Kiloan" value="Kiloan" />
          <Picker.Item label="Satuan" value="Satuan" />
        </Picker>
      </View>

      {kategori === 'Kiloan' ? (
        <>
          <Text style={styles.label}>Pilih Paket & Layanan Cucian</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={idServices} onValueChange={(v) => setIdServices(Number(v))}>
              <Picker.Item label="[BIASA] Cuci + Setrika" value={1} />
              <Picker.Item label="[BIASA] Cuci Saja" value={2} />
              <Picker.Item label="[BIASA] Setrika Saja" value={3} />
              
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
  btnText: { color: '#fff', fontWeight: 'bold' },
  
  suggestionContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    position: 'absolute',
    top: 50, 
    left: 0,
    right: 0,
    maxHeight: 180,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionTextName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  suggestionTextDetail: {
    fontSize: 11,
    color: '#666',
    marginTop: 1,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 12
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -10,
    marginBottom: 12,
    paddingLeft: 4
  }
});