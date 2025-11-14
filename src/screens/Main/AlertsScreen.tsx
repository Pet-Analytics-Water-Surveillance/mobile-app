import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../../services/supabase'
import { AppTheme, useAppTheme, useThemedStyles, useRefreshControlColors } from '../../theme'

type HydrationAlert = {
  id: string
  household_id: string
  pet_id: string | null
  alert_type: string
  severity: string
  message: string | null
  created_at: string
  acknowledged_at: string | null
  pets?: { name: string; species: string }
}

export default function AlertsScreen() {
  const navigation = useNavigation<any>()
  const [alerts, setAlerts] = useState<HydrationAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)
  const refreshControlColors = useRefreshControlColors()

  const loadAlerts = useCallback(async () => {
    try {
      // Get current user's household
      const { data: { user } } = await supabase.auth.getUser()
      const { data: memberData } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user?.id)
        .single()

      if (!memberData) {
        setAlerts([])
        return
      }

      // Fetch all alerts for the household, ordered by creation date
      const { data: alertsData, error } = await supabase
        .from('hydration_alerts')
        .select('*, pets(name, species)')
        .eq('household_id', memberData.household_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading alerts:', error)
        Alert.alert('Error', 'Failed to load alerts')
        return
      }

      setAlerts(alertsData || [])
    } catch (error) {
      console.error('Error loading alerts:', error)
      Alert.alert('Error', 'Failed to load alerts')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  // Set up real-time subscription for new alerts
  useEffect(() => {
    let channel: any = null

    const setupSubscription = async () => {
      try {
        // Get current user's household
        const { data: { user } } = await supabase.auth.getUser()
        const { data: memberData } = await supabase
          .from('household_members')
          .select('household_id')
          .eq('user_id', user?.id)
          .single()

        if (!memberData) return

        // Subscribe to new alerts for this household
        channel = supabase
          .channel('hydration_alerts_realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'hydration_alerts',
              filter: `household_id=eq.${memberData.household_id}`,
            },
            async (payload) => {
              console.log('New alert received:', payload)
              
              const newAlert = payload.new as HydrationAlert

              // Fetch pet information if available
              if (newAlert.pet_id) {
                const { data: petData } = await supabase
                  .from('pets')
                  .select('name, species')
                  .eq('id', newAlert.pet_id)
                  .single()

                if (petData) {
                  newAlert.pets = petData
                }
              }

              // Add to the top of the list
              setAlerts((prev) => [newAlert, ...prev])
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'hydration_alerts',
              filter: `household_id=eq.${memberData.household_id}`,
            },
            (payload) => {
              console.log('Alert updated:', payload)
              const updatedAlert = payload.new as HydrationAlert

              // Update the alert in the list
              setAlerts((prev) =>
                prev.map((alert) =>
                  alert.id === updatedAlert.id ? { ...alert, ...updatedAlert } : alert
                )
              )
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'hydration_alerts',
              filter: `household_id=eq.${memberData.household_id}`,
            },
            (payload) => {
              console.log('Alert deleted:', payload)
              const deletedAlert = payload.old as HydrationAlert

              // Remove from the list
              setAlerts((prev) => prev.filter((alert) => alert.id !== deletedAlert.id))
            }
          )
          .subscribe((status) => {
            console.log('Alerts subscription status:', status)
          })
      } catch (error) {
        console.error('Error setting up alerts subscription:', error)
      }
    }

    setupSubscription()

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        channel.unsubscribe()
        console.log('Unsubscribed from alerts')
      }
    }
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAlerts()
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('hydration_alerts')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', alertId)

      if (error) {
        console.error('Error acknowledging alert:', error)
        Alert.alert('Error', 'Failed to acknowledge alert')
        return
      }

      // Update local state
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? { ...alert, acknowledged_at: new Date().toISOString() }
            : alert
        )
      )
    } catch (error) {
      console.error('Error acknowledging alert:', error)
      Alert.alert('Error', 'Failed to acknowledge alert')
    }
  }

  const deleteAlert = async (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('hydration_alerts')
                .delete()
                .eq('id', alertId)

              if (error) {
                console.error('Error deleting alert:', error)
                Alert.alert('Error', 'Failed to delete alert')
                return
              }

              // Update local state
              setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
            } catch (error) {
              console.error('Error deleting alert:', error)
              Alert.alert('Error', 'Failed to delete alert')
            }
          },
        },
      ]
    )
  }

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { name: 'alert-circle' as const, color: theme.colors.danger }
      case 'warning':
        return { name: 'warning' as const, color: '#FF9500' }
      case 'info':
        return { name: 'information-circle' as const, color: theme.colors.primary }
      default:
        return { name: 'notifications' as const, color: theme.colors.textSecondary }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, (letter: string) => letter.toUpperCase())
  }

  const renderAlert = ({ item }: { item: HydrationAlert }) => {
    const icon = getAlertIcon(item.severity)
    const isAcknowledged = !!item.acknowledged_at

    return (
      <View style={[styles.alertCard, isAcknowledged && styles.acknowledgedCard]}>
        <View style={styles.alertHeader}>
          <View style={styles.alertIconContainer}>
            <Ionicons name={icon.name} size={24} color={icon.color} />
          </View>
          <View style={styles.alertContent}>
            <Text style={[styles.alertTitle, isAcknowledged && styles.acknowledgedText]}>
              {capitalizeWords(item.alert_type.replace(/_/g, ' '))}
            </Text>
            {item.pets && (
              <Text style={[styles.petName, isAcknowledged && styles.acknowledgedText]}>
                {item.pets.name}
              </Text>
            )}
            <Text style={styles.alertTime}>{formatDate(item.created_at)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => deleteAlert(item.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="close-circle" size={24} color={theme.colors.muted} />
          </TouchableOpacity>
        </View>
        
        {item.message && (
          <Text style={[styles.alertMessage, isAcknowledged && styles.acknowledgedText]}>
            {item.message}
          </Text>
        )}

        {!isAcknowledged && (
          <TouchableOpacity
            style={styles.acknowledgeButton}
            onPress={() => acknowledgeAlert(item.id)}
          >
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
            <Text style={styles.acknowledgeText}>Mark as Read</Text>
          </TouchableOpacity>
        )}
        
        {isAcknowledged && (
          <View style={styles.acknowledgedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.acknowledgedBadgeText}>Acknowledged</Text>
          </View>
        )}
      </View>
    )
  }

  const unreadCount = alerts.filter(a => !a.acknowledged_at).length

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Alerts</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading alerts...</Text>
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.colors.muted} />
          <Text style={styles.emptyTitle}>No Alerts</Text>
          <Text style={styles.emptyText}>
            You'll see notifications here when there are updates about your pets' hydration
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={refreshControlColors.tintColor}
              colors={refreshControlColors.colors}
              progressBackgroundColor={refreshControlColors.progressBackgroundColor}
            />
          }
        />
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 4,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    headerBadge: {
      backgroundColor: theme.colors.danger,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginLeft: 8,
      minWidth: 24,
      alignItems: 'center',
    },
    headerBadgeText: {
      color: theme.colors.onPrimary,
      fontSize: 12,
      fontWeight: 'bold',
    },
    headerRight: {
      width: 36,
    },
    listContainer: {
      padding: 16,
    },
    alertCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    acknowledgedCard: {
      opacity: 0.7,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    alertIconContainer: {
      marginRight: 12,
    },
    alertContent: {
      flex: 1,
    },
    alertTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    petName: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
      marginBottom: 4,
    },
    alertTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    alertMessage: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
      lineHeight: 20,
    },
    acknowledgedText: {
      color: theme.colors.muted,
    },
    deleteButton: {
      padding: 4,
    },
    acknowledgeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.overlay,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginTop: 12,
      gap: 6,
    },
    acknowledgeText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    acknowledgedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 6,
    },
    acknowledgedBadgeText: {
      color: theme.colors.success,
      fontSize: 13,
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
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
  })

