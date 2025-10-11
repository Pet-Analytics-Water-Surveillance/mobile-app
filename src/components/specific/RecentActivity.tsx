import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../services/supabase'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

interface ActivityItem {
  id: string
  pet_name: string
  amount_ml: number
  timestamp: string
}

type HydrationEventRecord = {
  id: string
  amount_ml: number
  timestamp: string
  pets?: { name?: string } | Array<{ name?: string }>
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

  useEffect(() => {
    loadRecentActivity()
  }, [])

  const loadRecentActivity = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user?.id)
      .single()

    if (member) {
      const { data } = await supabase
        .from('hydration_events')
        .select(`
          id,
          amount_ml,
          timestamp,
          pets (name)
        `)
        .eq('household_id', member.household_id)
        .order('timestamp', { ascending: false })
        .limit(5)
        .returns<HydrationEventRecord[]>()

      if (data) {
        const formattedActivities = data.map(event => {
          const petInfo = Array.isArray(event.pets) ? event.pets[0] : event.pets
          return {
            id: event.id,
            pet_name: petInfo?.name ?? 'Unknown Pet',
            amount_ml: event.amount_ml,
            timestamp: event.timestamp,
          }
        })
        setActivities(formattedActivities)
      }
    }
    setLoading(false)
  }

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <Ionicons name="water" size={16} color={theme.colors.info} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>
          <Text style={styles.petName}>{item.pet_name}</Text> drank{' '}
          <Text style={styles.amount}>{item.amount_ml}ml</Text>
        </Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading recent activity...</Text>
      </View>
    )
  }

  if (activities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={48} color={theme.colors.muted} />
        <Text style={styles.emptyText}>No recent activity</Text>
        <Text style={styles.emptySubtext}>Your pets' drinking events will appear here</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
    },
    loadingContainer: {
      paddingHorizontal: 20,
      alignItems: 'center',
      paddingVertical: 20,
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      paddingHorizontal: 20,
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 15,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.mode === 'dark' ? 0 : 0.05,
      shadowRadius: 2,
      elevation: theme.mode === 'dark' ? 0 : 2,
      borderWidth: theme.mode === 'dark' ? 1 : 0,
      borderColor: theme.colors.border,
    },
    activityIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    activityContent: {
      flex: 1,
    },
    activityText: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 4,
    },
    petName: {
      fontWeight: '600',
    },
    amount: {
      fontWeight: '600',
      color: theme.colors.info,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.muted,
    },
  })
