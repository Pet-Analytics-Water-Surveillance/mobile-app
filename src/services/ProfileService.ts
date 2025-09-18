import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  avatar_url?: string
  // Additional metadata fields can be stored in user_metadata
  user_metadata?: {
    birthday?: string
    units?: 'Metric' | 'Imperial'
    notifications?: boolean
    [key: string]: any
  }
}

export class ProfileService {
  /**
   * Get the current user's profile information
   */
  static async getCurrentProfile(): Promise<UserProfile | null> {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      first_name: user.user_metadata?.first_name || '',
      last_name: user.user_metadata?.last_name || '',
      phone: user.phone || '',
      avatar_url: user.user_metadata?.avatar_url || null,
      user_metadata: user.user_metadata || {}
    }
  }

  /**
   * Update the current user's profile
   */
  static async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Prepare the update data
    const updateData: any = {}

    // Update email if provided
    if (updates.email && updates.email !== user.email) {
      updateData.email = updates.email
    }

    // Update phone if provided
    if (updates.phone !== undefined) {
      updateData.phone = updates.phone
    }

    // Update user metadata
    const currentMetadata = user.user_metadata || {}
    const newMetadata = { ...currentMetadata }

    if (updates.first_name !== undefined) {
      newMetadata.first_name = updates.first_name
    }

    if (updates.last_name !== undefined) {
      newMetadata.last_name = updates.last_name
    }

    if (updates.avatar_url !== undefined) {
      newMetadata.avatar_url = updates.avatar_url
    }

    // Merge additional user_metadata if provided
    if (updates.user_metadata) {
      Object.assign(newMetadata, updates.user_metadata)
    }

    updateData.data = newMetadata

    // Update the user
    const { error } = await supabase.auth.updateUser(updateData)

    if (error) {
      throw error
    }
  }

  /**
   * Upload and update user avatar
   */
  static async uploadAvatar(file: File | Blob, fileName: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Upload to storage
    const filePath = `avatars/${user.id}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('user-content')
      .upload(filePath, file, {
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data } = supabase.storage
      .from('user-content')
      .getPublicUrl(filePath)

    const avatarUrl = data.publicUrl

    // Update user metadata with new avatar URL
    await this.updateProfile({ avatar_url: avatarUrl })

    return avatarUrl
  }

  /**
   * Change user password
   */
  static async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw error
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Note: This would typically require admin permissions
    // For now, we'll just sign out the user
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }
  }
}
