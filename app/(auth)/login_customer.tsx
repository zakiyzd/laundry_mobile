import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config'; 

export default function LoginCustomer() {
  const [hp, setHp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!hp) {
      Alert.alert("Eror", "Masukkan Nomor HP Anda!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login-customer`, {
        nomor_hp: hp
      });

      // PERBAIKAN DI SINI:
      // Laravel mengirim { success: true, username: '...', nomor_hp: '...' }
      // Jadi kita ambil langsung dari response.data
      if (response.data.success) {
        router.replace({
          pathname: '/(customer)',
          params: { 
            username: response.data.username, 
            nomor_hp: response.data.nomor_hp 
          }
        });
      }
      
    } catch (error: any) {
      // Jika error 404 (Nomor tidak ada di tabel orders), pesan dari Laravel akan muncul di sini
      const msg = error.response?.data?.message || "Nomor HP tidak terdaftar atau koneksi terputus.";
      Alert.alert("Gagal Login", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🧺</Text>
      <Text style={styles.title}>Login Pelanggan</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Masukkan Nomor HP Anda..."
        keyboardType="phone-pad"
        value={hp}
        onChangeText={setHp}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>MASUK & CEK STATUS</Text>}
      </TouchableOpacity>

      {/* Sesuai saran sidang proposal: Link daftar ini bisa kamu hapus nanti jika sudah fix */}
      <TouchableOpacity onPress={() => Alert.alert("Info", "Akun otomatis terdaftar saat Anda mencuci di laundry kami.")}>
        <Text style={styles.link}>Cara cek status? Cukup masukkan nomor HP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  emoji: { fontSize: 60, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#673AB7', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 12, marginBottom: 20 },
  button: { backgroundColor: '#673AB7', padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  link: { color: '#666', textAlign: 'center', marginTop: 20 }
});