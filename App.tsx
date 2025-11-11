import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Linking, Alert } from 'react-native'
import AppNavigator from './src/navigation/AppNavigator'
import { ThemeProvider, useAppTheme } from './src/theme'
import { supabase } from './src/services/supabase'
import { EmailVerificationService } from './src/services/EmailVerificationService'
import { GoogleAuthService } from './src/services/GoogleAuthService'
import { notificationService } from './src/services/NotificationService'

const queryClient = new QueryClient()

export default function App() {
  useEffect(() => {
    // Initialize notification service
    setupNotifications()
    
    // Setup deep linking for email verification
    setupDeepLinking()
  }, [])

  const setupNotifications = async () => {
    try {
      // Initialize the notification service
      await notificationService.initialize()

      // Add listener for when notifications are received while app is foregrounded
      const notificationListener = notificationService.addNotificationReceivedListener(
        (notification) => {
          console.log('📬 Notification received (foreground):', notification)
        }
      )

      // Add listener for when user taps on a notification
      const responseListener = notificationService.addNotificationResponseListener(
        (response) => {
          console.log('📬 Notification tapped:', response)
          const data = response.notification.request.content.data

          // Handle different notification types
          if (data.type === 'hydration_event' && data.petId) {
            // TODO: Navigate to pet details screen
            console.log('Navigate to pet:', data.petId)
          } else if (data.type === 'low_water_alert') {
            // TODO: Navigate to devices screen
            console.log('Navigate to devices')
          }
        }
      )

      // Cleanup listeners on unmount
      return () => {
        notificationListener.remove()
        responseListener.remove()
      }
    } catch (error) {
      console.error('Error setting up notifications:', error)
    }
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
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ThemedApp />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

function ThemedApp() {
  const { theme } = useAppTheme()

  return (
    <>
      <StatusBar style={theme.statusBarStyle} backgroundColor="transparent" />
      <AppNavigator />
    </>
  )
}
