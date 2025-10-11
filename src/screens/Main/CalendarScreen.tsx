import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Calendar } from 'react-native-calendars'
import type { Theme as CalendarTheme } from 'react-native-calendars/src/types'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../services/supabase'
import type { Database } from '../../services/supabase'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

interface HydrationEvent {
  id: string
  pet_id: string
  pet_name: string
  timestamp: string
  amount_ml: number
}

type Pet = Database['public']['Tables']['pets']['Row']

type MarkedDateEntry = {
  marked?: boolean
  dotColor?: string
  selected?: boolean
  selectedColor?: string
}

type MarkedDatesMap = Record<string, MarkedDateEntry>

// Helpers to safely handle local dates without UTC shifting
const formatDateKey = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const parseLocalDateKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(new Date()))
  const [markedDates, setMarkedDates] = useState<MarkedDatesMap>({})
  const [dayEvents, setDayEvents] = useState<HydrationEvent[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)
  const calendarTheme = React.useMemo<CalendarTheme>(
    () => ({
      backgroundColor: theme.colors.surface,
      calendarBackground: theme.colors.surface,
      textSectionTitleColor: theme.colors.muted,
      textSectionTitleDisabledColor: theme.colors.muted,
      selectedDayBackgroundColor: theme.colors.primary,
      selectedDayTextColor: theme.colors.onPrimary,
      todayTextColor: theme.colors.primary,
      todayBackgroundColor: theme.mode === 'dark' ? theme.colors.overlay : '#ffffff',
      dayTextColor: theme.colors.text,
      textDisabledColor: theme.colors.muted,
      textInactiveColor: theme.colors.muted,
      dotColor: theme.colors.primary,
      selectedDotColor: theme.colors.onPrimary,
      disabledDotColor: theme.colors.border,
      inactiveDotColor: theme.colors.border,
      todayDotColor: theme.colors.primary,
      arrowColor: theme.colors.primary,
      monthTextColor: theme.colors.text,
      indicatorColor: theme.colors.primary,
      textDayFontWeight: '400' as const,
      textMonthFontWeight: '600' as const,
      textDayHeaderFontWeight: '500' as const,
      textDayFontSize: 16,
      textMonthFontSize: 18,
      textDayHeaderFontSize: 14,
      stylesheet: {
        calendar: {
          main: {
            backgroundColor: theme.colors.surface,
          },
          header: {
            backgroundColor: theme.colors.surface,
          },
        },
        day: {
          basic: {
            backgroundColor: theme.colors.surface,
            borderRadius: 0,
          },
        },
        'calendar-list': {
          main: {
            backgroundColor: theme.colors.surface,
          },
        },
      },
    }),
    [theme]
  )

  const loadPets = useCallback(async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return

    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user?.id)
      .single()

    if (member) {
      const { data: petsData } = await supabase
        .from('pets')
        .select('*')
        .eq('household_id', member.household_id)
      
      setPets((petsData as Pet[]) || [])
    }
  }, [])

  const loadMonthData = useCallback(async (): Promise<void> => {
    // Compute month range in local time, then query using UTC ISO strings
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const { data: events } = await supabase
      .from('hydration_events')
      .select('timestamp, pet_id')
      .gte('timestamp', startOfMonth.toISOString())
      .lte('timestamp', endOfMonth.toISOString())

    // Mark dates with events (convert each event timestamp to local date key)
    const marked: MarkedDatesMap = {}
    ;(events as Array<{ timestamp: string; pet_id: string }> | null)?.forEach(event => {
      const date = formatDateKey(new Date(event.timestamp))
      if (!marked[date]) {
        marked[date] = { marked: true, dotColor: theme.colors.primary }
      }
    })

    // Mark selected date
    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: theme.colors.primary,
    }
    
    setMarkedDates(marked)
  }, [selectedDate, theme.colors.primary])

  const loadDayEvents = useCallback(async (date: string): Promise<void> => {
    // Parse the selected date as a local date to avoid UTC off-by-one
    const base = parseLocalDateKey(date)
    const startOfDay = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999)

    const { data: events } = await supabase
      .from('hydration_events')
      .select(`
        id,
        pet_id,
        timestamp,
        amount_ml,
        pets (name)
      `)
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString())
      .order('timestamp', { ascending: false })

    type EventRow = {
      id: string
      pet_id: string
      timestamp: string
      amount_ml: number
      pets?: { name?: string } | null
    }

    const formattedEvents: HydrationEvent[] = ((events as EventRow[]) || []).map(e => ({
      id: e.id,
      pet_id: e.pet_id,
      timestamp: e.timestamp,
      amount_ml: e.amount_ml,
      pet_name: e.pets?.name ?? 'Unknown Pet',
    }))

    setDayEvents(formattedEvents)
  }, [])

  useEffect(() => {
    loadMonthData()
    loadPets()
  }, [loadMonthData, loadPets])

  useEffect(() => {
    loadDayEvents(selectedDate)
  }, [loadDayEvents, selectedDate])

  useEffect(() => {
    setMarkedDates(prev => {
      const updated: MarkedDatesMap = {}
      Object.entries(prev).forEach(([date, value]) => {
        updated[date] = {
          ...value,
          ...(value.marked ? { dotColor: theme.colors.primary } : {}),
          ...(value.selected ? { selectedColor: theme.colors.primary } : {}),
        }
      })
      return updated
    })
  }, [theme.colors.primary])

  type DayPress = { dateString: string }
  const onDayPress = (day: DayPress) => {
    setSelectedDate(day.dateString)
    
    // Update marked dates
    const newMarked: MarkedDatesMap = { ...markedDates }
    Object.keys(newMarked).forEach(key => {
      if (newMarked[key].selected) {
        delete newMarked[key].selected
        delete newMarked[key].selectedColor
      }
    })
    newMarked[day.dateString] = {
      ...(newMarked[day.dateString] || {}),
      selected: true,
      selectedColor: theme.colors.primary,
    }
    setMarkedDates(newMarked)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPetColor = (petId: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
    const index = pets.findIndex(p => p.id === petId)
    return colors[Math.abs(index) % colors.length]
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Hydration Calendar</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <Calendar
        key={theme.mode}
        current={selectedDate}
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={calendarTheme}
        style={styles.calendar}
      />

      <ScrollView style={styles.eventsList}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateTitle}>
            {parseLocalDateKey(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <Text style={styles.eventCount}>
            {dayEvents.length} drinking event{dayEvents.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {dayEvents.length > 0 ? (
          dayEvents.map(event => (
            <View key={event.id} style={styles.eventCard}>
              <View 
                style={[styles.eventIndicator, { backgroundColor: getPetColor(event.pet_id) }]} 
              />
              <View style={styles.eventContent}>
                <Text style={styles.eventPetName}>{event.pet_name}</Text>
                <Text style={styles.eventDetails}>
                  {event.amount_ml}ml at {formatTime(event.timestamp)}
                </Text>
              </View>
              <Ionicons name="water" size={24} color={theme.colors.info} />
            </View>
          ))
        ) : (
          <View style={styles.noEvents}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.muted} />
            <Text style={styles.noEventsText}>No hydration events on this day</Text>
          </View>
        )}
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    eventsList: {
      flex: 1,
      paddingHorizontal: 20,
    },
    dateHeader: {
      marginTop: 20,
      marginBottom: 15,
    },
    calendar: {
      marginHorizontal: 20,
      marginBottom: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: theme.mode === 'dark' ? 1 : 0,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      elevation: theme.mode === 'dark' ? 0 : 2,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.mode === 'dark' ? 0 : 0.05,
      shadowRadius: 2,
    },
    dateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 5,
    },
    eventCount: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    eventCard: {
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
    eventIndicator: {
      width: 4,
      height: 40,
      borderRadius: 2,
      marginRight: 15,
    },
    eventContent: {
      flex: 1,
    },
    eventPetName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    eventDetails: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    noEvents: {
      alignItems: 'center',
      marginTop: 50,
    },
    noEventsText: {
      marginTop: 15,
      fontSize: 16,
      color: theme.colors.muted,
    },
  })
