import { BleManager, Device, State } from 'react-native-ble-plx'
import { Platform, PermissionsAndroid } from 'react-native'
import { encode as base64Encode, decode as base64Decode } from 'base-64'

// BLE UUIDs - Match firmware configuration
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b'
const WIFI_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'
const SUPABASE_CHAR_UUID = '1c95d5e3-d8f7-413a-bf3d-7a2e5d7be87e'
const USER_CHAR_UUID = '9a8ca5ed-2b1f-4b5e-9c3d-5e8f7a9d4c3b'
const STATUS_CHAR_UUID = '7d4c3b2a-1e9f-4a5b-8c7d-6e5f4a3b2c1d'
const DEVICE_NAME_PREFIX = 'PetFountain'

export interface DeviceCredentials {
  wifiSSID: string
  wifiPassword: string
  supabaseUrl: string
  supabaseKey: string
  userId: string
  householdId: string
}

export interface ScannedDevice {
  id: string
  name: string
  rssi: number
}

export type ProvisioningStatus = 
  | 'connected'
  | 'wifi_received' 
  | 'supabase_received'
  | 'user_received'
  | 'provisioning_complete'

export interface ProvisioningCallbacks {
  onStatusUpdate: (status: ProvisioningStatus, message: string) => void
  onError?: (error: Error) => void
}

class BLEService {
  private manager: BleManager
  private connectedDevice: Device | null = null
  private scanSubscription: any = null
  private statusSubscription: any = null

  constructor() {
    this.manager = new BleManager()
  }

  /**
   * Initialize BLE and request necessary permissions
   */
  async initialize(): Promise<boolean> {

    try {
      console.log('🔵 Starting BLE initialization...')
      
      // Request permissions on Android
      if (Platform.OS === 'android') {
        console.log('📱 Requesting Android BLE permissions...')
        const granted = await this.requestAndroidPermissions()
        if (!granted) {
          console.error('❌ BLE permissions not granted')
          return false
        }
        console.log('✓ Android permissions granted')
      }

      // Check if Bluetooth is powered on
      console.log('🔍 Checking Bluetooth state...')
      const state = await this.manager.state()
      console.log('Bluetooth state:', state)
      
      if (state !== State.PoweredOn) {
        console.warn('⚠️ Bluetooth is not powered on:', state)
        return false
      }

      console.log('✅ BLE initialized successfully')
      return true
    } catch (error) {
      console.error('❌ BLE initialization error:', error)
      return false
    }
  }

  /**
   * Request Android BLE permissions
   */
  private async requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true

