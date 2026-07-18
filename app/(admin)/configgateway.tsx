import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config'; 

export default function ConfigGatewayScreen() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // 1. Fungsi Mengecek Status Koneksi WhatsApp Ke Server Node.js (via Laravel)
  const checkGatewayStatus = async () => {
    try {
      setChecking(true);
      const response = await axios.get(`${API_URL}/gateway/status`);
      
      if (response.data.success) {
        setStatus(response.data.connected ? 'connected' : 'disconnected');
        if (!response.data.connected && response.data.qr) {
          setQrCodeData(response.data.qr);
        } else {
          setQrCodeData(null);
        }
      }
    } catch (error) {
      console.error("Gagal mengecek status gateway:", error);
      setStatus('disconnected');
    } finally {
      setChecking(false);
      setStatus(prev => prev === 'loading' ? 'disconnected' : prev);
    }
  };

  useEffect(() => {
    checkGatewayStatus();
    
    // Auto polling refresh data setiap 10 detik
    const interval = setInterval(checkGatewayStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fungsi Putus Koneksi (Logout WhatsApp Device)
  const handleDisconnect = async () => {
    Alert.alert(
      "Konfirmasi",
      "Apakah Anda yakin ingin memutuskan tautan WhatsApp perangkat ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Putuskan",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await axios.post(`${API_URL}/gateway/disconnect`);
              if (response.data.success) {
                Alert.alert("Sukses", "Perangkat berhasil diputuskan.");
                checkGatewayStatus();
              }
            } catch (error) {
              Alert.alert("Eror", "Gagal memutuskan koneksi gateway server.");
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
      <Text style={styles.title}>📱 WhatsApp Gateway</Text>
      <Text style={styles.subtitle}>Integrasi Notifikasi Nota Digital MM Laundry</Text>

      {/* CARD STATUS */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Status Server:</Text>
          <View style={[styles.badge, status === 'connected' ? styles.badgeConnected : styles.badgeDisconnected]}>
            <Text style={styles.badgeText}>
              {status === 'connected' ? 'TERKONEKSI' : 'TERPUTUS'}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>
          {status === 'connected' 
            ? "Sistem WhatsApp aktif. Nota otomatis akan dikirim ke nomor pelanggan setiap kali transaksi kasir disimpan."
            : "Sistem WhatsApp nonaktif atau terputus. Silakan lakukan pemindaian QR Code di bawah menggunakan aplikasi WhatsApp Anda."}
        </Text>

        <TouchableOpacity 
          style={styles.btnRefresh} 
          disabled={checking}
          onPress={checkGatewayStatus}
        >
          {checking ? (
            <ActivityIndicator size="small" color="#673AB7" />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color="#673AB7" />
              <Text style={styles.btnRefreshText}> Refresh Status</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* KONDISI 1: TERKONEKSI */}
      {status === 'connected' && (
        <View style={styles.actionCard}>
          <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
          <Text style={styles.infoSuccess}>WhatsApp Siap Digunakan</Text>
          
          <TouchableOpacity 
            style={styles.btnDisconnect} 
            disabled={actionLoading}
            onPress={handleDisconnect}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnText}>Putuskan Tautan (Logout)</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* KONDISI 2: TERPUTUS (DENGAN IMAGE BASE64 DINAMIS) */}
      {status === 'disconnected' && (
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Pindai Kode QR Baru</Text>
          <Text style={styles.qrInstruction}>
            Buka WhatsApp di HP Anda → Menu Tautan Perangkat → Tautkan Perangkat Baru.
          </Text>

          <View style={styles.qrContainer}>
            {qrCodeData ? (
              <Image 
                source={{ uri: qrCodeData }} 
                style={{ width: 200, height: 200, resizeMode: 'contain' }} 
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <ActivityIndicator size="large" color="#666" />
                <Text style={styles.placeholderText}>Menunggu Kode QR dari VPS...</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  centerContent: { alignItems: 'center', paddingTop: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 25 },
  card: { backgroundColor: '#fff', width: '100%', padding: 20, borderRadius: 12, elevation: 2, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#444' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  badgeConnected: { backgroundColor: '#E8F5E9' },
  badgeDisconnected: { backgroundColor: '#FFEBEE' },
  badgeText: { fontWeight: 'bold', fontSize: 12, color: '#333' },
  description: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 15 },
  btnRefresh: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: '#673AB7', borderRadius: 8 },
  btnRefreshText: { color: '#673AB7', fontWeight: 'bold', fontSize: 14 },
  
  actionCard: { backgroundColor: '#fff', width: '100%', padding: 25, borderRadius: 12, elevation: 2, alignItems: 'center' },
  infoSuccess: { fontSize: 16, fontWeight: 'bold', color: '#444', marginTop: 10, marginBottom: 20 },
  btnDisconnect: { backgroundColor: '#D32F2F', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  qrCard: { backgroundColor: '#fff', width: '100%', padding: 20, borderRadius: 12, elevation: 2, alignItems: 'center' },
  qrTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  qrInstruction: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
  qrContainer: { width: 220, height: 220, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 8, justifyContent: 'center', alignItems: 'center', padding: 10 },
  qrPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 11, color: '#888', marginTop: 10, textAlign: 'center' }
});