import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          user_id: string
          role: 'owner' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          role?: 'owner' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          created_at?: string
        }
      }
      pets: {
        Row: {
          id: string
          name: string
          species: string
          breed?: string
          weight_kg: number
          daily_water_goal_ml: number
          photo_url?: string
          thumbnail_url?: string
          rfid_tag?: string
          household_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          species: string
          breed?: string
          weight_kg: number
          daily_water_goal_ml: number
          photo_url?: string
          thumbnail_url?: string
          rfid_tag?: string
          household_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          species?: string
          breed?: string
          weight_kg?: number
          daily_water_goal_ml?: number
          photo_url?: string
          thumbnail_url?: string
          rfid_tag?: string
          household_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          name: string
          device_type: string
          serial_number: string
          household_id: string
          is_online: boolean
          last_seen: string
          firmware_version: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          device_type: string
          serial_number: string
          household_id: string
          is_online?: boolean
          last_seen?: string
          firmware_version?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          device_type?: string
          serial_number?: string
          household_id?: string
          is_online?: boolean
          last_seen?: string
          firmware_version?: string
          created_at?: string
          updated_at?: string
        }
      }
      hydration_events: {
        Row: {
          id: string
          pet_id: string
          device_id: string
          amount_ml: number
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          device_id: string
          amount_ml: number
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          device_id?: string
          amount_ml?: number
          timestamp?: string
          created_at?: string
        }
      }
      hydration_alerts: {
        Row: {
          id: string
          household_id: string
          pet_id: string
          alert_type: 'low_water' | 'no_water' | 'device_offline'
          message: string
          is_acknowledged: boolean
          acknowledged_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          pet_id: string
          alert_type: 'low_water' | 'no_water' | 'device_offline'
          message: string
          is_acknowledged?: boolean
          acknowledged_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          pet_id?: string
          alert_type?: 'low_water' | 'no_water' | 'device_offline'
          message?: string
          is_acknowledged?: boolean
          acknowledged_at?: string
          created_at?: string
        }
      }
    }
  }
}
