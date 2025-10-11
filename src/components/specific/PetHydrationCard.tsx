import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../services/supabase'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

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
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

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

  const goal = pet.daily_water_goal_ml || 1
  const percentage = Math.round((todayTotal / goal) * 100)
  const getStatusColor = () => {
    if (percentage >= 80) return theme.colors.success
    if (percentage >= 50) return theme.colors.warning
    return theme.colors.danger
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
              color={theme.colors.primary} 
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

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      width: 150,
      height: 180,
      backgroundColor: theme.colors.card,
      borderRadius: 15,
      padding: 15,
      marginHorizontal: 10,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.mode === 'dark' ? 0 : 0.1,
      shadowRadius: 3,
      elevation: theme.mode === 'dark' ? 0 : 3,
      borderWidth: theme.mode === 'dark' ? 1 : 0,
      borderColor: theme.colors.border,
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
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    petName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    progressContainer: {
      marginBottom: 8,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.12)'
        : theme.colors.border,
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
      color: theme.colors.textSecondary,
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
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    lastDrinkText: {
      fontSize: 10,
      color: theme.colors.muted,
    },
  })
