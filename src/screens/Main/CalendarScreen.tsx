import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Calendar } from 'react-native-calendars'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../services/supabase'

interface HydrationEvent {
  id: string
  pet_id: string
  pet_name: string
  timestamp: string
  amount_ml: number
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [markedDates, setMarkedDates] = useState({})
  const [dayEvents, setDayEvents] = useState<HydrationEvent[]>([])
  const [pets, setPets] = useState([])

  useEffect(() => {
    loadMonthData()
    loadPets()
  }, [])

  useEffect(() => {
    loadDayEvents(selectedDate)
  }, [selectedDate])

  const loadPets = async () => {
    const { data: { user } } = await supabase.auth.getUser()
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
      
      setPets(petsData || [])
    }
  }

  const loadMonthData = async () => {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const endOfMonth = new Date()
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    endOfMonth.setDate(0)
    endOfMonth.setHours(23, 59, 59, 999)

    const { data: events } = await supabase
      .from('hydration_events')
      .select('timestamp, pet_id')
      .gte('timestamp', startOfMonth.toISOString())
      .lte('timestamp', endOfMonth.toISOString())

    // Mark dates with events
    const marked = {}
    events?.forEach(event => {
      const date = event.timestamp.split('T')[0]
      if (!marked[date]) {
        marked[date] = { marked: true, dotColor: '#2196F3' }
      }
    })

    // Mark selected date
    marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: '#2196F3' }
    
    setMarkedDates(marked)
  }

  const loadDayEvents = async (date: string) => {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

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

    const formattedEvents = events?.map(e => ({
      ...e,
      pet_name: e.pets?.name || 'Unknown Pet'
    })) || []

    setDayEvents(formattedEvents)
  }

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString)
    
    // Update marked dates
    const newMarked = { ...markedDates }
    Object.keys(newMarked).forEach(key => {
      if (newMarked[key].selected) {
        delete newMarked[key].selected
        delete newMarked[key].selectedColor
      }
    })
    newMarked[day.dateString] = {
      ...newMarked[day.dateString],
      selected: true,
      selectedColor: '#2196F3'
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
    return colors[index % colors.length]
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hydration Calendar</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <Calendar
        current={selectedDate}
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#2196F3',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#2196F3',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#2196F3',
          selectedDotColor: '#ffffff',
          arrowColor: '#2196F3',
          monthTextColor: '#2d4150',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14
        }}
      />

      <ScrollView style={styles.eventsList}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateTitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
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
              <Ionicons name="water" size={24} color="#4FC3F7" />
            </View>
          ))
        ) : (
          <View style={styles.noEvents}>
            <Ionicons name="calendar-outline" size={48} color="#C0C0C0" />
            <Text style={styles.noEventsText}>No hydration events on this day</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateHeader: {
    marginTop: 20,
    marginBottom: 15,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  eventCount: {
    fontSize: 14,
    color: '#666',
  },
  eventCard: {
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
    color: '#333',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    color: '#666',
  },
  noEvents: {
    alignItems: 'center',
    marginTop: 50,
  },
  noEventsText: {
    marginTop: 15,
    fontSize: 16,
    color: '#999',
  },
})