    if (Platform.Version >= 31) {
      // Android 12+ requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ])

      return (
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      )
    } else {
      // Android 11 and below
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      )
      return granted === PermissionsAndroid.RESULTS.GRANTED
    }
  }

  /**
   * Scan for Pet Fountain devices
   */
  async scanForDevices(
    onDeviceFound: (device: ScannedDevice) => void,
    durationMs: number = 10000,
    onAllDevices?: (device: ScannedDevice) => void
  ): Promise<void> {
    try {
      console.log('🔍 Starting BLE scan...')
      console.log(`⏱️  Scan duration: ${durationMs}ms (${durationMs / 1000}s)`)
      console.log(`🎯 Looking for devices with prefix: "${DEVICE_NAME_PREFIX}"`)
      
      const foundDevices = new Map<string, ScannedDevice>()
      let scanCount = 0

      this.scanSubscription = this.manager.startDeviceScan(
        null, // Scan for all devices
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('❌ Scan error:', error)
            return
          }

          if (device) {
            scanCount++
            
            const scannedDevice: ScannedDevice = {
              id: device.id,
              name: device.name || 'Unknown Device',
              rssi: device.rssi || -100,
            }
            
            // Log all devices for debugging (even non-matching ones)
            if (scanCount <= 10) { // Only log first 10 to avoid spam
              console.log(`📱 Discovered device ${scanCount}: "${device.name || 'No name'}" (ID: ${device.id})`)
            }
            
            // Report all devices for debug mode
            if (onAllDevices) {
              onAllDevices(scannedDevice)
            }
            
            // Check if it's a PetFountain device
            if (device.name?.includes(DEVICE_NAME_PREFIX)) {
              // Only report new matching devices
              if (!foundDevices.has(device.id)) {
                foundDevices.set(device.id, scannedDevice)
                onDeviceFound(scannedDevice)
                console.log('✅ Found matching PetFountain device:', scannedDevice)
              }
            }
          }
        }
      )

      // Auto-stop scan after duration
      setTimeout(() => {
        this.stopScan()
        console.log(`⏹️  Scan stopped after ${durationMs}ms`)
        console.log(`📊 Total devices scanned: ${scanCount}`)
        console.log(`🎯 Matching PetFountain devices found: ${foundDevices.size}`)
        if (foundDevices.size === 0 && scanCount > 0) {
          console.log(`ℹ️  No devices with name containing "${DEVICE_NAME_PREFIX}" were found`)
          console.log(`💡 Make sure your device is powered on and advertising with the correct name`)
        }
      }, durationMs)
    } catch (error) {
      console.error('❌ Error starting scan:', error)
      throw error
    }
  }

  /**
   * Stop scanning for devices
   */
  stopScan(): void {
    if (this.scanSubscription) {
      this.manager.stopDeviceScan()
      this.scanSubscription = null
      console.log('✓ Scan stopped')
    }
  }

  /**
   * Connect to a specific device
   */
  async connect(deviceId: string): Promise<Device> {
    try {
      console.log('🔵 Connecting to device:', deviceId)

      // Disconnect any existing connection
      if (this.connectedDevice) {
        await this.disconnect()
      }

      const device = await this.manager.connectToDevice(deviceId, {
        timeout: 10000,
      })

      console.log('✓ GATT connection established')

      // Discover services and characteristics
      console.log('🔍 Discovering services...')
      await device.discoverAllServicesAndCharacteristics()
      console.log('✓ Services and characteristics discovered')

      this.connectedDevice = device

      // Verify we can communicate with the device by reading status
      try {
        console.log('📡 Verifying connection by reading status characteristic...')
        const statusChar = await device.readCharacteristicForService(
          SERVICE_UUID,
          STATUS_CHAR_UUID
        )
        
        if (statusChar?.value) {
          const status = base64Decode(statusChar.value)
          console.log('✅ Device status:', status)
        }
      } catch (readError) {
        console.warn('⚠️  Could not read status (this is OK if device just started):', readError)
        // Don't fail connection if we can't read status - device might not be ready yet
      }

      // Wait a bit for firmware to process connection
      console.log('⏳ Waiting for firmware to process connection...')
      await this.delay(1000)

      console.log('✅ Connection fully established!')
      return device
    } catch (error) {
      console.error('❌ Connection error:', error)
      this.connectedDevice = null
      throw new Error('Failed to connect to device. Make sure it is in pairing mode.')
    }
  }

  /**
   * Disconnect from the current device
   */
  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        // Cleanup status subscription
        this.unsubscribeFromStatus()
        
        await this.manager.cancelDeviceConnection(this.connectedDevice.id)
        console.log('✓ Disconnected from device')
      } catch (error) {
        console.error('Disconnect error:', error)
      }
      this.connectedDevice = null
    }
  }

  /**
   * Subscribe to status notifications from device
   */
  async subscribeToStatus(
    onStatusUpdate: (status: string) => void
  ): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('No device connected')
    }

    try {
      console.log('📡 Subscribing to status notifications...')
      
      // Unsubscribe from any existing subscription
      if (this.statusSubscription) {
        this.statusSubscription.remove()
        this.statusSubscription = null
      }

      // Subscribe to status characteristic notifications
      this.statusSubscription = this.connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        STATUS_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('❌ Status monitoring error:', error)
            return
          }

          if (characteristic?.value) {
            try {
              // Decode base64 value to string
              const statusValue = base64Decode(characteristic.value)
              console.log('📱 Status update received:', statusValue)
              onStatusUpdate(statusValue)
            } catch (decodeError) {
              console.error('❌ Error decoding status:', decodeError)
            }
          }
        }
      )

      console.log('✅ Status notifications enabled')
    } catch (error) {
      console.error('❌ Error subscribing to status:', error)
      throw error
    }
  }

  /**
   * Unsubscribe from status notifications
   */
  unsubscribeFromStatus(): void {
    if (this.statusSubscription) {
      this.statusSubscription.remove()
      this.statusSubscription = null
      console.log('✓ Unsubscribed from status notifications')
    }
  }

  /**
   * Provision device with credentials - Step-by-step flow with status monitoring
   */
  async provisionDevice(
    credentials: DeviceCredentials,
    callbacks: ProvisioningCallbacks
  ): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('No device connected')
    }

    try {
      console.log('🔧 Starting provisioning flow...')

      // Subscribe to status notifications
      await this.subscribeToStatus((status) => {
        console.log(`📊 Provisioning status: ${status}`)
        
        switch (status) {
          case 'connected':
            callbacks.onStatusUpdate('connected', 'Connected to device')
            break
          case 'wifi_received':
            callbacks.onStatusUpdate('wifi_received', 'WiFi credentials received')
            break
          case 'supabase_received':
            callbacks.onStatusUpdate('supabase_received', 'Supabase config received')
            break
          case 'user_received':
            callbacks.onStatusUpdate('user_received', 'Saving configuration...')
            break
          case 'provisioning_complete':
            callbacks.onStatusUpdate('provisioning_complete', 'Setup complete! Device restarting...')
            break
        }
      })

      // Wait a moment for subscription to be ready
      await this.delay(500)

      // Step 1: Send WiFi credentials
      console.log('📡 Step 1: Sending WiFi credentials...')
      await this.writeCharacteristic(WIFI_CHAR_UUID, {
        ssid: credentials.wifiSSID,
        password: credentials.wifiPassword,
      })
      console.log('✅ WiFi credentials sent')
      
      // Wait for firmware to process (status will be notified)
      await this.delay(1000)

      // Step 2: Send Supabase credentials
      console.log('📡 Step 2: Sending Supabase configuration...')
      await this.writeCharacteristic(SUPABASE_CHAR_UUID, {
        url: credentials.supabaseUrl,
        anon_key: credentials.supabaseKey,
      })
      console.log('✅ Supabase config sent')
      
      // Wait for firmware to process
      await this.delay(1000)

      // Step 3: Send User ID (triggers save and restart)
      console.log('📡 Step 3: Sending user ID...')
      await this.writeCharacteristic(USER_CHAR_UUID, {
        user_id: credentials.userId,
      })
      console.log('✅ User ID sent - Device will save and restart')

      // Wait for provisioning_complete status (firmware sends it before restart)
      // We'll give it 5 seconds max
      await this.delay(5000)

      // Cleanup
      this.unsubscribeFromStatus()
      
      console.log('✅ Provisioning flow complete')
    } catch (error) {
      console.error('❌ Provisioning error:', error)
      this.unsubscribeFromStatus()
      
      if (callbacks.onError) {
        callbacks.onError(error as Error)
      }
      
      throw new Error('Failed to provision device. Please try again.')
    }
  }

  /**
   * Write data to a characteristic
   */
  private async writeCharacteristic(characteristicUUID: string, data: any): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('No device connected')
    }

    try {
      const jsonString = JSON.stringify(data)
      const base64Data = base64Encode(jsonString)

      await this.connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        characteristicUUID,
        base64Data
      )
    } catch (error) {
      console.error(`Error writing to characteristic ${characteristicUUID}:`, error)
      throw error
    }
  }

  /**
   * Get the currently connected device
   */
  getConnectedDevice(): Device | null {
    return this.connectedDevice
  }

  /**
   * Check if BLE is available and powered on
   */
  async isBluetoothEnabled(): Promise<boolean> {
    try {
      const state = await this.manager.state()
      return state === State.PoweredOn
    } catch (error) {
      console.error('Error checking Bluetooth state:', error)
      return false
    }
  }

  /**
   * Destroy the BLE manager
   */
  destroy(): void {
    this.stopScan()
    this.unsubscribeFromStatus()
    if (this.connectedDevice) {
      this.disconnect()
    }
    this.manager.destroy()
  }

  /**
   * Helper function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const bleService = new BLEService()

