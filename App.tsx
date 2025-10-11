import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Linking, Alert } from 'react-native'
import * as Notifications from 'expo-notifications'
import AppNavigator from './src/navigation/AppNavigator'
import { supabase } from './src/services/supabase'
import { EmailVerificationService } from './src/services/EmailVerificationService'
import { GoogleAuthService } from './src/services/GoogleAuthService'

const queryClient = new QueryClient()

export default function App() {
  useEffect(() => {
    // Setup notifications
    setupNotifications()
    
    // Setup deep linking for email verification
    setupDeepLinking()
  }, [])

  const setupNotifications = async () => {
    // Request notification permissions
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') {
      console.log('Notification permissions not granted')
      return
    }

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })
  }

  const setupDeepLinking = () => {
    // Handle deep link when app opens from email verification
    const handleDeepLink = async (url: string) => {
      console.log('📧 Deep link received:', url)
      
      if (url.includes('paws://auth/callback')) {
        try {
          // Check if this is a Google OAuth callback or email verification
          if (url.includes('access_token') || url.includes('code')) {
            // This is likely a Google OAuth callback
            const result = await GoogleAuthService.handleOAuthCallback(url)
            
            if (result.success) {
              console.log('✅ Google sign-in successful!')
              Alert.alert(
                'Welcome!', 
                'You have successfully signed in with Google!',
                [{ text: 'Continue', style: 'default' }]
              )
            } else {
              console.error('❌ Google OAuth failed:', result.error)
              Alert.alert(
                'Sign In Failed', 
                result.error || 'There was an error signing in with Google. Please try again.'
              )
            }
          } else {
            // This is likely an email verification callback
            const result = await EmailVerificationService.handleEmailVerification(url)
            
            if (result.success) {
              console.log('✅ Email verification successful!')
              Alert.alert(
                'Email Verified!', 
                'Your email has been successfully verified. Welcome to PAWS!',
                [{ text: 'Continue', style: 'default' }]
              )
            } else {
              console.error('❌ Email verification failed:', result.error)
              Alert.alert(
                'Verification Failed', 
                result.error || 'There was an error verifying your email. Please try again or contact support.'
              )
            }
          }
        } catch (error) {
          console.error('❌ Deep link processing error:', error)
          Alert.alert(
            'Authentication Error', 
            'Unable to process authentication. Please try again.'
          )
        }
      }
    }

    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url)
    })

    // Check if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url)
      }
    })

    // Cleanup subscription
    return () => subscription?.remove()
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <AppNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
