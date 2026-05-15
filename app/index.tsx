import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function LandingPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🧺</Text>
      <Text style={styles.title}>MM LAUNDRY</Text>
      <Text style={styles.subtitle}>Pilih menu masuk di bawah ini:</Text>

      {/* TOMBOL UNTUK CUSTOMER */}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#673AB7' }]} 
        onPress={() => router.push('/(auth)/login_customer')}
      >
        <Text style={styles.buttonText}>Masuk sebagai Pelanggan</Text>
      </TouchableOpacity>

      {/* TOMBOL UNTUK ADMIN */}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#673AB7', marginTop: 15 }]} 
        onPress={() => router.push('/(auth)/login')}
      >
        <Text style={styles.buttonText}>Masuk sebagai Admin/Owner</Text>
      </TouchableOpacity>
      
      {/* <Text style={styles.footerText}>Universitas Peradaban - SI 2026</Text> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  emoji: { fontSize: 80, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 40, marginTop: 10 },
  button: { padding: 18, borderRadius: 15, alignItems: 'center', elevation: 3 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  footerText: { textAlign: 'center', marginTop: 50, color: '#ccc', fontSize: 12 }
});