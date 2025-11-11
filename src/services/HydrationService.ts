import { supabase } from './supabase'
import type { Database } from './supabase'
import { notificationService } from './NotificationService'

type HydrationEvent = Database['public']['Tables']['hydration_events']['Row']
type Pet = Database['public']['Tables']['pets']['Row']

export interface HydrationEventWithPet extends HydrationEvent {
  pet?: Pet
  petName?: string
}

/**
 * Hydration Service
 * Manages hydration events and real-time subscriptions
 */
class HydrationService {
  private activeSubscriptions: Map<string, any> = new Map()

  /**
   * Get hydration events for a household
   */
  async getHydrationEvents(
    householdId: string,
    limit: number = 50
  ): Promise<HydrationEventWithPet[]> {
    try {
      // Get all devices in household
      const { data: devices } = await supabase
        .from('devices')
        .select('id')
        .eq('household_id', householdId)

      if (!devices || devices.length === 0) {
        return []
      }

      const deviceIds = devices.map((d) => d.id)

      // Get hydration events for those devices
      const { data: events, error } = await supabase
        .from('hydration_events')
        .select('*, pets(*)')
        .in('device_id', deviceIds)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching hydration events:', error)
        return []
      }

      // Map to include pet information
      const eventsWithPets: HydrationEventWithPet[] = (events || []).map((event: any) => ({
        ...event,
        pet: event.pets,
        petName: event.pets?.name || 'Unknown Pet',
      }))

      return eventsWithPets
    } catch (error) {
      console.error('getHydrationEvents error:', error)
      return []
    }
  }

  /**
   * Get hydration events for a specific pet
   */
  async getPetHydrationEvents(
    petId: string,
    limit: number = 30
  ): Promise<HydrationEvent[]> {
    try {
      const { data, error } = await supabase
        .from('hydration_events')
        .select('*')
        .eq('pet_id', petId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching pet hydration events:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('getPetHydrationEvents error:', error)
      return []
    }
  }

  /**
   * Get today's hydration stats for a pet
   */
  async getPetTodayStats(petId: string): Promise<{
    totalMl: number
    eventCount: number
    lastDrink: Date | null
    goalMl: number
    progressPercent: number
  }> {
    try {
      // Get pet's daily goal
      const { data: pet } = await supabase
        .from('pets')
        .select('daily_water_goal_ml')
        .eq('id', petId)
        .single()

      const goalMl = pet?.daily_water_goal_ml || 500

      // Get today's events
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: events } = await supabase
        .from('hydration_events')
        .select('amount_ml, timestamp')
        .eq('pet_id', petId)
        .gte('timestamp', today.toISOString())

      const totalMl = events?.reduce((sum, e) => sum + e.amount_ml, 0) || 0
      const eventCount = events?.length || 0
      const lastDrink = events && events.length > 0 ? new Date(events[0].timestamp) : null
      const progressPercent = Math.min((totalMl / goalMl) * 100, 100)

      return {
        totalMl,
        eventCount,
        lastDrink,
        goalMl,
        progressPercent,
      }
    } catch (error) {
      console.error('getPetTodayStats error:', error)
      return {
        totalMl: 0,
        eventCount: 0,
        lastDrink: null,
        goalMl: 500,
        progressPercent: 0,
      }
    }
  }

  /**
   * Get hydration stats for a date range
   */
  async getHydrationStatsRange(
    householdId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalMl: number
    eventCount: number
    avgPerDay: number
    avgPerEvent: number
  }> {
    try {
      // Get all devices in household
      const { data: devices } = await supabase
        .from('devices')
        .select('id')
        .eq('household_id', householdId)

      if (!devices || devices.length === 0) {
        return {
          totalMl: 0,
          eventCount: 0,
          avgPerDay: 0,
          avgPerEvent: 0,
        }
      }

      const deviceIds = devices.map((d) => d.id)

      const { data: events } = await supabase
        .from('hydration_events')
        .select('amount_ml, timestamp')
        .in('device_id', deviceIds)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())

      const totalMl = events?.reduce((sum, e) => sum + e.amount_ml, 0) || 0
      const eventCount = events?.length || 0
      const daysDiff = Math.max(
        1,
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      )
      const avgPerDay = Math.round(totalMl / daysDiff)
      const avgPerEvent = eventCount > 0 ? Math.round(totalMl / eventCount) : 0

      return {
        totalMl,
        eventCount,
        avgPerDay,
        avgPerEvent,
      }
    } catch (error) {
      console.error('getHydrationStatsRange error:', error)
      return {
        totalMl: 0,
        eventCount: 0,
        avgPerDay: 0,
        avgPerEvent: 0,
      }
    }
  }

  /**
   * Subscribe to real-time hydration events
   */
  subscribeToHydrationEvents(
    householdId: string,
    onNewEvent: (event: HydrationEventWithPet) => void
  ): (() => void) {
    const subscriptionKey = `hydration:${householdId}`

    // Unsubscribe if already exists
    if (this.activeSubscriptions.has(subscriptionKey)) {
      const existing = this.activeSubscriptions.get(subscriptionKey)
      existing.unsubscribe()
    }

    console.log('Setting up hydration events subscription for household:', householdId)

    // Get device IDs for this household first
    supabase
      .from('devices')
      .select('id')
      .eq('household_id', householdId)
      .then(({ data: devices }) => {
        if (!devices || devices.length === 0) {
          console.warn('No devices found for household')
          return
        }

        const deviceIds = devices.map((d) => d.id)

        // Subscribe to hydration events for these devices
        const channel = supabase
          .channel(subscriptionKey)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'hydration_events',
            },
            async (payload) => {
              console.log('New hydration event:', payload)

              const event = payload.new as HydrationEvent

              // Check if this event is for one of our devices
              if (!deviceIds.includes(event.device_id || '')) {
                return
              }

              // Fetch pet information
              let pet: Pet | undefined
              if (event.pet_id) {
                const { data: petData } = await supabase
                  .from('pets')
                  .select('*')
                  .eq('id', event.pet_id)
                  .single()
                pet = petData || undefined
              }

              const eventWithPet: HydrationEventWithPet = {
                ...event,
                pet,
                petName: pet?.name || 'Unknown Pet',
              }

              // Trigger callback
              onNewEvent(eventWithPet)

              // Show notification
              this.showHydrationNotification(eventWithPet)
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status)
          })

        this.activeSubscriptions.set(subscriptionKey, channel)
      })

    // Return unsubscribe function
    return () => {
      const channel = this.activeSubscriptions.get(subscriptionKey)
      if (channel) {
        channel.unsubscribe()
        this.activeSubscriptions.delete(subscriptionKey)
        console.log('Unsubscribed from hydration events')
      }
    }
  }

  /**
   * Show local notification for hydration event
   */
  private async showHydrationNotification(event: HydrationEventWithPet): Promise<void> {
    try {
      await notificationService.showHydrationNotification(
        event.petName || 'Unknown Pet',
        event.amount_ml,
        event.pet_id || undefined
      )

      // Check if pet reached daily goal
      if (event.pet_id) {
        const stats = await this.getPetTodayStats(event.pet_id)
        if (stats.totalMl >= stats.goalMl && stats.progressPercent >= 100) {
          // Show goal achievement notification
          await notificationService.showGoalAchievedNotification(
            event.petName || 'Your pet',
            stats.goalMl
          )
        }
      }
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    this.activeSubscriptions.forEach((channel) => {
      channel.unsubscribe()
    })
    this.activeSubscriptions.clear()
    console.log('Unsubscribed from all hydration events')
  }
}

export const hydrationService = new HydrationService()

