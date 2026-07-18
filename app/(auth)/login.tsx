import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { Ionicons } from '@expo/vector-icons'; 

export default function LoginScreen() {
  const [loginInput, setLoginInput] = useState(''); // 🌟 Mengganti 'email' menjadi 'loginInput'
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();

  // --- LOGIKA TOMBOL BACK FISIK ANDROID ---
  useEffect(() => {
    const onBackPress = () => {
      router.replace('/'); 
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  const handleLogin = async () => {
    if (!loginInput || !password) {
      Alert.alert('Peringatan', 'Isi email/nama dan password dulu ya!');
      return;
    }

    setLoading(true);
    try {
      // 🌟 Mengirim data dengan key 'login' agar cocok dengan modifikasi backend Laravel
      const response = await axios.post(`${API_URL}/login`, {
        login: loginInput,
        password: password,
      });

      const { user, access_token } = response.data;

      // SIMPAN STATUS DATA USER KE MEMORI HP
      await AsyncStorage.setItem('userToken', access_token || response.data.token);
      await AsyncStorage.setItem('userRole', user.role);
      await AsyncStorage.setItem('userName', user.name);

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
      
      {/* TOMBOL BACK VISUAL DI LAYAR */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.replace('/')}
      >
        <Ionicons name="arrow-back" size={24} color="#673AB7" />
        <Text style={styles.backText}>Kembali</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Login Panel</Text>
      
      {/* 🌟 INPUT 1: Berubah menjadi Email atau Nama Lengkap */}
      <TextInput 
        style={styles.input} 
        placeholder="Email atau Username" 
        value={loginInput}
        onChangeText={setLoginInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      {/* INPUT 2: PASSWORD */}
      <View style={styles.passwordContainer}>
        <TextInput 
          style={styles.inputPassword} 
          placeholder="Password" 
          secureTextEntry={!showPassword} 
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
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
      
      {/* TOMBOL LOGIN */}
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
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 15, color: '#333' },
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
    fontSize: 15,
    color: '#333'
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },
  button: { backgroundColor: '#673AB7', padding: 18, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' }
});