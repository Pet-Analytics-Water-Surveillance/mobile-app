import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

// Get environment variables - try multiple sources
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
                   Constants.expoConfig?.extra?.supabaseUrl ||
                   Constants.manifest?.extra?.supabaseUrl
                   
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                       Constants.expoConfig?.extra?.supabaseAnonKey ||
                       Constants.manifest?.extra?.supabaseAnonKey

// Debug logging
console.log('🔍 Environment Variables Debug:')
console.log('Raw process.env.EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL)
console.log('Raw process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
console.log('Final supabaseUrl:', supabaseUrl)
console.log('Final supabaseAnonKey:', supabaseAnonKey ? 'SET' : 'MISSING')
console.log('Is URL placeholder?', supabaseUrl === 'YOUR_SUPABASE_URL')
console.log('Is KEY placeholder?', supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY')
console.log('All process.env keys:', Object.keys(process.env))

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING')
  throw new Error(
    'Missing required environment variables. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your EAS environment configuration.'
  )
}

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
          household_id: string
          name: string
          breed?: string
          weight_kg?: number
          birth_date?: string
          photo_url?: string
          rfid_tag?: string
          species: string
          daily_water_goal_ml: number
          created_at: string
          thumbnail_url?: string
          recognition_features?: any
          recognition_model_version?: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          breed?: string
          weight_kg?: number
          birth_date?: string
          photo_url?: string
          rfid_tag?: string
          species?: string
          daily_water_goal_ml?: number
          created_at?: string
          thumbnail_url?: string
          recognition_features?: any
          recognition_model_version?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          breed?: string
          weight_kg?: number
          birth_date?: string
          photo_url?: string
          rfid_tag?: string
          species?: string
          daily_water_goal_ml?: number
          created_at?: string
          thumbnail_url?: string
          recognition_features?: any
          recognition_model_version?: string
        }
      }
      devices: {
        Row: {
          id: string
          household_id: string
          device_hardware_id: string
          name: string
          firmware_version?: string
          last_seen?: string
          wifi_rssi?: number
          model: string
          is_online: boolean
          settings: any
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          device_hardware_id: string
          name: string
          firmware_version?: string
          last_seen?: string
          wifi_rssi?: number
          model?: string
          is_online?: boolean
          settings?: any
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          device_hardware_id?: string
          name?: string
          firmware_version?: string
          last_seen?: string
          wifi_rssi?: number
          model?: string
          is_online?: boolean
          settings?: any
          created_at?: string
        }
      }
      hydration_events: {
        Row: {
          id: string
          device_id?: string
          pet_id?: string
          amount_ml: number
          duration_ms?: number
          confidence?: number
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          device_id?: string
          pet_id?: string
          amount_ml: number
          duration_ms?: number
          confidence?: number
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          pet_id?: string
          amount_ml?: number
          duration_ms?: number
          confidence?: number
          timestamp?: string
          created_at?: string
        }
      }
      device_tokens: {
        Row: {
          device_hardware_id?: string
          household_id?: string
          token: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          device_hardware_id?: string
          household_id?: string
          token?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
        Update: {
          device_hardware_id?: string
          household_id?: string
          token?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
      }
      household_invitations: {
        Row: {
          id: string
          household_id: string
          inviter_id: string
          invitee_email: string
          invitee_id?: string
          status: 'pending' | 'accepted' | 'rejected' | 'expired'
          expires_at: string
          message?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          inviter_id: string
          invitee_email: string
          invitee_id?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'expired'
          expires_at?: string
          message?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          inviter_id?: string
          invitee_email?: string
          invitee_id?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'expired'
          expires_at?: string
          message?: string
          created_at?: string
          updated_at?: string
        }
      }
      pet_photos: {
        Row: {
          id: string
          pet_id?: string
          photo_url: string
          thumbnail_url?: string
          features?: any
          is_primary: boolean
          uploaded_at: string
        }
        Insert: {
          id?: string
          pet_id?: string
          photo_url: string
          thumbnail_url?: string
          features?: any
          is_primary?: boolean
          uploaded_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          photo_url?: string
          thumbnail_url?: string
          features?: any
          is_primary?: boolean
          uploaded_at?: string
        }
      }
    }
  }
}
