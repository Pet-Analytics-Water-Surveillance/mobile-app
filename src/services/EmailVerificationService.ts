import { supabase } from './supabase'

export class EmailVerificationService {
  /**
   * Check if the current user's email is verified
   */
  static async isEmailVerified(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    return !!(user?.email_confirmed_at)
  }

  /**
   * Resend verification email for a specific email address
   */
  static async resendVerificationEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: 'paws://auth/callback'
      }
    })
    
    if (error) {
      throw error
    }
  }

  /**
   * Handle email verification from deep link URL
   */
  static async handleEmailVerification(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Parse the URL to extract tokens
      const urlObj = new URL(url)
      const fragment = urlObj.hash.substring(1) // Remove the # symbol
      const params = new URLSearchParams(fragment)
      
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      
      if (accessToken) {
        // Set the session with the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        })
        
        if (error) {
          return { success: false, error: error.message }
        }
        
        if (data?.session) {
          return { success: true }
        }
        
        return { success: false, error: 'No session found in verification link' }
      } else {
        return { success: false, error: 'No access token found in verification link' }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  /**
   * Check if user needs email verification and redirect appropriately
   */
  static async checkVerificationStatus(): Promise<{
    needsVerification: boolean
    user: any
  }> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { needsVerification: false, user: null }
    }
    
    const needsVerification = !user.email_confirmed_at
    return { needsVerification, user }
  }
}
