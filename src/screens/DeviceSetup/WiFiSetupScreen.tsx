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
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="wifi" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Configure Device</Text>
            <Text style={styles.subtitle}>
              Connect your device to WiFi and complete setup
            </Text>
          </View>

          {/* Device Info */}
          <View style={styles.section}>
            <Text style={styles.label}>Device</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{deviceName || 'Pet Fountain'}</Text>
            </View>
          </View>

          {/* WiFi Network */}
          <View style={styles.section}>
            <Text style={styles.label}>WiFi Network *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="wifi-outline" size={20} color={theme.colors.muted} />
              <TextInput
                style={styles.input}
                placeholder="Enter WiFi network name (SSID)"
                placeholderTextColor={theme.colors.muted}
                value={wifiSSID}
                onChangeText={setWifiSSID}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!provisioning}
              />
            </View>
            <Text style={styles.hint}>
              ⚠️ Device only supports 2.4GHz WiFi networks
            </Text>
          </View>

          {/* WiFi Password */}
          <View style={styles.section}>
            <Text style={styles.label}>WiFi Password *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.muted} />
              <TextInput
                style={styles.input}
                placeholder="Enter WiFi password"
                placeholderTextColor={theme.colors.muted}
                value={wifiPassword}
                onChangeText={setWifiPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!provisioning}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Device Name (Optional) */}
          <View style={styles.section}>
            <Text style={styles.label}>Device Name (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="create-outline" size={20} color={theme.colors.muted} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Living Room Fountain"
                placeholderTextColor={theme.colors.muted}
                value={deviceDisplayName}
                onChangeText={setDeviceDisplayName}
                editable={!provisioning}
              />
            </View>
          </View>

          {/* Progress Indicator */}
          {provisioning && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.progressText}>{currentStep}</Text>
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
                <Text style={styles.setupButtonText}>Complete Setup</Text>
                <Ionicons name="arrow-forward" size={20} color={theme.colors.onPrimary} />
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
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 30,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
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
      textAlign: 'center',
    },
    section: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 10,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    hint: {
      fontSize: 12,
      color: theme.colors.warning,
      marginTop: 6,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 15,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoText: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    progressContainer: {
      alignItems: 'center',
      marginVertical: 20,
      padding: 20,
      backgroundColor: theme.colors.overlay,
      borderRadius: 12,
    },
    progressText: {
      marginTop: 15,
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    setupButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 10,
      gap: 10,
    },
    setupButtonDisabled: {
      opacity: 0.6,
    },
    setupButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
  })
