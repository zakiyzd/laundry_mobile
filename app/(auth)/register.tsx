import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config'; 
// Import Ionicons untuk icon mata
import { Ionicons } from '@expo/vector-icons'; 

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  
  // State untuk kontrol mata password
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Peringatan', 'Semua kolom wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
        role,
      });

      if (response.data.success) {
        Alert.alert('Berhasil', 'Akun berhasil dibuat! Silakan login.');
        router.replace('/(auth)/login');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Gagal mendaftar. Cek koneksi!';
      Alert.alert('Registrasi Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Daftar Akun Baru</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Nama Lengkap" 
        value={name}
        onChangeText={setName}
      />

      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/* Container Input Password dengan Icon */}
      <View style={styles.passwordContainer}>
        <TextInput 
          style={styles.inputPassword} 
          placeholder="Password (Min. 8 Karakter)" 
          secureTextEntry={!showPassword} // Logika sembunyikan/lihat
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

      <Text style={styles.labelRole}>Daftar Sebagai:</Text>
      <View style={styles.roleWrapper}>
        <TouchableOpacity 
          style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]} 
          onPress={() => setRole('admin')}
        >
          <Text style={[styles.roleText, role === 'admin' && styles.roleTextActive]}>ADMIN</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.roleBtn, role === 'owner' && styles.roleBtnActive]} 
          onPress={() => setRole('owner')}
        >
          <Text style={[styles.roleText, role === 'owner' && styles.roleTextActive]}>OWNER</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>DAFTAR SEKARANG</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
        <Text style={styles.backLink}>Sudah punya akun? Login di sini</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#673AB7' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15 },
  
  // Style khusus untuk password container
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 15,
  },
  inputPassword: {
    flex: 1,
    padding: 15,
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },

  labelRole: { fontSize: 14, marginBottom: 10, color: '#555', fontWeight: 'bold' },
  roleWrapper: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  roleBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#673AB7', borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  roleBtnActive: { backgroundColor: '#673AB7' },
  roleText: { color: '#673AB7', fontWeight: 'bold' },
  roleTextActive: { color: '#fff' },
  button: { backgroundColor: '#673AB7', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  backLink: { color: '#673AB7', textAlign: 'center', fontSize: 14, fontWeight: '500' }
});