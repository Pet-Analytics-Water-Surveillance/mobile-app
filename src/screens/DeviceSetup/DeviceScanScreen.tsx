import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'
import { bleService, ScannedDevice } from '../../services/bluetooth/BLEService'

export default function DeviceScanScreen() {
  const navigation = useNavigation<any>()
  const [scanning, setScanning] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectingDeviceName, setConnectingDeviceName] = useState('')
  const [devices, setDevices] = useState<ScannedDevice[]>([])
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [debugMode, setDebugMode] = useState(false)
  const [allDevices, setAllDevices] = useState<ScannedDevice[]>([])
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

  useEffect(() => {
    initializeBluetooth()
    
    return () => {
      // Cleanup scan when component unmounts
      bleService.stopScan()
    }
  }, [])

  const initializeBluetooth = async () => {
    try {
      console.log('📱 Initializing Bluetooth from DeviceScanScreen...')
      setErrorMessage('')
      const initialized = await bleService.initialize()
      setBluetoothEnabled(initialized)

      if (initialized) {
        console.log('✅ Bluetooth initialized, starting scan...')
        startScan()
      } else {
        const errorMsg = 'Bluetooth is not enabled. Please turn on Bluetooth in your device settings.'
        setErrorMessage(errorMsg)
        console.error('❌ Bluetooth not initialized')
        Alert.alert(
          'Bluetooth Required',
          errorMsg,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: initializeBluetooth },
          ]
        )
      }
    } catch (error) {
      console.error('❌ Bluetooth initialization error:', error)
      setErrorMessage('Failed to initialize Bluetooth')
      Alert.alert('Error', 'Failed to initialize Bluetooth. Please try again.')
    }
  }

  const startScan = async () => {
    try {
      console.log('🔄 Starting device scan...')
      setScanning(true)
      setDevices([])
      setAllDevices([])
      setErrorMessage('')
      setScanProgress(0)

      // Progress indicator - update every 500ms
      const scanDuration = 10000
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          const newProgress = prev + (500 / scanDuration) * 100
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 500)

      await bleService.scanForDevices(
        (device) => {
          console.log('📱 PetFountain device found:', device.name)
          // Add device to list (avoid duplicates)
          setDevices((prev) => {
            const exists = prev.find((d) => d.id === device.id)
            if (exists) return prev
            console.log('➕ Adding PetFountain device to list:', device.name)
            return [...prev, device]
          })
        },
        scanDuration, // Scan for 10 seconds
        (device) => {
          // Debug callback - all devices
          setAllDevices((prev) => {
            const exists = prev.find((d) => d.id === device.id)
            if (exists) return prev
            return [...prev, device]
          })
        }
      )

      clearInterval(progressInterval)
      setScanProgress(100)
      setScanning(false)
      console.log('✅ Scan completed')
    } catch (error: any) {
      console.error('❌ Scan error:', error)
      setScanning(false)
      setScanProgress(0)
      const errorMsg = error?.message || 'Failed to scan for devices'
      setErrorMessage(errorMsg)
      Alert.alert('Scan Error', errorMsg + '. Please try again.')
    }
  }

  const connectToDevice = async (device: ScannedDevice) => {
    try {
      Alert.alert(
        'Connect to Device',
        `Connect to ${device.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Connect',
            onPress: async () => {
              try {
                // Stop scanning
                bleService.stopScan()
                
                // Show connecting state
                setConnecting(true)
                setConnectingDeviceName(device.name)
                
                // Connect to device and verify firmware connection
                console.log('🔵 Connecting to device:', device.id)
                await bleService.connect(device.id)
                console.log('✅ Connected successfully, navigating to WiFi setup')
                
                // Hide connecting state
                setConnecting(false)
                
                // Navigate to WiFi setup
                navigation.navigate('WiFiSetup', { 
                  deviceId: device.id,
                  deviceName: device.name 
                })
              } catch (error: any) {
                console.error('❌ Connection error:', error)
                setConnecting(false)
                Alert.alert('Connection Failed', error.message || 'Could not connect to device.')
              }
            },
          },
        ]
      )
    } catch (error) {
      console.error('Connect error:', error)
    }
  }

  const renderDevice = ({ item }: { item: ScannedDevice }) => (
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
        <Text style={styles.deviceId}>Signal: {item.rssi} dBm</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Find Your Device</Text>
            <Text style={styles.subtitle}>
              Make sure your device is powered on and in pairing mode
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => setDebugMode(!debugMode)}
            style={styles.debugButton}
          >
            <Ionicons 
              name={debugMode ? "bug" : "bug-outline"} 
              size={24} 
              color={debugMode ? theme.colors.primary : theme.colors.muted} 
            />
          </TouchableOpacity>
        </View>

        {/* Scanning State */}
        {scanning && (
          <View style={styles.card}>
            <View style={styles.scanningContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.scanningText}>Scanning for devices...</Text>
              <Text style={styles.scanningSubtext}>
                {Math.round(scanProgress)}% - Looking for PetFountain devices
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${scanProgress}%` }]} />
              </View>
            </View>
          </View>
        )}

        {/* Connecting State */}
        {connecting && (
          <View style={styles.card}>
            <View style={styles.scanningContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.scanningText}>Connecting to device...</Text>
              <Text style={styles.scanningSubtext}>
                {connectingDeviceName} - Establishing secure connection
              </Text>
            </View>
          </View>
        )}

        {/* Error Message */}
        {errorMessage && !scanning && (
          <View style={[styles.card, styles.errorCard]}>
            <Ionicons name="alert-circle" size={24} color={theme.colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Devices List */}
        {!scanning && !connecting && devices.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Available Devices</Text>
            {devices.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.deviceCard}
                onPress={() => connectToDevice(item)}
                activeOpacity={0.7}
              >
                <View style={styles.deviceIcon}>
                  <Ionicons name="water" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                  <Text style={styles.deviceId}>Signal: {item.rssi} dBm</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Debug Mode - All Devices */}
        {debugMode && !scanning && allDevices.length > 0 && (
          <View style={styles.card}>
            <View style={styles.debugHeader}>
              <Ionicons name="bug" size={20} color={theme.colors.warning} />
              <Text style={styles.debugTitle}>Debug Mode - All Devices ({allDevices.length})</Text>
            </View>
            <Text style={styles.debugSubtext}>
              Showing all Bluetooth devices found during scan
            </Text>
            <ScrollView style={styles.debugList} nestedScrollEnabled>
              {allDevices.map((item) => (
                <View key={item.id} style={styles.debugDeviceCard}>
                  <View style={styles.debugDeviceInfo}>
                    <Text style={styles.debugDeviceName}>{item.name}</Text>
                    <Text style={styles.debugDeviceId} numberOfLines={1}>{item.id}</Text>
                  </View>
                  <Text style={styles.debugDeviceRssi}>{item.rssi} dBm</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Empty State */}
        {!scanning && !connecting && devices.length === 0 && !errorMessage && (
          <View style={styles.card}>
            <View style={styles.emptyState}>
              <Ionicons name="bluetooth-outline" size={64} color={theme.colors.muted} />
              <Text style={styles.emptyText}>No PetFountain devices found</Text>
              <Text style={styles.emptySubtext}>
                Make sure your PetFountain device is powered on and in pairing mode
              </Text>
              <Text style={styles.emptyHint}>
                💡 The device should be advertising as "PetFountain-XXXX"
              </Text>
              {!debugMode && allDevices.length > 0 && (
                <Text style={styles.emptyHint}>
                  🔍 {allDevices.length} other device(s) found - tap the bug icon to see them
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Scan Button */}
        {!scanning && !connecting && (
          <TouchableOpacity style={styles.scanButton} onPress={startScan} activeOpacity={0.8}>
            <Ionicons name="refresh" size={20} color={theme.colors.onPrimary} />
            <Text style={styles.scanButtonText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
      gap: 12,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    headerText: {
      flex: 1,
    },
    debugButton: {
      padding: 8,
      marginLeft: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      marginTop: 4,
      fontSize: 14,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.mode === 'dark' ? 0 : 0.05,
      shadowRadius: 2,
      elevation: theme.mode === 'dark' ? 0 : 1,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    scanningContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    scanningText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    scanningSubtext: {
      marginTop: 8,
      fontSize: 14,
      color: theme.colors.muted,
    },
    progressBar: {
      width: '100%',
      height: 4,
      backgroundColor: theme.colors.overlay,
      borderRadius: 2,
      marginTop: 16,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
    errorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.colors.surface,
    },
    errorText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.danger,
      lineHeight: 20,
    },
    deviceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    deviceIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
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
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    emptyHint: {
      fontSize: 12,
      color: theme.colors.muted,
      marginTop: 12,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    scanButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      marginTop: 8,
    },
    scanButtonText: {
      fontSize: 16,
      color: theme.colors.onPrimary,
      fontWeight: '700',
    },
    debugHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    debugTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
    },
    debugSubtext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    debugList: {
      maxHeight: 300,
    },
    debugDeviceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 10,
      borderRadius: 8,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    debugDeviceInfo: {
      flex: 1,
      marginRight: 8,
    },
    debugDeviceName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    debugDeviceId: {
      fontSize: 11,
      color: theme.colors.muted,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    debugDeviceRssi: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
  })
