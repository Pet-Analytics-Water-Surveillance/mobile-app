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
   * Supports multiple formats: access_token, token_hash, or verification by checking session
   */
  static async handleEmailVerification(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 Processing email verification URL:', url)
      
      // Parse the URL to extract tokens/parameters
      const urlObj = new URL(url)
      const fragment = urlObj.hash.substring(1) // Remove the # symbol
      const searchParams = new URLSearchParams(urlObj.search)
      const hashParams = new URLSearchParams(fragment)
      
      // Check for access_token in hash (OAuth flow)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      if (accessToken) {
        console.log('✅ Found access token in URL, setting session...')
        // Set the session with the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        })
        
        if (error) {
          console.error('❌ Session error:', error.message)
          return { success: false, error: error.message }
        }
        
        if (data?.session) {
          console.log('✅ Session established successfully')
          return { success: true }
        }
        
        return { success: false, error: 'No session found in verification link' }
      }
      
      // Check for token_hash (email confirmation link)
      const tokenHash = hashParams.get('token_hash') || searchParams.get('token_hash')
      const type = hashParams.get('type') || searchParams.get('type')
      
      if (tokenHash) {
        console.log('✅ Found token_hash, verifying with Supabase...')
        // Let Supabase handle the token verification
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type === 'signup' ? 'signup' : 'email',
        })
        
        if (error) {
          console.error('❌ Token verification error:', error.message)
          return { success: false, error: error.message }
        }
        
        if (data?.session) {
          console.log('✅ Email verified successfully via token_hash')
          return { success: true }
        }
      }
      
      // Fallback: Check if user is already verified (verification happened on web)
      console.log('🔍 No tokens found, checking current session...')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('✅ User session exists, checking verification status...')
        // Refresh user data to get latest verification status
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('❌ Error fetching user:', error.message)
          return { success: false, error: error.message }
        }
        
        if (user?.email_confirmed_at) {
          console.log('✅ Email already verified!')
          return { success: true }
        } else {
          console.log('⚠️ User session exists but email not verified yet')
          return { 
            success: false, 
            error: 'Please click the verification link in your email to complete verification' 
          }
        }
      }
      
      // No tokens or session found
      console.log('❌ No valid verification data found in URL')
      return { 
        success: false, 
        error: 'Invalid verification link. Please request a new verification email.' 
      }
      
    } catch (error) {
      console.error('❌ Email verification error:', error)
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
