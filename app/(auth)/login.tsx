import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config'; 
// Import Ionicons untuk icon mata
import { Ionicons } from '@expo/vector-icons'; 

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State untuk kontrol mata password
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();

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

      // Logika Navigasi berdasarkan Role
      if (user.role === 'admin') {
        Alert.alert('Berhasil', `Halo Admin ${user.name}, selamat bekerja!`);
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
      <Text style={styles.title}>Login Panel</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      {/* Container Input Password dengan Icon Mata */}
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

      {/* <TouchableOpacity 
        onPress={() => router.push('/(auth)/register' as any)} 
        style={{ marginTop: 25 }}
      >
        <Text style={{ color: '#673AB7', textAlign: 'center', fontWeight: '500' }}>
            Tambah akun? Klik di Sini
        </Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#673AB7' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15 },
  
  // Style untuk pembungkus password agar icon mata sejajar
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