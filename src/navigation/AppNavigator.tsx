import React, { useEffect, useState } from 'react'
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
} from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import AuthNavigator from './AuthNavigator'
import MainNavigator from './MainNavigator'
import { RootStackParamList } from './types'
import { useAppTheme } from '../theme'
import type { Session } from '@supabase/supabase-js'

const Stack = createStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useAppTheme()

  const navigationTheme = React.useMemo(() => {
    const baseTheme = theme.mode === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme
    return {
      ...baseTheme,
      dark: theme.mode === 'dark',
      colors: {
        ...baseTheme.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.card,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.primary,
      },
    }
  }, [theme])

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    // You can add a splash screen here
    return null
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
