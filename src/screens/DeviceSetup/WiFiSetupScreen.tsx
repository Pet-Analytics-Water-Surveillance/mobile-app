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
import { bleService, DeviceCredentials } from '../../services/bluetooth/BLEService'
import { deviceService } from '../../services/DeviceService'
import { supabase } from '../../services/supabase'

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
  
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

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

      // Prepare credentials
      const credentials: DeviceCredentials = {
        wifiSSID: wifiSSID.trim(),
        wifiPassword: wifiPassword.trim(),
        supabaseUrl,
        supabaseKey: supabaseAnonKey,
        userId: user.id,
        householdId: memberData.household_id,
      }

      // Send credentials to device via BLE
      setCurrentStep('Sending WiFi credentials...')
      await bleService.provisionDevice(credentials)

      // Register device in Supabase
      setCurrentStep('Registering device...')
      const displayName = deviceDisplayName.trim() || deviceName
      await deviceService.registerDevice(
        memberData.household_id,
        deviceId,
        displayName
      )

      setCurrentStep('Complete!')

      // Navigate to success screen
      setTimeout(() => {
        navigation.replace('SetupComplete', { 
          deviceId,
          deviceName: displayName 
        })
      }, 500)

    } catch (error: any) {
      console.error('Provisioning error:', error)
      setProvisioning(false)
      
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
          {/* Header */}
          <Text style={styles.title}>Configure Device</Text>
          <Text style={styles.subtitle}>
            Connect your device to WiFi and complete setup
          </Text>

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

          {/* Progress Indicator */}
          {provisioning && (
            <View style={styles.card}>
              <View style={styles.progressContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.progressText}>{currentStep}</Text>
              </View>
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
      paddingBottom: 40,
      gap: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      marginBottom: 8,
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
    progressContainer: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    progressText: {
      marginTop: 16,
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
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
