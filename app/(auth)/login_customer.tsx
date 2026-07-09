import React, { useState, useEffect } from 'react'; // 🔥 Tambahkan useEffect untuk back handler fisik
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, BackHandler } from 'react-native'; // 🔥 Tambahkan BackHandler
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { registerForPushNotificationsAsync } from '../utils/registerForPushNotifications';
import { Ionicons } from '@expo/vector-icons'; // 🔥 Tambahkan import ikon bawaan Expo

export default function LoginCustomer() {
  const [hp, setHp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🔥 --- LOGIKA TOMBOL BACK FISIK ANDROID ---
  useEffect(() => {
    const onBackPress = () => {
      router.replace('/'); // Paksa mundur ke halaman opsi login
      return true; // Menandakan kita handle sendiri aksinya
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  const handleLogin = async () => {
    if (!hp) {
      Alert.alert("Eror", "Masukkan Nomor HP Anda!");
      return;
    }

    setLoading(true);
    try {
      const pushToken = await registerForPushNotificationsAsync();
      console.log("Token yang akan dikirim:", pushToken); 

      const response = await axios.post(`${API_URL}/orders/check-status`, {
        nomor_hp: hp,
        expo_push_token: pushToken 
      });

      if (response.data.success) {
        const customerData = response.data.customer;

        await AsyncStorage.setItem('userRole', 'customer');
        await AsyncStorage.setItem('customerHp', customerData.nomor_hp);
        await AsyncStorage.setItem('customerUsername', customerData.username);

        router.replace({
          pathname: '/(customer)',
          params: { 
            username: customerData.username, 
            nomor_hp: customerData.nomor_hp 
          }
        });
      }
      
    } catch (error: any) {
      const msg = error.response?.data?.message || "Nomor HP tidak terdaftar atau koneksi terputus.";
      Alert.alert("Gagal Login", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* 🔥 TOMBOL BACK VISUAL DI LAYAR */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.replace('/')}
      >
        <Ionicons name="arrow-back" size={24} color="#673AB7" />
        <Text style={styles.backText}>Kembali</Text>
      </TouchableOpacity>

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

      <TouchableOpacity onPress={() => Alert.alert("Info", "Akun otomatis terdaftar saat Anda mencuci di laundry kami.")}>
        <Text style={styles.link}>Cara cek status? Cukup masukkan nomor HP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  
  // 🔥 STYLE BARU UNTUK TOMBOL BACK agar posisinya pas di kiri atas layar
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 50, 
    left: 25,
    zIndex: 10,
  },
  backText: {
    fontSize: 16,
    marginLeft: 5,
    color: '#673AB7',
    fontWeight: 'bold'
  },

  emoji: { fontSize: 60, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#673AB7', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 12, marginBottom: 20 },
  button: { backgroundColor: '#673AB7', padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  link: { color: '#666', textAlign: 'center', marginTop: 20 }
});