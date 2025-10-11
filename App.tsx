import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import AppNavigator from './src/navigation/AppNavigator'
import { ThemeProvider, useAppTheme } from './src/theme'

const queryClient = new QueryClient()

export default function App() {
  useEffect(() => {
    setupNotifications()
  }, [])

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') {
      console.log('Notification permissions not granted')
      return
    }

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
