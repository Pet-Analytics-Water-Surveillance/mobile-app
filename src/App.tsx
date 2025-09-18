import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from './navigation/types';
import AuthNavigator from './navigation/AuthNavigator';
import MainNavigator from './navigation/MainNavigator';
import { supabase } from './services/supabase';   // import your Supabase client

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error?.message?.includes('Invalid Refresh Token')) {
        // clear the broken token locally
        await supabase.auth.signOut({ scope: 'local' });
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(!!data.session);
    };

    checkSession();

    // also listen for changes in auth state
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Optionally: render nothing or a splash while checking
  if (isAuthenticated === null) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : (
            <Stack.Screen name="Main" component={MainNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}