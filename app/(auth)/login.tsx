import React, { useState, useEffect } from 'react'; // 🔥 Tambahkan useEffect
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, BackHandler } from 'react-native'; // 🔥 Tambahkan BackHandler
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { Ionicons } from '@expo/vector-icons'; 

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();

  // 🔥 --- LOGIKA TOMBOL BACK FISIK ANDROID ---
  useEffect(() => {
    const onBackPress = () => {
      router.replace('/'); // Paksa kembali ke halaman opsi rute utama
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Peringatan', 'Isi email dan password dulu ya!');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email: email,
        password: password,
      });

      const { user } = response.data;

      // SIMPAN STATUS ROLE USER KE MEMORI HP
      await AsyncStorage.setItem('userRole', user.role);

      // Logika Navigasi berdasarkan Role
      if (user.role === 'admin') {
        Alert.alert('Berhasil', `Halo ${user.name}, selamat bekerja!`);
        router.replace('/(admin)');
      } 
      else if (user.role === 'owner') {
        Alert.alert('Berhasil', `Selamat datang, ${user.name}!`);
        router.replace('/(owner)');
      } 
      else {
        Alert.alert('Berhasil', `Halo ${user.name}, selamat datang!`);
        router.replace('/(customer)');
      }

    } catch (error: any) {
      const msg = error.response?.data?.message || 'Koneksi gagal. Cek Laravel & Wi-Fi!';
      Alert.alert('Login Gagal', msg);
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

      <Text style={styles.title}>Login Panel</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <View style={styles.passwordContainer}>
        <TextInput 
          style={styles.inputPassword} 
          placeholder="Password" 
          secureTextEntry={!showPassword} 
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity 
          style={styles.eyeIcon} 
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
            size={24} 
            color="#888" 
          />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.7 }]} 
        onPress={handleLogin} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>MASUK</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  
  // 🔥 STYLE SINKRON UNTUK TOMBOL BACK
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

  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#673AB7' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 20,
  },
  inputPassword: {
    flex: 1,
    padding: 15,
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },
  button: { backgroundColor: '#673AB7', padding: 18, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' }
});