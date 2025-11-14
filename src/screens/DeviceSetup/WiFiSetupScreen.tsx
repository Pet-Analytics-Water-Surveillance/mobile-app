import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'
import { bleService, DeviceCredentials, ProvisioningStatus } from '../../services/bluetooth/BLEService'
import { deviceService } from '../../services/DeviceService'
import { supabase } from '../../services/supabase'

type ProvisioningStep = {
  id: number
  status: ProvisioningStatus
  label: string
  icon: string
  completed: boolean
  active: boolean
}

export default function WiFiSetupScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { deviceId, deviceName } = route.params || {}
  
  const [wifiSSID, setWifiSSID] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [deviceDisplayName, setDeviceDisplayName] = useState('')
  const [provisioning, setProvisioning] = useState(false)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [provisioningSteps, setProvisioningSteps] = useState<ProvisioningStep[]>([
    { id: 1, status: 'connected', label: 'Connected to device', icon: 'bluetooth', completed: false, active: false },
    { id: 2, status: 'wifi_received', label: 'Sending WiFi credentials', icon: 'wifi', completed: false, active: false },
    { id: 3, status: 'supabase_received', label: 'Configuring cloud sync', icon: 'cloud', completed: false, active: false },
    { id: 4, status: 'user_received', label: 'Saving configuration', icon: 'save', completed: false, active: false },
    { id: 5, status: 'provisioning_complete', label: 'Setup complete!', icon: 'checkmark-circle', completed: false, active: false },
  ])
  
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

  const updateStepStatus = (status: ProvisioningStatus, message: string) => {
    console.log(`📊 Step update: ${status} - ${message}`)
    setCurrentStep(message)
    
    setProvisioningSteps(prev => prev.map(step => {
      if (step.status === status) {
        return { ...step, completed: true, active: false }
      }
      // Find next step to activate
      const currentIndex = prev.findIndex(s => s.status === status)
      const nextIndex = currentIndex + 1
      if (step.id === nextIndex + 1) {
        return { ...step, active: true }
      }
      return step
    }))
  }

  const handleProvision = async () => {
    // Validate inputs
    if (!wifiSSID.trim()) {
      Alert.alert('Required', 'Please enter WiFi network name')
      return
    }

    if (!wifiPassword.trim()) {
      Alert.alert('Required', 'Please enter WiFi password')
      return
    }

    setProvisioning(true)
    
    // Activate first step
    setProvisioningSteps(prev => prev.map(step => 
      step.id === 1 ? { ...step, active: true } : step
    ))

    try {
      // Get current user and household
      setCurrentStep('Getting user information...')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data: memberData } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single()

      if (!memberData) {
        throw new Error('No household found')
      }

      // Get Supabase credentials from environment
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not configured')
      }

      // Create device in Supabase BEFORE provisioning to get device UUID
      setCurrentStep('Creating device record...')
      const displayName = deviceDisplayName.trim() || deviceName || `Pet Fountain ${deviceId.slice(-6)}`
      
      console.log('📡 Creating device in Supabase...')
      let deviceUuid: string
      
      // Check if device already exists
      const existingDevice = await deviceService.isDeviceRegistered(deviceId)
      if (existingDevice) {
        console.log('ℹ️  Device already registered, fetching existing record')
        const { data: existingDeviceData } = await supabase
          .from('devices')
          .select('id')
          .eq('device_hardware_id', deviceId)
          .single()
        
        if (!existingDeviceData) {
          throw new Error('Failed to fetch existing device')
        }
        deviceUuid = existingDeviceData.id
        console.log('✓ Using existing device UUID:', deviceUuid)
      } else {
        console.log('📡 Registering new device:', {
          householdId: memberData.household_id,
          deviceId,
          displayName
        })
        
        const newDevice = await deviceService.registerDevice(
          memberData.household_id,
          deviceId,
          displayName
        )
        deviceUuid = newDevice.id
        console.log('✓ Created new device with UUID:', deviceUuid)
      }

      // Prepare credentials with device UUID
      const credentials: DeviceCredentials = {
        wifiSSID: wifiSSID.trim(),
        wifiPassword: wifiPassword.trim(),
        supabaseUrl,
        supabaseKey: supabaseAnonKey,
        userId: user.id,
        householdId: memberData.household_id,
        deviceId: deviceUuid,
      }

      // Send credentials to device via BLE with status callbacks
      setCurrentStep('Starting provisioning...')
      let provisioningFinished = false
      
      // Set a timeout fallback in case provisioning_complete never arrives
      const timeoutId = setTimeout(async () => {
        if (!provisioningFinished) {
          console.warn('⚠️  Provisioning timeout - proceeding anyway')
          provisioningFinished = true
          try {
            console.log('⚠️  Timeout reached - device already registered, navigating...')
            
            try {
              await bleService.disconnect()
            } catch (e) {
              console.warn('BLE disconnect error (non-critical):', e)
            }
            
            try {
              navigation.replace('SetupComplete', { 
                deviceId,
                deviceName: displayName 
              })
            } catch (navError) {
              console.error('Navigation error in timeout fallback:', navError)
              try {
                navigation.navigate('DeviceList')
              } catch (fallbackError) {
                Alert.alert('Success', 'Device may have been provisioned. Please check device list.', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ])
              }
            }
          } catch (err: any) {
            console.error('Timeout fallback error:', err)
            console.error('   Error details:', JSON.stringify(err, null, 2))
            
            try {
              await bleService.disconnect()
            } catch (e) {
              console.warn('Failed to disconnect on timeout error:', e)
            }
            
            Alert.alert('Warning', 'Device may have been provisioned. Please check device list.', [
              { 
                text: 'OK', 
                onPress: () => {
                  try {
                    navigation.goBack()
                  } catch (navError) {
                    console.error('Navigation error:', navError)
                  }
                }
              }
            ])
          }
        }
      }, 15000) // 15 second timeout
      
      await bleService.provisionDevice(credentials, {
        onStatusUpdate: (status, message) => {
          try {
            updateStepStatus(status, message)
            
            // Handle provisioning complete
            if (status === 'provisioning_complete') {
              console.log('🎉 Provisioning complete received!')
              clearTimeout(timeoutId)
              
              // Prevent multiple executions
              if (provisioningFinished) {
                console.log('⚠️  Provisioning complete already handled, skipping...')
                return
              }
              provisioningFinished = true
              
              // NOTE: Don't manually unsubscribe here - causes crash in BLE library
              // The device is restarting and will disconnect, which triggers an error
              // in the BLE library when we try to unsubscribe at the same time.
              // Let the subscription handle disconnection naturally.
              console.log('ℹ️  Device restarting - letting BLE handle disconnection naturally')
              
              // Device already registered before provisioning, just navigate to success
              setTimeout(() => {
                try {
                  console.log('✅ Provisioning complete!')
                  setCurrentStep('Complete!')
                  
                  // Navigate to success screen
                  setTimeout(() => {
                    try {
                      console.log('🧭 Navigating to SetupComplete screen...')
                      navigation.replace('SetupComplete', { 
                        deviceId,
                        deviceName: displayName 
                      })
                      console.log('✅ Navigation complete')
                    } catch (navError: any) {
                      console.error('❌ Navigation error:', navError)
                      // Fallback navigation
                      try {
                        navigation.navigate('DeviceList')
                      } catch (fallbackError) {
                        console.error('❌ Fallback navigation also failed:', fallbackError)
                        Alert.alert('Success', 'Device provisioned successfully!', [
                          { text: 'OK', onPress: () => navigation.goBack() }
                        ])
                      }
                    }
                  }, 500)
                } catch (error: any) {
                  console.error('❌ Navigation error:', error)
                  Alert.alert('Success', 'Device provisioned successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                  ])
                }
              }, 500)
            }
          } catch (statusError) {
            // Catch any errors in status callback to prevent crashes
            console.error('❌ Error in onStatusUpdate callback:', statusError)
            // Don't throw - continue with provisioning
          }
        },
        onError: (error) => {
          try {
            clearTimeout(timeoutId)
            console.error('❌ Provisioning callback error:', error)
          } catch (errorHandlerError) {
            console.error('❌ Error in error handler:', errorHandlerError)
          }
        }
      })
      
      clearTimeout(timeoutId) // Clear timeout if provisionDevice completes normally

    } catch (error: any) {
      console.error('❌ Provisioning error:', error)
      setProvisioning(false)
      
      // Reset steps
      setProvisioningSteps(prev => prev.map(step => ({ 
        ...step, 
        completed: false, 
        active: false 
      })))
      
      Alert.alert(
        'Provisioning Failed',
        error.message || 'Failed to configure device. Please try again.',
        [
          { text: 'Cancel', onPress: () => navigation.goBack() },
          { text: 'Retry', onPress: handleProvision },
        ]
      )
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Device Info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Device</Text>
            <View style={styles.deviceInfoRow}>
              <View style={styles.deviceIconLarge}>
                <Ionicons name="wifi" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.deviceNameText}>{deviceName || 'Pet Fountain'}</Text>
            </View>
          </View>

          {/* WiFi Credentials */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>WiFi Network</Text>
            
            <Text style={styles.label}>Network Name (SSID) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter WiFi network name"
              placeholderTextColor={theme.colors.muted}
              value={wifiSSID}
              onChangeText={setWifiSSID}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!provisioning}
            />

            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter WiFi password"
                placeholderTextColor={theme.colors.muted}
                value={wifiPassword}
                onChangeText={setWifiPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!provisioning}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.colors.muted}
                />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.helper}>
              ⚠️ Device only supports 2.4GHz WiFi networks
            </Text>
          </View>

          {/* Device Name (Optional) */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Custom Name (Optional)</Text>
            
            <Text style={styles.label}>Device Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Living Room Fountain"
              placeholderTextColor={theme.colors.muted}
              value={deviceDisplayName}
              onChangeText={setDeviceDisplayName}
              editable={!provisioning}
            />
          </View>

          {/* Provisioning Steps */}
          {provisioning && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Provisioning Progress</Text>
              {provisioningSteps.map((step, index) => (
                <View key={step.id} style={styles.stepContainer}>
                  <View style={styles.stepRow}>
                    <View style={[
                      styles.stepIcon,
                      step.completed && styles.stepIconCompleted,
                      step.active && styles.stepIconActive
                    ]}>
                      {step.completed ? (
                        <Ionicons name="checkmark" size={20} color={theme.colors.success} />
                      ) : step.active ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                      ) : (
                        <Ionicons name={step.icon as any} size={20} color={theme.colors.muted} />
                      )}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[
                        styles.stepLabel,
                        step.completed && styles.stepLabelCompleted,
                        step.active && styles.stepLabelActive
                      ]}>
                        {step.label}
                      </Text>
                      {step.active && (
                        <Text style={styles.stepStatus}>{currentStep}</Text>
                      )}
                    </View>
                  </View>
                  {index < provisioningSteps.length - 1 && (
                    <View style={[
                      styles.stepConnector,
                      step.completed && styles.stepConnectorCompleted
                    ]} />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Setup Button */}
          <TouchableOpacity
            style={[styles.setupButton, provisioning && styles.setupButtonDisabled]}
            onPress={handleProvision}
            disabled={provisioning}
            activeOpacity={0.8}
          >
            {provisioning ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.onPrimary} />
                <Text style={styles.setupButtonText}>Complete Setup</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingTop: 8,
      paddingBottom: 40,
      gap: 12,
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
    deviceInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    deviceIconLarge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deviceNameText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    label: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 8,
      marginBottom: 6,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: theme.colors.text,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: theme.colors.text,
    },
    eyeButton: {
      padding: 10,
    },
    helper: {
      color: theme.colors.warning,
      fontSize: 12,
      marginTop: 6,
    },
    stepContainer: {
      marginBottom: 8,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    stepIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    stepIconActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.overlay,
    },
    stepIconCompleted: {
      borderColor: theme.colors.success,
      backgroundColor: theme.colors.overlay,
    },
    stepContent: {
      flex: 1,
      paddingTop: 8,
    },
    stepLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.muted,
      marginBottom: 2,
    },
    stepLabelActive: {
      color: theme.colors.primary,
    },
    stepLabelCompleted: {
      color: theme.colors.success,
    },
    stepStatus: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    stepConnector: {
      width: 2,
      height: 16,
      backgroundColor: theme.colors.border,
      marginLeft: 19,
      marginVertical: 2,
    },
    stepConnectorCompleted: {
      backgroundColor: theme.colors.success,
    },
    setupButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 8,
      gap: 8,
    },
    setupButtonDisabled: {
      opacity: 0.6,
    },
    setupButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
  })
