import { supabase } from './supabase'

export interface Household {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface HouseholdMember {
  id: string
  household_id: string
  user_id: string
  role: 'owner' | 'member'
  created_at: string
}

export class HouseholdService {
  /**
   * Get or create a household for the current user
   * If user doesn't have a household, creates one
   */
  static async getOrCreateHousehold(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Check if user already has a household
    const { data: existingMember } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return existingMember.household_id
    }

    // Create new household for user
    const { data: household, error: householdError } = await supabase
      .from('households')
      .insert({
        name: `${user.email}'s Household`
      })
      .select()
      .single()

    if (householdError) {
      throw householdError
    }

    // Create household member record
    const { error: memberError } = await supabase
      .from('household_members')
      .insert({
        household_id: household.id,
        user_id: user.id,
        role: 'owner'
      })

    if (memberError) {
      throw memberError
    }

    return household.id
  }

  /**
   * Get the current user's household
   */
  static async getCurrentHousehold(): Promise<Household | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }

    // First get the household_id from household_members
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return null
    }

    // Then get the household details
    const { data: household } = await supabase
      .from('households')
      .select('*')
      .eq('id', member.household_id)
      .single()

    return household
  }

  /**
   * Join a household (for invitations)
   * This will remove the user from their current household if they have one
   */
  static async joinHousehold(householdId: string, role: 'owner' | 'member' = 'member'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Remove user from current household if they have one
    await this.leaveCurrentHousehold()

    // Add user to new household
    const { error } = await supabase
      .from('household_members')
      .insert({
        household_id: householdId,
        user_id: user.id,
        role: role
      })

    if (error) {
      throw error
    }
  }

  /**
   * Leave the current household
   */
  static async leaveCurrentHousehold(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return
    }

    // Delete current household member record
    const { error } = await supabase
      .from('household_members')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      throw error
    }
  }

  /**
   * Get all members of the current household
   */
  static async getHouseholdMembers(): Promise<HouseholdMember[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    // First get the household_id from household_members
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return []
    }

    // Then get all members of that household
    const { data: members } = await supabase
      .from('household_members')
      .select('*')
      .eq('household_id', member.household_id)

    return members || []
  }

  /**
   * Check if user is the owner of their current household
   */
  static async isHouseholdOwner(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return false
    }

    const { data: member } = await supabase
      .from('household_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    return member?.role === 'owner'
  }

  /**
   * Update household information (only for owners)
   */
  static async updateHousehold(updates: Partial<Pick<Household, 'name'>>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Check if user is the owner
    const isOwner = await this.isHouseholdOwner()
    if (!isOwner) {
      throw new Error('Only household owners can update household information')
    }

    // Get the household_id
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      throw new Error('User is not a member of any household')
    }

    // Update the household
    const { error } = await supabase
      .from('households')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', member.household_id)

    if (error) {
      throw error
    }
  }
}
