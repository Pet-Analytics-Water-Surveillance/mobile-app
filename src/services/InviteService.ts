import { supabase } from './supabase'
import { HouseholdService } from './HouseholdService'

export interface HouseholdInvitation {
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
  // Extended fields from joins
  household_name?: string
  inviter_name?: string
}

export class InviteService {
  /**
   * Send a household invitation
   */
  static async sendInvitation(
    inviteeEmail: string, 
    message?: string
  ): Promise<HouseholdInvitation> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get current household
    const household = await HouseholdService.getCurrentHousehold()
    if (!household) {
      throw new Error('User must be in a household to send invitations')
    }

    // Check if user is owner or has permission to invite
    const isOwner = await HouseholdService.isHouseholdOwner()
    if (!isOwner) {
      throw new Error('Only household owners can send invitations')
    }

    // Check if user is trying to invite themselves
    if (inviteeEmail.toLowerCase() === user.email?.toLowerCase()) {
      throw new Error('Cannot invite yourself')
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvite } = await supabase
      .from('household_invitations')
      .select('*')
      .eq('household_id', household.id)
      .eq('invitee_email', inviteeEmail.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      throw new Error('An invitation is already pending for this email')
    }

    // Check if user is already a member of this household
    const { data: existingMember } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', household.id)
      .eq('user_id', user.id)
      .single()

    // Note: We can't easily query auth.users from client side
    // The invitee_id will be set when they accept the invitation

    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create the invitation
    const { data: invitation, error } = await supabase
      .from('household_invitations')
      .insert({
        household_id: household.id,
        inviter_id: user.id,
        invitee_email: inviteeEmail.toLowerCase(),
        invitee_id: null,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        message: message || null,
      })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    // TODO: Send email notification here
    // You could integrate with services like SendGrid, Resend, or Supabase Edge Functions

    return {
      ...invitation,
      household_name: household.name,
      inviter_name: user.user_metadata?.first_name || user.email
    }
  }

  /**
   * Get pending invitations for the current user's email
   */
  static async getPendingInvitations(): Promise<HouseholdInvitation[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.email) {
      return []
    }

    const { data: invitations, error } = await supabase
      .from('household_invitations')
      .select('*')
      .eq('invitee_email', user.email.toLowerCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Get household names and inviter info separately to avoid complex joins
    const enrichedInvitations = []
    for (const inv of invitations || []) {
      // Get household name
      const { data: household } = await supabase
        .from('households')
        .select('name')
        .eq('id', inv.household_id)
        .single()

      enrichedInvitations.push({
        ...inv,
        household_name: household?.name || 'Unknown Household',
        inviter_name: 'Household Owner' // Simplified for now
      })
    }

    return enrichedInvitations
  }

  /**
   * Get sent invitations for the current user's household
   */
  static async getSentInvitations(): Promise<HouseholdInvitation[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    // Get current household
    const household = await HouseholdService.getCurrentHousehold()
    if (!household) {
      return []
    }

    const { data: invitations, error } = await supabase
      .from('household_invitations')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return invitations || []
  }

  /**
   * Accept a household invitation
   */
  static async acceptInvitation(invitationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('household_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('invitee_email', user.email?.toLowerCase() || '')
      .eq('status', 'pending')
      .single()

    if (inviteError || !invitation) {
      throw new Error('Invitation not found or already processed')
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('household_invitations')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
      
      throw new Error('Invitation has expired')
    }

    // Join the household
    await HouseholdService.joinHousehold(invitation.household_id, 'member')

    // Update invitation status
    const { error: updateError } = await supabase
      .from('household_invitations')
      .update({ 
        status: 'accepted',
        invitee_id: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)

    if (updateError) {
      throw updateError
    }
  }

  /**
   * Reject a household invitation
   */
  static async rejectInvitation(invitationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('household_invitations')
      .update({ 
        status: 'rejected',
        invitee_id: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)
      .eq('invitee_email', user.email?.toLowerCase() || '')
      .eq('status', 'pending')

    if (error) {
      throw error
    }
  }

  /**
   * Cancel a sent invitation (for inviters)
   */
  static async cancelInvitation(invitationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('household_invitations')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)
      .eq('inviter_id', user.id)
      .eq('status', 'pending')

    if (error) {
      throw error
    }
  }

  /**
   * Clean up expired invitations
   */
  static async cleanupExpiredInvitations(): Promise<void> {
    const { error } = await supabase
      .from('household_invitations')
      .update({ 
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())

    if (error) {
      throw error
    }
  }

  /**
   * Generate a shareable invitation link/code
   */
  static async generateInviteCode(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get current household
    const household = await HouseholdService.getCurrentHousehold()
    if (!household) {
      throw new Error('User must be in a household to generate invite codes')
    }

    // Check if user is owner
    const isOwner = await HouseholdService.isHouseholdOwner()
    if (!isOwner) {
      throw new Error('Only household owners can generate invite codes')
    }

    // Generate a simple code based on household ID
    // In production, you might want to use a more sophisticated approach
    const code = household.id.replace(/-/g, '').substring(0, 8).toLowerCase()
    
    return code
  }

  /**
   * Join household using invite code
   */
  static async joinWithCode(inviteCode: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Find household by matching the code pattern
    const { data: households } = await supabase
      .from('households')
      .select('id')

    if (!households) {
      throw new Error('Invalid invite code')
    }

    const matchingHousehold = households.find(h => 
      h.id.replace(/-/g, '').substring(0, 8).toLowerCase() === inviteCode.toLowerCase()
    )

    if (!matchingHousehold) {
      throw new Error('Invalid invite code')
    }

    // Join the household
    await HouseholdService.joinHousehold(matchingHousehold.id, 'member')
  }
}
