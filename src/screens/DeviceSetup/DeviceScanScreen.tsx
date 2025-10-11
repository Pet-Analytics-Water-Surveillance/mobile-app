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
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

export default function DeviceScanScreen() {
  const navigation = useNavigation<any>()
  const [scanning, setScanning] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

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
      activeOpacity={0.85}
    >
      <View style={styles.deviceIcon}>
        <Ionicons name="water" size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>ID: {item.id}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
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
          <ActivityIndicator size="large" color={theme.colors.primary} />
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
                <Ionicons name="bluetooth-outline" size={64} color={theme.colors.muted} />
                <Text style={styles.emptyText}>No devices found</Text>
                <Text style={styles.emptySubtext}>Make sure your device is in pairing mode</Text>
              </View>
            }
          />
          
          <TouchableOpacity style={styles.rescanButton} onPress={startScan} activeOpacity={0.85}>
            <Ionicons name="refresh" size={20} color={theme.colors.primary} />
            <Text style={styles.rescanText}>Scan Again</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  )
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    scanningContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scanningText: {
      marginTop: 20,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    listContent: {
      padding: 20,
    },
    deviceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      padding: 15,
      borderRadius: 12,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.mode === 'dark' ? 0 : 0.05,
      shadowRadius: 3,
      elevation: theme.mode === 'dark' ? 0 : 2,
    },
    deviceIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    deviceInfo: {
      flex: 1,
    },
    deviceName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    deviceId: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      marginTop: 100,
      paddingHorizontal: 20,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 20,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    rescanButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.card,
      marginHorizontal: 20,
      marginBottom: 20,
      paddingVertical: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      gap: 8,
    },
    rescanText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '600',
    },
  })
