import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../services/supabase'
import type { Database } from '../../services/supabase'
import { useNavigation, CommonActions } from '@react-navigation/native'
import type { HomeScreenNavigationProp } from '../../navigation/types'
import PetHydrationCard from '../../components/specific/PetHydrationCard'
import QuickStats from '../../components/specific/QuickStats'
import RecentActivity from '../../components/specific/RecentActivity'
import { AppTheme, useAppTheme, useThemedStyles, useRefreshControlColors } from '../../theme'
import { hydrationService, HydrationEventWithPet } from '../../services/HydrationService'

type Pet = Database['public']['Tables']['pets']['Row']
type Household = Database['public']['Tables']['households']['Row']

type TodayStats = {
  totalWater: number
  activeDevices: number
  alerts: number
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>()
  const [refreshing, setRefreshing] = useState(false)
  const [pets, setPets] = useState<Pet[]>([])
  const [household, setHousehold] = useState<Household | null>(null)
  const [todayStats, setTodayStats] = useState<TodayStats>({
    totalWater: 0,
    activeDevices: 0,
    alerts: 0,
  })
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)
  const refreshControlColors = useRefreshControlColors()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning! 👋'
    if (hour < 17) return 'Good Afternoon! 👋'
    return 'Good Evening! 👋'
  }

  const loadDashboardData = useCallback(async () => {
    // Load household data
    const { data: { user } } = await supabase.auth.getUser()
    const { data: memberData }: { data: { household_id: string; households: Household } | null } = await supabase
      .from('household_members')
      .select('household_id, households(*)')
      .eq('user_id', user?.id)
      .single()

    if (memberData) {
      setHousehold(memberData.households)
      
      // Load pets
      const { data: petsData }: { data: Pet[] | null } = await supabase
        .from('pets')
        .select('*')
        .eq('household_id', memberData.household_id)
      
      setPets(petsData || [])

      // Load today's stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: events }: { data: Array<{ amount_ml: number }> | null } = await supabase
        .from('hydration_events')
        .select('amount_ml')
        .gte('timestamp', today.toISOString())
      
      const totalWater = (events?.reduce((sum, e) => sum + e.amount_ml, 0)) || 0
      
      const { data: devices }: { data: Array<{ is_online: boolean }> | null } = await supabase
        .from('devices')
        .select('is_online')
        .eq('household_id', memberData.household_id)
      
      const activeDevices = devices?.filter((d) => d.is_online).length || 0
      
      const { data: alerts }: { data: Array<{ id: string }> | null } = await supabase
        .from('hydration_alerts')
        .select('id')
        .eq('household_id', memberData.household_id)
        .is('acknowledged_at', null)
      
      setTodayStats({
        totalWater,
        activeDevices,
        alerts: alerts?.length || 0,
      })

      // Set up real-time hydration event subscription
      setupRealtimeSubscription(memberData.household_id)
    }
  }, [])

  const setupRealtimeSubscription = (householdId: string) => {
    // Subscribe to new hydration events
    const unsubscribe = hydrationService.subscribeToHydrationEvents(
      householdId,
      (event: HydrationEventWithPet) => {
        console.log('New hydration event received:', event)
        
        // Update today's stats
        setTodayStats((prev) => ({
          ...prev,
          totalWater: prev.totalWater + event.amount_ml,
        }))

        // Show in-app alert
        Alert.alert(
          '💧 Pet Drank Water',
          `${event.petName} just drank ${event.amount_ml}ml of water!`,
          [{ text: 'OK' }]
        )

        // Refresh dashboard data
        loadDashboardData()
      }
    )

    // Store unsubscribe function
    return unsubscribe
  }

  useEffect(() => {
    loadDashboardData()

    // Cleanup subscriptions on unmount
    return () => {
      hydrationService.unsubscribeAll()
    }
  }, [loadDashboardData])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
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
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.householdName}>Dashboard</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
            {todayStats.alerts > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{todayStats.alerts}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <QuickStats stats={todayStats} />

        {/* Pets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Pets</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petsScrollContainer}
            style={styles.petsScrollView}
          >
            {pets.map(pet => (
              <PetHydrationCard key={pet.id} pet={pet} />
            ))}
            
            {/* Add Pet Card */}
            <TouchableOpacity
              style={styles.addPetCard}
              onPress={() =>
                navigation.navigate('Settings', {
                  screen: 'PetAdd',
                  params: { fromHome: true },
                })
              }
            >
              <Ionicons name="add-circle-outline" size={48} color={theme.colors.primary} />
              <Text style={styles.addPetText}>Add Pet</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={[styles.section, styles.sectionBody]}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <RecentActivity />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Navigate to Settings tab and DeviceSetup screen with fromHome flag
              navigation.navigate('Settings', {
                screen: 'DeviceSetup',
                params: { fromHome: true },
              })
            }}
          >
            <Ionicons name="add-outline" size={24} color={theme.colors.onPrimary} />
            <Text style={styles.actionButtonText}>Add Device</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('Statistics')}
          >
            <Ionicons name="bar-chart-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>View Stats</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    scrollContent: {
      paddingBottom: 100,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    greeting: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    householdName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 4,
    },
    notificationButton: {
      position: 'relative',
    },
    notificationBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: theme.colors.danger,
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: theme.colors.onPrimary,
      fontSize: 10,
      fontWeight: 'bold',
    },
    section: {
      marginVertical: 20,
    },
    sectionBody: {
      paddingHorizontal: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    seeAll: {
      fontSize: 14,
      color: theme.colors.primary,
    },
    petsScrollView: {
      marginHorizontal: -10,
    },
    petsScrollContainer: {
      paddingHorizontal: 20,
      paddingVertical: 5,
    },
    addPetCard: {
      width: 150,
      height: 180,
      backgroundColor: theme.colors.surface,
      borderRadius: 15,
      marginHorizontal: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
    },
    addPetText: {
      marginTop: 10,
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    quickActions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 20,
      gap: 15,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 15,
      borderRadius: 12,
      gap: 8,
    },
    secondaryButton: {
      backgroundColor: theme.colors.overlay,
    },
    secondaryButtonText: {
      color: theme.colors.primary,
    },
    actionButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
  })
