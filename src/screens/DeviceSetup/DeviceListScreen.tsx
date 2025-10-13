import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { AppTheme, useAppTheme, useThemedStyles, useRefreshControlColors } from '../../theme'
import { deviceService, DeviceWithStatus } from '../../services/DeviceService'
import { supabase } from '../../services/supabase'

export default function DeviceListScreen() {
  const navigation = useNavigation<any>()
  const [devices, setDevices] = useState<DeviceWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [householdId, setHouseholdId] = useState<string>('')
  
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)
  const refreshControlColors = useRefreshControlColors()

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    try {
      setLoading(true)

      // Get current user's household
      const { data: { user } } = await supabase.auth.getUser()
      const { data: memberData } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user?.id)
        .single()

      if (!memberData) {
        console.error('No household found')
        setLoading(false)
        return
      }

      setHouseholdId(memberData.household_id)

      // Load devices
      const devicesData = await deviceService.getDevicesByHousehold(memberData.household_id)
      setDevices(devicesData)
    } catch (error) {
      console.error('Error loading devices:', error)
      Alert.alert('Error', 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDevices()
    setRefreshing(false)
  }

  const handleAddDevice = () => {
    navigation.navigate('DeviceSetup')
  }

  const handleDevicePress = (device: DeviceWithStatus) => {
    // Navigate to device details screen (to be implemented)
    Alert.alert(
      device.name,
      `Status: ${device.status}\nLast seen: ${device.lastSeenText}\nFirmware: ${device.firmware_version || 'Unknown'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Device',
          style: 'destructive',
          onPress: () => handleRemoveDevice(device),
        },
      ]
    )
  }

  const handleRemoveDevice = (device: DeviceWithStatus) => {
    Alert.alert(
      'Remove Device',
      `Are you sure you want to remove ${device.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await deviceService.deleteDevice(device.id)
            if (success) {
              Alert.alert('Success', 'Device removed successfully')
              loadDevices()
            } else {
              Alert.alert('Error', 'Failed to remove device')
            }
          },
        },
      ]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return theme.colors.success
      case 'offline':
        return theme.colors.muted
      case 'setup':
        return theme.colors.warning
      default:
        return theme.colors.muted
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return 'checkmark-circle'
      case 'offline':
        return 'close-circle'
      case 'setup':
        return 'time'
      default:
        return 'help-circle'
    }
  }

  const renderDevice = ({ item }: { item: DeviceWithStatus }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => handleDevicePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.deviceIcon}>
        <Ionicons name="water" size={28} color={theme.colors.primary} />
      </View>

      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <View style={styles.deviceMeta}>
          <Ionicons
            name={getStatusIcon(item.status)}
            size={14}
            color={getStatusColor(item.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.lastSeenText}>{item.lastSeenText}</Text>
        </View>
        {item.wifi_rssi && (
          <View style={styles.signalContainer}>
            <Ionicons
              name="wifi"
              size={12}
              color={
                item.wifi_rssi > -60
                  ? theme.colors.success
                  : item.wifi_rssi > -75
                  ? theme.colors.warning
                  : theme.colors.danger
              }
            />
            <Text style={styles.signalText}>{item.wifi_rssi} dBm</Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading devices...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={refreshControlColors.tintColor}
            colors={refreshControlColors.colors}
            progressBackgroundColor={refreshControlColors.progressBackgroundColor}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>My Devices</Text>
            <Text style={styles.subtitle}>Manage your Pet Fountain devices</Text>
          </View>
          <TouchableOpacity onPress={handleAddDevice} style={styles.addIconButton}>
            <Ionicons name="add-circle" size={32} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Devices List */}
        {devices.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Connected Devices ({devices.length})</Text>
            {devices.map((item) => renderDevice({ item }))}
          </View>
        ) : (
          /* Empty State */
          <View style={styles.card}>
            <View style={styles.emptyState}>
              <Ionicons name="hardware-chip-outline" size={64} color={theme.colors.muted} />
              <Text style={styles.emptyTitle}>No Devices Yet</Text>
              <Text style={styles.emptyText}>
                Add your first Pet Fountain device to start tracking hydration
              </Text>
            </View>
          </View>
        )}

        {/* Add Device Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddDevice} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
          <Text style={styles.addButtonText}>Add New Device</Text>
        </TouchableOpacity>
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    addIconButton: {
      padding: 4,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
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
    deviceMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
      gap: 6,
    },
    statusText: {
      fontSize: 13,
      fontWeight: '500',
    },
    separator: {
      fontSize: 13,
      color: theme.colors.muted,
    },
    lastSeenText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    signalContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    signalText: {
      fontSize: 11,
      color: theme.colors.muted,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      marginTop: 8,
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
  })

