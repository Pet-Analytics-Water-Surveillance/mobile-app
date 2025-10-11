import { supabase } from './supabase'
import type { Database } from './supabase'
import uuid from 'react-native-uuid'

type Device = Database['public']['Tables']['devices']['Row']
type DeviceInsert = Database['public']['Tables']['devices']['Insert']
type DeviceUpdate = Database['public']['Tables']['devices']['Update']

export interface DeviceWithStatus extends Device {
  status: 'online' | 'offline' | 'setup'
  lastSeenText?: string
}

/**
 * Device Service
 * Manages device registration, provisioning tokens, and device status
 */
class DeviceService {
  /**
   * Generate a provisioning token for a new device
   * This token will be used during BLE provisioning
   */
  async generateProvisioningToken(
    householdId: string,
    deviceHardwareId: string
  ): Promise<string> {
    try {
      // Generate a unique token
      const token = uuid.v4() as string
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Token valid for 24 hours

      // Store in database
      const { error } = await supabase.from('device_tokens').insert({
        device_hardware_id: deviceHardwareId,
        household_id: householdId,
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

      if (error) {
        console.error('Error generating provisioning token:', error)
        throw new Error('Failed to generate provisioning token')
      }

      return token
    } catch (error) {
      console.error('generateProvisioningToken error:', error)
      throw error
    }
  }

  /**
   * Register a new device after successful provisioning
   */
  async registerDevice(
    householdId: string,
    deviceHardwareId: string,
    deviceName?: string
  ): Promise<Device> {
    try {
      const deviceData: DeviceInsert = {
        household_id: householdId,
        device_hardware_id: deviceHardwareId,
        name: deviceName || `Pet Fountain ${deviceHardwareId.slice(-6)}`,
        model: 'PetFountain-v2',
        firmware_version: '2.0.0',
        is_online: false,
        settings: {
          led_brightness: 80,
          detection_sensitivity: 'medium',
          auto_refill: true,
        },
      }

      const { data, error } = await supabase
        .from('devices')
        .insert(deviceData)
        .select()
        .single()

      if (error) {
        console.error('Error registering device:', error)
        throw new Error('Failed to register device')
      }

      console.log('✓ Device registered:', data.id)
      return data
    } catch (error) {
      console.error('registerDevice error:', error)
      throw error
    }
  }

  /**
   * Get all devices for a household
   */
  async getDevicesByHousehold(householdId: string): Promise<DeviceWithStatus[]> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching devices:', error)
        throw error
      }

      // Enhance with status info
      const devicesWithStatus: DeviceWithStatus[] = (data || []).map((device) => {
        const lastSeen = device.last_seen ? new Date(device.last_seen) : null
        const now = new Date()
        let status: 'online' | 'offline' | 'setup' = 'setup'
        let lastSeenText = 'Never'

        if (lastSeen) {
          const diffMs = now.getTime() - lastSeen.getTime()
          const diffMinutes = Math.floor(diffMs / 60000)

          if (diffMinutes < 5) {
            status = 'online'
            lastSeenText = 'Just now'
          } else if (diffMinutes < 60) {
            status = 'online'
            lastSeenText = `${diffMinutes} min ago`
          } else if (diffMinutes < 1440) {
            status = 'offline'
            const hours = Math.floor(diffMinutes / 60)
            lastSeenText = `${hours} hour${hours > 1 ? 's' : ''} ago`
          } else {
            status = 'offline'
            const days = Math.floor(diffMinutes / 1440)
            lastSeenText = `${days} day${days > 1 ? 's' : ''} ago`
          }
        }

        return {
          ...device,
          status,
          lastSeenText,
        }
      })

      return devicesWithStatus
    } catch (error) {
      console.error('getDevicesByHousehold error:', error)
      return []
    }
  }

  /**
   * Get a specific device by ID
   */
  async getDeviceById(deviceId: string): Promise<Device | null> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .single()

      if (error) {
        console.error('Error fetching device:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('getDeviceById error:', error)
      return null
    }
  }

  /**
   * Update device settings
   */
  async updateDevice(deviceId: string, updates: DeviceUpdate): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', deviceId)

      if (error) {
        console.error('Error updating device:', error)
        return false
      }

      console.log('✓ Device updated')
      return true
    } catch (error) {
      console.error('updateDevice error:', error)
      return false
    }
  }

  /**
   * Delete a device
   */
  async deleteDevice(deviceId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('devices').delete().eq('id', deviceId)

      if (error) {
        console.error('Error deleting device:', error)
        return false
      }

      console.log('✓ Device deleted')
      return true
    } catch (error) {
      console.error('deleteDevice error:', error)
      return false
    }
  }

  /**
   * Check if a device hardware ID is already registered
   */
  async isDeviceRegistered(deviceHardwareId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('id')
        .eq('device_hardware_id', deviceHardwareId)
        .single()

      return !!data && !error
    } catch (error) {
      return false
    }
  }

  /**
   * Get device statistics
   */
  async getDeviceStats(deviceId: string, days: number = 7): Promise<{
    totalEvents: number
    totalWaterMl: number
    avgPerEvent: number
  }> {
    try {
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)

      const { data, error } = await supabase
        .from('hydration_events')
        .select('amount_ml')
        .eq('device_id', deviceId)
        .gte('timestamp', fromDate.toISOString())

      if (error) {
        console.error('Error fetching device stats:', error)
        return { totalEvents: 0, totalWaterMl: 0, avgPerEvent: 0 }
      }

      const totalEvents = data?.length || 0
      const totalWaterMl = data?.reduce((sum, e) => sum + e.amount_ml, 0) || 0
      const avgPerEvent = totalEvents > 0 ? Math.round(totalWaterMl / totalEvents) : 0

      return { totalEvents, totalWaterMl, avgPerEvent }
    } catch (error) {
      console.error('getDeviceStats error:', error)
      return { totalEvents: 0, totalWaterMl: 0, avgPerEvent: 0 }
    }
  }

  /**
   * Subscribe to device updates
   */
  subscribeToDeviceChanges(
    householdId: string,
    callback: (device: Device) => void
  ): (() => void) {
    const channel = supabase
      .channel(`devices:household:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          console.log('Device change:', payload)
          if (payload.new) {
            callback(payload.new as Device)
          }
        }
      )
      .subscribe()

    // Return unsubscribe function
    return () => {
      channel.unsubscribe()
    }
  }
}

export const deviceService = new DeviceService()

