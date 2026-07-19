import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
    ActivityIndicator,
    FlatList,
    Alert,
} from "react-native";
// 🌟 Import library Bluetooth Printer dan AsyncStorage
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();

  // --- STATE UNTUK BLUETOOTH PRINTER ---
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingBt, setLoadingBt] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedName, setConnectedName] = useState<string>('Belum Terhubung');

// 🌟 Kode bypass aman agar tidak crash di Expo Go
const BluetoothPrinterModule = NativeModules.BluetoothEscPosPrinter 
  ? require('react-native-bluetooth-escpos-printer') 
  : {
      BluetoothEscPosPrinter: {
        printText: async (text: string) => {
          // Mengeluarkan visualisasi test print di terminal laptop kamu saat di Expo Go
          console.log("=== [MOCK TEST PRINT] ===\n" + text);
          return true;
        }
      },
      BluetoothManager: {
        getBluetoothDeviceList: async () => JSON.stringify([
          { name: "Printer Mock Test 1", address: "00:11:22:33:44:55" },
          { name: "Printer Mock Test 2", address: "66:77:88:99:AA:BB" }
        ]),
        connect: async (mac: string) => {
          console.log("Mock Connected to:", mac);
          return true;
        }
      }
    };

// 🌟 Ekstrak kedua modul: Manager (untuk koneksi) & Printer (untuk cetak teks)
const { BluetoothManager, BluetoothEscPosPrinter } = BluetoothPrinterModule;

  // Load nama printer terhubung saat komponen pertama kali dipasang
  useEffect(() => {
    const checkSavedPrinter = async () => {
      const savedName = await AsyncStorage.getItem('savedPrinterName');
      if (savedName) setConnectedName(savedName);
    };
    checkSavedPrinter();
  }, []);

  // 🔍 FUNGSI SCAN PRINTER BLUETOOTH
  const handleScanPrinter = async () => {
    setLoadingBt(true);
    try {
      const deviceList = await BluetoothManager.getBluetoothDeviceList();
      const parsed = typeof deviceList === 'string' ? JSON.parse(deviceList) : deviceList;
      setDevices(parsed || []);
    } catch (error) {
      Alert.alert('Bluetooth Eror', 'Pastikan Bluetooth HP aktif dan izin aplikasi sudah diberikan.');
    } finally {
      setLoadingBt(false);
    }
  };

  // 🔌 FUNGSI HUBUNGKAN (PAIRING) KE PRINTER
  const handleConnect = async (macAddress: string, name: string) => {
    setLoadingBt(true);
    try {
      await BluetoothManager.connect(macAddress);
      
      // Simpan datanya di internal HP biar di halaman transaksi tinggal panggil
      await AsyncStorage.setItem('savedPrinterAddress', macAddress);
      await AsyncStorage.setItem('savedPrinterName', name);
      
      setConnectedName(name);
      Alert.alert('Berhasil', `Printer ${name} siap digunakan!`);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Gagal', 'Koneksi ke printer gagal. Nyalakan ulang printer kasir.');
    } finally {
      setLoadingBt(false);
    }
  };

  const handleTestPrint = async () => {
  let testText = "";
  testText += "================================\n";
  testText += "       MM LAUNDRY TEST        \n";
  testText += "================================\n";
  testText += "Printer Status : KONEK/OK\n";
  testText += "Lebar Kertas   : 58mm (32 Karakter)\n";
  testText += "Sistem Bluetooth: Berhasil\n";
  testText += "================================\n";
  testText += "\n\n\n"; // Enter 3x agar kertas terdorong melewati pisau potong fisik printer

  try {
    await BluetoothEscPosPrinter.printText(testText, {});
  } catch (error) {
    Alert.alert("Error", "Gagal mengirim data test print ke printer.");
  }
};

  const menuItems = [
    {
      title: "Manajemen Akun",
      description: "Tambah akun baru untuk admin atau owner",
      icon: "people-outline",
      iconColor: "#4CAF50",
      actionType: "navigate" as const,
      path: "/register" as const,
    },
    {
      title: "Kelola Tarif Laundry",
      description: "Ubah nominal harga paket laundry",
      icon: "cash-outline",
      iconColor: "#FF9800",
      actionType: "navigate" as const,
      path: "/kelolaharga" as const,
    },
    {
      title: "WhatsApp Gateway",
      description: "Cek status server, scan QR baru, atau putus tautan nomor",
      icon: "logo-whatsapp",
      iconColor: "#25D366",
      actionType: "navigate" as const,
      path: "/configgateway" as const,
    },
    // 🌟 MENU BARU: Menangani printer thermal langsung di tempat
    {
      title: "Pengaturan Printer Thermal",
      description: `Status: ${connectedName}`,
      icon: "print-outline",
      iconColor: "#673AB7",
      actionType: "modal" as const,
      path: "" as any,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Pengaturan Sistem</Text>
      <Text style={styles.subtitle}>
        Konfigurasi dan kelola MM Laundry Anda
      </Text>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.item,
              index === menuItems.length - 1 && { borderBottomWidth: 0 }, // Hilangkan garis bawah untuk item terakhir
            ]}
            onPress={() => {
              if (item.actionType === "navigate") {
                router.push(item.path);
              } else if (item.actionType === "modal") {
                setModalVisible(true);
                handleScanPrinter(); // Auto-scan ketika menu diklik
              }
            }}
            activeOpacity={0.7}
          >
            {/* Bagian Kiri: Ikon */}
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: item.iconColor + "15" },
              ]}
            >
              <Ionicons
                name={item.icon as any}
                size={22}
                color={item.iconColor}
              />
            </View>

            {/* Bagian Tengah: Teks Konten */}
            <View style={styles.textWrapper}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>

            {/* Bagian Kanan: Tanda Panah */}
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        ))}
      </View>
{/* 🌟 MODAL POP-UP UNTUK SCAN BLUETOOTH */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Printer Bluetooth</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#AAA" />
              </TouchableOpacity>
            </View>

            {/* 🌟 TOMBOL BARU: Muncul otomatis jika printer sudah sukses terhubung */}
            {connectedName !== 'Belum Terhubung' && (
              <TouchableOpacity style={styles.testBtn} onPress={handleTestPrint}>
                <Ionicons name="paper-plane-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.testBtnText}>Test Cetak Kertas ({connectedName})</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.scanBtn} onPress={handleScanPrinter} disabled={loadingBt}>
              <Text style={styles.scanBtnText}>{loadingBt ? 'Memindai...' : 'Scan Ulang Perangkat'}</Text>
            </TouchableOpacity>

            {loadingBt && <ActivityIndicator size="large" color="#673AB7" style={{ marginVertical: 15 }} />}

            <FlatList
              data={devices}
              keyExtractor={(item) => item.address}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.deviceItem}
                  onPress={() => handleConnect(item.address, item.name || 'Printer Kasir')}
                >
                  <Ionicons name="bluetooth" size={20} color="#673AB7" />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.deviceName}>{item.name || 'Perangkat Tanpa Nama'}</Text>
                    <Text style={styles.deviceMac}>{item.address}</Text>
                  </View>
                  <Text style={styles.connectText}>Konek</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !loadingBt ? <Text style={styles.emptyText}>Tidak ada perangkat bluetooth kasir ditemukan.</Text> : null
              }
            />
          </View>
        </View>
      </Modal>

      {/* Footer Info Versi Aplikasi Otomatis */}
      <Text style={styles.versionText}>
        MM Laundry v{Constants.expoConfig?.version || "1.0.0"}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 25,
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textWrapper: {
    flex: 1,
    paddingRight: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  itemDescription: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    color: "#BBB",
    marginTop: 40,
    fontWeight: "500",
  },
  
  // 🌟 STYLE MODAL BARU
  modalContainer: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20, 
    height: '60%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1A1A1A' 
  },
  scanBtn: { 
    backgroundColor: '#673AB7', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 15 
  },
  scanBtnText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold' 
  },
  deviceItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  deviceName: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  deviceMac: { 
    fontSize: 11, 
    color: '#999', 
    marginTop: 2 
  },
  connectText: { 
    color: '#673AB7', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#999', 
    marginTop: 30, 
    fontSize: 13 
  },
  testBtn: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50', // Hijau indikator sukses
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  testBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});