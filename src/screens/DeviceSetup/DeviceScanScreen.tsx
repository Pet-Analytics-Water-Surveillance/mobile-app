import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { Device } from 'react-native-ble-plx'

export default function DeviceScanScreen() {
  const navigation = useNavigation<any>()
  const [scanning, setScanning] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])

  useEffect(() => {
    startScan()
    
    return () => {
      // Cleanup scan when component unmounts
      // BluetoothService.stopScan()
    }
  }, [])

  const startScan = () => {
    setScanning(true)
    setDevices([])
    
    // Simulate device discovery for demo purposes
    // In real app, this would use BluetoothService.scanForDevices()
    setTimeout(() => {
      const mockDevices = [
        {
          id: 'device-1',
          name: 'Pet Hydration Device #1',
          localName: 'Pet Hydration Device #1',
        },
        {
          id: 'device-2',
          name: 'Pet Hydration Device #2',
          localName: 'Pet Hydration Device #2',
        },
      ] as any
      
      setDevices(mockDevices)
      setScanning(false)
    }, 3000)
  }

  const connectToDevice = (device: Device) => {
    navigation.navigate('WiFiSetup', { deviceId: device.id })
  }

  const renderDevice = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => connectToDevice(item)}
    >
      <View style={styles.deviceIcon}>
        <Ionicons name="water" size={24} color="#2196F3" />
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>ID: {item.id}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Device</Text>
        <Text style={styles.subtitle}>
          Make sure your device is powered on and in pairing mode
        </Text>
      </View>

      {scanning ? (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.scanningText}>Scanning for devices...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={devices}
            renderItem={renderDevice}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="bluetooth-outline" size={64} color="#C0C0C0" />
                <Text style={styles.emptyText}>No devices found</Text>
                <Text style={styles.emptySubtext}>Make sure your device is in pairing mode</Text>
              </View>
            }
          />
          
          <TouchableOpacity style={styles.rescanButton} onPress={startScan}>
            <Ionicons name="refresh" size={20} color="#2196F3" />
            <Text style={styles.rescanText}>Scan Again</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 20,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  rescanText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
})
