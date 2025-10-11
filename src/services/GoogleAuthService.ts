import { supabase } from './supabase'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'

// Configure WebBrowser for auth session
WebBrowser.maybeCompleteAuthSession()

export class GoogleAuthService {
  /**
   * Sign in with Google using Supabase Auth (React Native/Expo approach)
   * Based on official Supabase documentation for React Native
   */
  static async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      // Create the redirect URI for Expo
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'paws',
        path: 'auth/callback'
      })

      console.log('🔗 Using redirect URI:', redirectUri)

      // Start OAuth flow with Supabase using the redirect URI
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('❌ Supabase OAuth error:', error.message)
        return { success: false, error: error.message }
      }

      // Open the OAuth URL in browser
      if (data?.url) {
        console.log('🌐 Opening OAuth URL:', data.url)
        
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        )

        console.log('📱 Auth session result:', result.type)

        if (result.type === 'success') {
          console.log('✅ OAuth flow completed')
          // The deep link handler in App.tsx will process the callback
          return { success: true }
        } else if (result.type === 'cancel') {
          return { success: false, error: 'Authentication was cancelled' }
        } else {
          return { success: false, error: 'Authentication failed' }
        }
      }

      return { success: false, error: 'No authentication URL received from Supabase' }
    } catch (error) {
      console.error('❌ Google sign-in error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Google sign-in failed' 
      }
    }
  }

  /**
   * Handle OAuth callback from deep link
   */
  static async handleOAuthCallback(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔗 Processing OAuth callback:', url)
      
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
          console.error('❌ OAuth callback error:', error.message)
          return { success: false, error: error.message }
        }
        
        if (data?.session) {
          console.log('✅ OAuth callback successful!')
          return { success: true }
        }
        
        return { success: false, error: 'No session found in OAuth callback' }
      } else {
        return { success: false, error: 'No access token found in callback URL' }
      }
    } catch (error) {
      console.error('❌ OAuth callback processing error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'OAuth callback failed' 
      }
    }
  }

  /**
   * Get user profile information after Google sign-in
   */
  static async getUserProfile() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        throw new Error('No authenticated user found')
      }

      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        provider: user.app_metadata?.provider,
      }
    } catch (error) {
      throw error
    }
  }
}
