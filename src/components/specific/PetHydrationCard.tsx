import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../services/supabase'

interface Props {
  pet: {
    id: string
    name: string
    species: string
    photo_url?: string
    daily_water_goal_ml: number
  }
}

export default function PetHydrationCard({ pet }: Props) {
  const [todayTotal, setTodayTotal] = useState(0)
  const [lastDrink, setLastDrink] = useState<string | null>(null)

  useEffect(() => {
    loadTodayData()
  }, [pet.id])

  const loadTodayData = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('hydration_events')
      .select('amount_ml, timestamp')
      .eq('pet_id', pet.id)
      .gte('timestamp', today.toISOString())
      .order('timestamp', { ascending: false })

    if (data && data.length > 0) {
      const total = data.reduce((sum: number, event: { amount_ml: number }) => sum + event.amount_ml, 0)
      setTodayTotal(total)
      setLastDrink(data[0].timestamp)
    }
  }

  const percentage = Math.round((todayTotal / pet.daily_water_goal_ml) * 100)
  const getStatusColor = () => {
    if (percentage >= 80) return '#4CAF50'
    if (percentage >= 50) return '#FFA726'
    return '#EF5350'
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {pet.photo_url ? (
          <Image source={{ uri: pet.photo_url }} style={styles.petImage} />
        ) : (
          <View style={styles.petImagePlaceholder}>
            <Ionicons 
              name={pet.species === 'cat' ? 'logo-octocat' : 'paw'} 
              size={24} 
              color="#2196F3" 
            />
          </View>
        )}
        <Text style={styles.petName}>{pet.name}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: getStatusColor()
              }
            ]} 
          />
        </View>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statsText}>{todayTotal}ml / {pet.daily_water_goal_ml}ml</Text>
        {lastDrink && (
          <Text style={styles.lastDrinkText}>
            Last: {new Date(lastDrink).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  petImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  stats: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 5,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  lastDrinkText: {
    fontSize: 10,
    color: '#999',
  },
})
