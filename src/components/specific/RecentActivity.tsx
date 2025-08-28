import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../services/supabase'

interface ActivityItem {
  id: string
  pet_name: string
  amount_ml: number
  timestamp: string
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

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

      if (data) {
        const formattedActivities = data.map(event => ({
          id: event.id,
          pet_name: event.pets?.name || 'Unknown Pet',
          amount_ml: event.amount_ml,
          timestamp: event.timestamp,
        }))
        setActivities(formattedActivities)
      }
    }
    setLoading(false)
  }

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <Ionicons name="water" size={16} color="#4FC3F7" />
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
        <Ionicons name="time-outline" size={48} color="#C0C0C0" />
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

const styles = StyleSheet.create({
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
    color: '#666',
  },
  emptyContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  petName: {
    fontWeight: '600',
  },
  amount: {
    fontWeight: '600',
    color: '#4FC3F7',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
})
