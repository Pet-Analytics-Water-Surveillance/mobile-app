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
  private provisioningComplete: boolean = false

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
    durationMs: number = 10000
  ): Promise<void> {
    try {
      console.log('🔍 Starting BLE scan...')
      console.log(`⏱️  Scan duration: ${durationMs}ms (${durationMs / 1000}s)`)
      console.log(`🎯 Looking for devices with prefix: "${DEVICE_NAME_PREFIX}"`)
      console.log(`📡 Filtering by service UUID: ${SERVICE_UUID}`)
      
      const foundDevices = new Map<string, ScannedDevice>()
      let scanCount = 0

      this.scanSubscription = this.manager.startDeviceScan(
        null, // Scan for all devices - filtering by name works better cross-platform
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('❌ Scan error:', error)
            return
          }

          if (device) {
            // Check if it's a PetFountain device
            if (device.name?.includes(DEVICE_NAME_PREFIX)) {
              const scannedDevice: ScannedDevice = {
                id: device.id,
                name: device.name || 'Unknown Device',
                rssi: device.rssi || -100,
              }
              
              // Only report new matching devices
              if (!foundDevices.has(device.id)) {
                foundDevices.set(device.id, scannedDevice)
                onDeviceFound(scannedDevice)
                console.log('✅ Found PetFountain device:', scannedDevice.name)
              }
            }
          }
        }
      )

      // Auto-stop scan after duration
      setTimeout(() => {
        this.stopScan()
        console.log(`⏹️  Scan completed - found ${foundDevices.size} device(s)`)
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

      // CRITICAL: Cancel any pending connections to this device first
      console.log('🧹 Clearing any existing connections...')
      try {
        await this.manager.cancelDeviceConnection(deviceId)
        console.log('✓ Previous connections cleared')
      } catch (e) {
        // Ignore errors - device might not have been connected
        console.log('ℹ️  No previous connection to clear')
      }

      // Wait a bit for cleanup
      await this.delay(500)

      console.log('📡 Establishing fresh connection...')
      const device = await this.manager.connectToDevice(deviceId, {
        timeout: 10000,
        autoConnect: false,  // Don't use cached connection
      })

      console.log('✓ GATT connection established')

      // Discover services and characteristics - CRITICAL: rediscover to avoid cached services
      console.log('🔍 Discovering services and characteristics...')
      await device.discoverAllServicesAndCharacteristics()
      console.log('✓ Services and characteristics discovered')
      
      // Force a fresh read to verify we're talking to the current firmware
      try {
        const statusCheck = await device.readCharacteristicForService(
          SERVICE_UUID,
          STATUS_CHAR_UUID
        )
        if (statusCheck?.value) {
          const status = base64Decode(statusCheck.value)
          console.log('✓ Verified connection to current firmware - status:', status.substring(0, 20))
        }
      } catch (e) {
        console.warn('⚠️  Could not verify firmware status:', e)
      }

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
          console.log('✅ Initial device status:', status)
        }
      } catch (readError) {
        console.warn('⚠️  Could not read status (this is OK if device just started):', readError)
        // Don't fail connection if we can't read status - device might not be ready yet
      }

      // Wait for firmware to process connection and onConnect callback to fire
      console.log('⏳ Waiting for firmware onConnect callback...')
      await this.delay(1500)

      // Read status again to see if it changed to "firmware_connected"
      try {
        console.log('🔍 Re-reading status to check if firmware saw connection...')
        const statusChar = await device.readCharacteristicForService(
          SERVICE_UUID,
          STATUS_CHAR_UUID
        )
        
        if (statusChar?.value) {
          const status = base64Decode(statusChar.value)
          console.log('📊 Status after delay:', status)
          
          if (status === 'firmware_connected') {
            console.log('✅ Firmware onConnect callback fired!')
          } else if (status === 'waiting') {
            console.warn('⚠️  Firmware still says "waiting" - onConnect callback may not have fired!')
          }
        }
      } catch (readError2) {
        console.warn('⚠️  Could not re-read status:', readError2)
      }

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
      const deviceId = this.connectedDevice.id
      
      try {
        // Try to disconnect gracefully, but don't fail if already disconnected
        try {
          await this.manager.cancelDeviceConnection(deviceId)
          console.log('✓ Disconnected from device')
        } catch (disconnectError: any) {
          // Ignore all disconnection errors - device might be restarting
          if (disconnectError?.errorCode === 8 || 
              disconnectError?.errorCode === 19 ||
              disconnectError?.message?.toLowerCase().includes('disconnect') ||
              disconnectError?.message?.toLowerCase().includes('not connected') ||
              disconnectError?.message?.toLowerCase().includes('connection')) {
            console.log('ℹ️  Device already disconnected (expected during restart)')
          } else {
            // Still log as info, not warning - disconnection is expected
            console.log('ℹ️  Disconnect completed (device may have restarted):', disconnectError?.message || 'Unknown')
          }
        }
        
        // Cleanup status subscription AFTER disconnect attempt
        // Don't call unsubscribeFromStatus() - just clear the reference
        // Calling remove() on subscription causes crashes
        await this.delay(100) // Small delay to let BLE cleanup
        if (this.statusSubscription) {
          this.statusSubscription = null
          console.log('ℹ️  Cleared status subscription reference')
        }
        
      } catch (error: any) {
        // Silently ignore all errors during disconnect - device is restarting
        console.log('ℹ️  Disconnect cleanup completed (errors ignored during restart)')
      } finally {
        this.connectedDevice = null
      }
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
      console.log(`   Service UUID: ${SERVICE_UUID}`)
      console.log(`   Status Char UUID: ${STATUS_CHAR_UUID}`)
      
      // Unsubscribe from any existing subscription
      if (this.statusSubscription) {
        console.log('🔄 Removing existing subscription...')
        this.statusSubscription.remove()
        this.statusSubscription = null
      }

      // Verify the characteristic exists
      try {
        console.log('🔍 Verifying status characteristic exists...')
        const characteristic = await this.connectedDevice.readCharacteristicForService(
          SERVICE_UUID,
          STATUS_CHAR_UUID
        )
        console.log('✅ Status characteristic verified:', characteristic?.value ? 'has value' : 'no value')
      } catch (readError) {
        console.error('⚠️  Could not read status characteristic (will try to monitor anyway):', readError)
      }

      // Subscribe to status characteristic notifications
      // Wrap the entire callback in try-catch to prevent ANY errors from crashing
      console.log('📻 Starting monitoring...')
      this.statusSubscription = this.connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        STATUS_CHAR_UUID,
        (error, characteristic) => {
          // CRITICAL: Wrap everything in try-catch to prevent crashes from BLE library errors
          try {
            if (error) {
              // Handle disconnection gracefully - device might be restarting
              // Error code 8 = Device disconnected, 19 = Connection timeout/GATT_CONN_TERMINATE_PEER_USER
              if (error.errorCode === 8 || 
                  error.errorCode === 19 ||
                  error.message?.toLowerCase().includes('disconnect') || 
                  error.message?.toLowerCase().includes('connection') ||
                  error.message?.toLowerCase().includes('lost') ||
                  error.message?.toLowerCase().includes('timeout')) {
                console.log('ℹ️  Device disconnected (expected during restart):', error.message || `Error code ${error.errorCode}`)
                // Silently return - don't log as error, don't throw
                return
              }
              // Only log non-disconnection errors as warnings, not errors
              console.warn('⚠️  Status monitoring error (non-critical):', error.errorCode, error.message)
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
          } catch (callbackError) {
            // Catch ANY error in the callback to prevent crashes
            console.log('ℹ️  Status callback error (ignored):', callbackError)
          }
        }
      )

      console.log('✅ Status notifications monitoring started')
    } catch (error: any) {
      console.error('❌ Error subscribing to status:', error)
      console.error('   Error details:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to subscribe to device status: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Unsubscribe from status notifications
   */
  unsubscribeFromStatus(): void {
    if (this.statusSubscription) {
      // CRITICAL: Don't call subscription.remove() when device is disconnecting/restarting
      // The BLE library crashes asynchronously on another thread when trying to report
      // disconnection errors after we've removed the subscription
      // Just set to null and let garbage collection handle it
      console.log('ℹ️  Clearing status subscription (not calling remove to avoid crash)')
      this.statusSubscription = null
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
      console.log('📱 Connected device:', this.connectedDevice.id)
      
      // Verify device is still connected
      try {
        const isConnected = await this.connectedDevice.isConnected()
        console.log('🔍 Device connection status:', isConnected)
        
        if (!isConnected) {
          throw new Error('Device disconnected. Please reconnect and try again.')
        }
      } catch (error) {
        console.error('❌ Failed to verify connection:', error)
        throw new Error('Device connection lost. Please reconnect and try again.')
      }

      // Request MTU increase to handle large payloads
      try {
        console.log('📡 Requesting MTU negotiation...')
        await this.connectedDevice.requestMTU(512)
        console.log('✅ MTU negotiation requested')
        await this.delay(500) // Wait for MTU negotiation to complete
      } catch (mtuError) {
        console.warn('⚠️  MTU negotiation failed (device may not support it):', mtuError)
        // Continue anyway - some devices don't support MTU negotiation
      }

      // Reset provisioning complete flag
      this.provisioningComplete = false

      // Subscribe to status notifications
      console.log('📡 Subscribing to status notifications...')
      await this.subscribeToStatus((status) => {
        console.log(`📊 Provisioning status: ${status}`)
        
        try {
          switch (status) {
            case 'connected':
            case 'firmware_connected':
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
              this.provisioningComplete = true
              callbacks.onStatusUpdate('provisioning_complete', 'Setup complete! Device restarting...')
              break
          }
        } catch (callbackError) {
          console.error('❌ Error in status callback:', callbackError)
          // Don't throw - we don't want to break the provisioning flow
        }
      })

      // Wait for subscription and firmware to be ready
      console.log('⏳ Waiting for subscription and firmware to stabilize...')
      await this.delay(2000) // Increased from 500ms to 2s to prevent GATT_INSUF_RESOURCE

      // Step 1: Send WiFi credentials
      console.log('\n📡 Step 1: Sending WiFi credentials...')
      console.log(`   SSID: ${credentials.wifiSSID}`)
      console.log(`   Password length: ${credentials.wifiPassword.length} chars`)
      try {
        await this.writeCharacteristic(WIFI_CHAR_UUID, {
          ssid: credentials.wifiSSID,
          password: credentials.wifiPassword,
        })
        console.log('✅ WiFi credentials sent successfully')
      } catch (wifiError: any) {
        // If provisioning already complete, ignore errors
        if (this.provisioningComplete) {
          console.log('ℹ️  WiFi write error ignored - provisioning already complete')
          return
        }
        console.error('❌ Failed to send WiFi credentials:', wifiError)
        throw new Error(`Failed to send WiFi credentials: ${wifiError}`)
      }
      
      // Wait for firmware to process (status will be notified)
      // Check if provisioning complete during wait
      console.log('⏳ Waiting for firmware to process WiFi credentials...')
      for (let i = 0; i < 15 && !this.provisioningComplete; i++) {
        await this.delay(100)
      }

      // Step 2: Send Supabase credentials
      if (this.provisioningComplete) {
        console.log('ℹ️  Skipping Supabase step - provisioning already complete')
        return
      }
      
      console.log('\n📡 Step 2: Sending Supabase configuration...')
      console.log(`   URL: ${credentials.supabaseUrl}`)
      console.log(`   Key length: ${credentials.supabaseKey.length} chars`)
      try {
        await this.writeCharacteristic(SUPABASE_CHAR_UUID, {
          url: credentials.supabaseUrl,
          anon_key: credentials.supabaseKey,
        })
        console.log('✅ Supabase config sent successfully')
      } catch (supabaseError: any) {
        if (this.provisioningComplete) {
          console.log('ℹ️  Supabase write error ignored - provisioning already complete')
          return
        }
        console.error('❌ Failed to send Supabase config:', supabaseError)
        throw new Error(`Failed to send Supabase config: ${supabaseError}`)
      }
      
      // Wait for firmware to process
      console.log('⏳ Waiting for firmware to process Supabase config...')
      for (let i = 0; i < 15 && !this.provisioningComplete; i++) {
        await this.delay(100)
      }

      // Step 3: Send User ID (triggers save and restart)
      if (this.provisioningComplete) {
        console.log('ℹ️  Skipping User ID step - provisioning already complete')
        return
      }
      
      console.log('\n📡 Step 3: Sending user ID and household ID...')
      console.log(`   User ID: ${credentials.userId}`)
      console.log(`   Household ID: ${credentials.householdId}`)
      try {
        await this.writeCharacteristic(USER_CHAR_UUID, {
          user_id: credentials.userId,
          household_id: credentials.householdId,
        })
        console.log('✅ User ID and Household ID sent successfully - Device will save and restart')
      } catch (userError: any) {
        if (this.provisioningComplete) {
          console.log('ℹ️  User ID write error ignored - provisioning already complete')
          return
        }
        console.error('❌ Failed to send user ID:', userError)
        throw new Error(`Failed to send user ID: ${userError}`)
      }

      // Wait for provisioning_complete status (firmware sends it before restart)
      // Poll for completion status - exit early if provisioning is complete
      console.log('⏳ Waiting for device to process and send final status...')
      
      // Wait up to 10 seconds, but exit early if provisioning_complete was received
      const maxWaitMs = 10000
      const pollIntervalMs = 200
      const maxPolls = maxWaitMs / pollIntervalMs
      
      for (let i = 0; i < maxPolls; i++) {
        if (this.provisioningComplete) {
          console.log('✅ Provisioning complete received - exiting early')
          break
        }
        await this.delay(pollIntervalMs)
      }
      
      if (!this.provisioningComplete) {
        console.log('⚠️  Note: provisioning_complete status was not received, but device may still be processing.')
      }

      // Cleanup subscription - just clear reference, don't call remove()
      // Calling remove() causes crashes when device is disconnecting
      console.log('🧹 Clearing BLE subscription reference...')
      this.statusSubscription = null
      
      // If provisioning is complete, we're done - device is restarting
      if (this.provisioningComplete) {
        console.log('✅ Provisioning flow complete - device restarting')
        return // Exit early - don't try to do anything else
      }
      
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
      console.log(`\n📝 Writing to characteristic: ${characteristicUUID}`)
      
      // Convert data to JSON string
      const jsonString = JSON.stringify(data)
      console.log(`   JSON length: ${jsonString.length} bytes`)
      console.log(`   JSON preview: ${jsonString.substring(0, 100)}...`)
      
      // Encode to base64
      const base64Data = base64Encode(jsonString)
      console.log(`   Base64 length: ${base64Data.length} bytes`)
      
      // Verify device is still connected (but don't fail if provisioning is complete)
      try {
        const isConnected = await this.connectedDevice.isConnected()
        if (!isConnected && !this.provisioningComplete) {
          throw new Error('Device disconnected before write operation')
        }
      } catch (checkError: any) {
        // If provisioning is complete, device might be restarting - that's OK
        if (this.provisioningComplete) {
          console.log('ℹ️  Device connection check failed but provisioning complete - ignoring')
          return
        }
        throw checkError
      }
      
      console.log(`   Writing to service: ${SERVICE_UUID}`)
      console.log(`   Writing to characteristic: ${characteristicUUID}`)
      
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        characteristicUUID,
        base64Data
      )
      
      console.log(`   ✅ Write successful`)
    } catch (error: any) {
      // If provisioning is complete, device is restarting - don't throw error
      if (this.provisioningComplete) {
        console.log(`ℹ️  Write error ignored - provisioning already complete: ${error.message}`)
        return
      }
      
      // Check if it's a disconnection error
      if (error?.errorCode === 8 || 
          error?.message?.toLowerCase().includes('disconnect') ||
          error?.message?.toLowerCase().includes('connection')) {
        console.log(`ℹ️  Device disconnected during write (expected if restarting): ${error.message}`)
        // Don't throw if provisioning is complete
        if (this.provisioningComplete) {
          return
        }
      }
      
      console.error(`\n❌ Error writing to characteristic ${characteristicUUID}:`)
      console.error(`   Error type: ${error.constructor?.name || 'Unknown'}`)
      console.error(`   Error message: ${error.message || 'No message'}`)
      console.error(`   Error code: ${error.errorCode || 'N/A'}`)
      throw new Error(`Write failed: ${error.message || 'Unknown error'}`)
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

