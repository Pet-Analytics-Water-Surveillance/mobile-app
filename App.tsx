import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import AppNavigator from './src/navigation/AppNavigator'

const queryClient = new QueryClient()

export default function App() {
  useEffect(() => {
    // Setup notifications
    setupNotifications()
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

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <AppNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
