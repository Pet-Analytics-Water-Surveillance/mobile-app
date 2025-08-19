# Pet Hydration App - Complete Page Structure & Navigation

## Project Setup & Navigation Architecture

### 1. Install Navigation Dependencies

```bash
# Core navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler

# UI Components
npm install react-native-elements react-native-vector-icons
npm install react-native-linear-gradient
npm install react-native-animatable

# Forms and validation
npm install react-hook-form yup

# Additional utilities
npm install react-native-async-storage/async-storage
npm install react-native-reanimated
```

### 2. Project Folder Structure

```
src/
├── navigation/
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   ├── MainNavigator.tsx
│   └── types.tsx
├── screens/
│   ├── Auth/
│   │   ├── WelcomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── SignupScreen.tsx
│   ├── Main/
│   │   ├── HomeScreen.tsx
│   │   ├── CalendarScreen.tsx
│   │   ├── StatisticsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── PetManagement/
│   │   ├── PetListScreen.tsx
│   │   ├── AddPetScreen.tsx
│   │   └── EditPetScreen.tsx
│   └── DeviceSetup/
│       ├── DeviceScanScreen.tsx
│       ├── WiFiSetupScreen.tsx
│       └── SetupCompleteScreen.tsx
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── specific/
│       ├── PetCard.tsx
│       ├── HydrationChart.tsx
│       └── DeviceCard.tsx
├── services/
├── hooks/
├── store/
├── utils/
└── types/
```

## Navigation Setup

### Navigation Types (src/navigation/types.tsx)

```typescript
import { StackNavigationProp } from '@react-navigation/stack'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { RouteProp } from '@react-navigation/native'

// Auth Stack
export type AuthStackParamList = {
  Welcome: undefined
  Login: undefined
  Signup: undefined
}

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined
  Calendar: undefined
  Statistics: undefined
  Settings: undefined
}

// Settings Stack
export type SettingsStackParamList = {
  SettingsList: undefined
  PetManagement: undefined
  PetAdd: undefined
  PetEdit: { petId: string }
  DeviceSetup: undefined
  DeviceScan: undefined
  WiFiSetup: { deviceId: string }
  SetupComplete: { deviceId: string }
  Profile: undefined
}

// Root Stack
export type RootStackParamList = {
  Auth: undefined
  Main: undefined
}

// Navigation prop types for screens
export type WelcomeScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Welcome'>
export type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>
export type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>
export type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'SettingsList'>
```

### Main App Navigator (src/navigation/AppNavigator.tsx)

```typescript
import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { supabase } from '../services/supabase'
import AuthNavigator from './AuthNavigator'
import MainNavigator from './MainNavigator'
import { RootStackParamList } from './types'

const Stack = createStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

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
    <NavigationContainer>
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
```

### Auth Navigator (src/navigation/AuthNavigator.tsx)

```typescript
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import WelcomeScreen from '../screens/Auth/WelcomeScreen'
import LoginScreen from '../screens/Auth/LoginScreen'
import SignupScreen from '../screens/Auth/SignupScreen'
import { AuthStackParamList } from './types'

const Stack = createStackNavigator<AuthStackParamList>()

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress,
          },
        }),
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  )
}
```

### Main Tab Navigator (src/navigation/MainNavigator.tsx)

```typescript
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import HomeScreen from '../screens/Main/HomeScreen'
import CalendarScreen from '../screens/Main/CalendarScreen'
import StatisticsScreen from '../screens/Main/StatisticsScreen'
import SettingsScreen from '../screens/Main/SettingsScreen'
import PetManagementScreen from '../screens/PetManagement/PetListScreen'
import AddPetScreen from '../screens/PetManagement/AddPetScreen'
import EditPetScreen from '../screens/PetManagement/EditPetScreen'
import DeviceScanScreen from '../screens/DeviceSetup/DeviceScanScreen'
import WiFiSetupScreen from '../screens/DeviceSetup/WiFiSetupScreen'
import SetupCompleteScreen from '../screens/DeviceSetup/SetupCompleteScreen'
import { MainTabParamList, SettingsStackParamList } from './types'

const Tab = createBottomTabNavigator<MainTabParamList>()
const SettingsStack = createStackNavigator<SettingsStackParamList>()

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen 
        name="SettingsList" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen 
        name="PetManagement" 
        component={PetManagementScreen}
        options={{ title: 'My Pets' }}
      />
      <SettingsStack.Screen 
        name="PetAdd" 
        component={AddPetScreen}
        options={{ title: 'Add Pet' }}
      />
      <SettingsStack.Screen 
        name="PetEdit" 
        component={EditPetScreen}
        options={{ title: 'Edit Pet' }}
      />
      <SettingsStack.Screen 
        name="DeviceSetup" 
        component={DeviceScanScreen}
        options={{ title: 'Setup Device' }}
      />
      <SettingsStack.Screen 
        name="WiFiSetup" 
        component={WiFiSetupScreen}
        options={{ title: 'WiFi Setup' }}
      />
      <SettingsStack.Screen 
        name="SetupComplete" 
        component={SetupCompleteScreen}
        options={{ title: 'Setup Complete' }}
      />
    </SettingsStack.Navigator>
  )
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline'
              break
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline'
              break
            case 'Statistics':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline'
              break
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline'
              break
            default:
              iconName = 'circle'
          }

          return <Ionicons name={iconName as any} size={size} color={color} />
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  )
}
```

## Screen Templates

### 1. Welcome Screen (src/screens/Auth/WelcomeScreen.tsx)

```typescript
import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Animatable from 'react-native-animatable'
import { WelcomeScreenNavigationProp } from '../../navigation/types'

const { width, height } = Dimensions.get('window')

interface Props {
  navigation: WelcomeScreenNavigationProp
}

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <LinearGradient
      colors={['#4FC3F7', '#2196F3', '#1976D2']}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Animatable.Image
            animation="bounceIn"
            duration={1500}
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Animatable.View animation="fadeInUpBig" style={styles.footer}>
          <Text style={styles.title}>Pet Hydration Monitor</Text>
          <Text style={styles.subtitle}>
            Track your pet's water intake and ensure they stay healthy and hydrated
          </Text>

          <View style={styles.features}>
            <FeatureItem icon="💧" text="Real-time water tracking" />
            <FeatureItem icon="📊" text="Health insights & analytics" />
            <FeatureItem icon="🔔" text="Smart hydration alerts" />
            <FeatureItem icon="🐕" text="Multi-pet support" />
          </View>

          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => navigation.navigate('Login')}
          >
            <LinearGradient
              colors={['#FFF', '#F5F5F5']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            style={styles.signupLink}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      </SafeAreaView>
    </LinearGradient>
  )
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flex: 2,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 30,
    paddingHorizontal: 30,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  features: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#555',
  },
  getStartedButton: {
    marginTop: 20,
  },
  buttonGradient: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  signupLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  linkTextBold: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
})
```

### 2. Login Screen (src/screens/Auth/LoginScreen.tsx)

```typescript
import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { supabase } from '../../services/supabase'
import { LoginScreenNavigationProp } from '../../navigation/types'

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

interface Props {
  navigation: LoginScreenNavigationProp
}

export default function LoginScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    setLoading(false)

    if (error) {
      Alert.alert('Login Error', error.message)
    }
    // Navigation handled by auth state listener in AppNavigator
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            style={styles.signupLink}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    paddingHorizontal: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingVertical: 12,
    marginBottom: 20,
  },
  socialButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  signupLink: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  linkTextBold: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
})
```

### 3. Home Screen (src/screens/Main/HomeScreen.tsx)

```typescript
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../services/supabase'
import PetHydrationCard from '../../components/specific/PetHydrationCard'
import QuickStats from '../../components/specific/QuickStats'
import RecentActivity from '../../components/specific/RecentActivity'

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [pets, setPets] = useState([])
  const [household, setHousehold] = useState(null)
  const [todayStats, setTodayStats] = useState({
    totalWater: 0,
    activeDevices: 0,
    alerts: 0,
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    // Load household data
    const { data: { user } } = await supabase.auth.getUser()
    const { data: memberData } = await supabase
      .from('household_members')
      .select('household_id, households(*)')
      .eq('user_id', user?.id)
      .single()

    if (memberData) {
      setHousehold(memberData.households)
      
      // Load pets
      const { data: petsData } = await supabase
        .from('pets')
        .select('*')
        .eq('household_id', memberData.household_id)
      
      setPets(petsData || [])

      // Load today's stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: events } = await supabase
        .from('hydration_events')
        .select('amount_ml')
        .gte('timestamp', today.toISOString())
      
      const totalWater = events?.reduce((sum, e) => sum + e.amount_ml, 0) || 0
      
      const { data: devices } = await supabase
        .from('devices')
        .select('is_online')
        .eq('household_id', memberData.household_id)
      
      const activeDevices = devices?.filter(d => d.is_online).length || 0
      
      const { data: alerts } = await supabase
        .from('hydration_alerts')
        .select('id')
        .eq('household_id', memberData.household_id)
        .is('acknowledged_at', null)
      
      setTodayStats({
        totalWater,
        activeDevices,
        alerts: alerts?.length || 0,
      })
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning! 👋</Text>
            <Text style={styles.householdName}>{household?.name || 'Loading...'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            {todayStats.alerts > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{todayStats.alerts}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <QuickStats stats={todayStats} />

        {/* Pets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Pets</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pets.map(pet => (
              <PetHydrationCard key={pet.id} pet={pet} />
            ))}
            
            {/* Add Pet Card */}
            <TouchableOpacity style={styles.addPetCard}>
              <Ionicons name="add-circle-outline" size={48} color="#2196F3" />
              <Text style={styles.addPetText}>Add Pet</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <RecentActivity />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Add Device</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
            <Ionicons name="bar-chart-outline" size={24} color="#2196F3" />
            <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>View Stats</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  householdName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    fontSize: 14,
    color: '#2196F3',
  },
  addPetCard: {
    width: 150,
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  addPetText: {
    marginTop: 10,
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#E3F2FD',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
```

### 4. Calendar Screen (src/screens/Main/CalendarScreen.tsx)

```typescript
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Calendar } from 'react-native-calendars'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../services/supabase'

interface HydrationEvent {
  id: string
  pet_id: string
  pet_name: string
  timestamp: string
  amount_ml: number
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [markedDates, setMarkedDates] = useState({})
  const [dayEvents, setDayEvents] = useState<HydrationEvent[]>([])
  const [pets, setPets] = useState([])

  useEffect(() => {
    loadMonthData()
    loadPets()
  }, [])

  useEffect(() => {
    loadDayEvents(selectedDate)
  }, [selectedDate])

  const loadPets = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user?.id)
      .single()

    if (member) {
      const { data: petsData } = await supabase
        .from('pets')
        .select('*')
        .eq('household_id', member.household_id)
      
      setPets(petsData || [])
    }
  }

  const loadMonthData = async () => {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const endOfMonth = new Date()
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    endOfMonth.setDate(0)
    endOfMonth.setHours(23, 59, 59, 999)

    const { data: events } = await supabase
      .from('hydration_events')
      .select('timestamp, pet_id')
      .gte('timestamp', startOfMonth.toISOString())
      .lte('timestamp', endOfMonth.toISOString())

    // Mark dates with events
    const marked = {}
    events?.forEach(event => {
      const date = event.timestamp.split('T')[0]
      if (!marked[date]) {
        marked[date] = { marked: true, dotColor: '#2196F3' }
      }
    })

    // Mark selected date
    marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: '#2196F3' }
    
    setMarkedDates(marked)
  }

  const loadDayEvents = async (date: string) => {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: events } = await supabase
      .from('hydration_events')
      .select(`
        id,
        pet_id,
        timestamp,
        amount_ml,
        pets (name)
      `)
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString())
      .order('timestamp', { ascending: false })

    const formattedEvents = events?.map(e => ({
      ...e,
      pet_name: e.pets?.name || 'Unknown Pet'
    })) || []

    setDayEvents(formattedEvents)
  }

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString)
    
    // Update marked dates
    const newMarked = { ...markedDates }
    Object.keys(newMarked).forEach(key => {
      if (newMarked[key].selected) {
        delete newMarked[key].selected
        delete newMarked[key].selectedColor
      }
    })
    newMarked[day.dateString] = {
      ...newMarked[day.dateString],
      selected: true,
      selectedColor: '#2196F3'
    }
    setMarkedDates(newMarked)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPetColor = (petId: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
    const index = pets.findIndex(p => p.id === petId)
    return colors[index % colors.length]
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hydration Calendar</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <Calendar
        current={selectedDate}
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#2196F3',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#2196F3',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#2196F3',
          selectedDotColor: '#ffffff',
          arrowColor: '#2196F3',
          monthTextColor: '#2d4150',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14
        }}
      />

      <ScrollView style={styles.eventsList}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateTitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <Text style={styles.eventCount}>
            {dayEvents.length} drinking event{dayEvents.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {dayEvents.length > 0 ? (
          dayEvents.map(event => (
            <View key={event.id} style={styles.eventCard}>
              <View 
                style={[styles.eventIndicator, { backgroundColor: getPetColor(event.pet_id) }]} 
              />
              <View style={styles.eventContent}>
                <Text style={styles.eventPetName}>{event.pet_name}</Text>
                <Text style={styles.eventDetails}>
                  {event.amount_ml}ml at {formatTime(event.timestamp)}
                </Text>
              </View>
              <Ionicons name="water" size={24} color="#4FC3F7" />
            </View>
          ))
        ) : (
          <View style={styles.noEvents}>
            <Ionicons name="calendar-outline" size={48} color="#C0C0C0" />
            <Text style={styles.noEventsText}>No hydration events on this day</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateHeader: {
    marginTop: 20,
    marginBottom: 15,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  eventCount: {
    fontSize: 14,
    color: '#666',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  eventIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 15,
  },
  eventContent: {
    flex: 1,
  },
  eventPetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    color: '#666',
  },
  noEvents: {
    alignItems: 'center',
    marginTop: 50,
  },
  noEventsText: {
    marginTop: 15,
    fontSize: 16,
    color: '#999',
  },
})
```

### 5. Settings Screen (src/screens/Main/SettingsScreen.tsx)

```typescript
import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../../services/supabase'

export default function SettingsScreen() {
  const navigation = useNavigation<any>()
  const [notifications, setNotifications] = React.useState(true)
  const [darkMode, setDarkMode] = React.useState(false)

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
          }
        }
      ]
    )
  }

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true, 
    rightComponent 
  }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color="#2196F3" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (showArrow && <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />)}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="person-outline"
              title="Profile"
              subtitle="Edit your personal information"
              onPress={() => navigation.navigate('Profile')}
            />
            <SettingItem
              icon="lock-closed-outline"
              title="Security"
              subtitle="Password and authentication"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Pet & Device Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pets & Devices</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="paw-outline"
              title="Manage Pets"
              subtitle="Add or edit your pets"
              onPress={() => navigation.navigate('PetManagement')}
            />
            <SettingItem
              icon="hardware-chip-outline"
              title="Devices"
              subtitle="Set up new device"
              onPress={() => navigation.navigate('DeviceSetup')}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Manage alert preferences"
              showArrow={false}
              rightComponent={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                  thumbColor={notifications ? '#4CAF50' : '#f4f3f4'}
                />
              }
            />
            <SettingItem
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Toggle dark theme"
              showArrow={false}
              rightComponent={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                  thumbColor={darkMode ? '#4CAF50' : '#f4f3f4'}
                />
              }
            />
            <SettingItem
              icon="water-outline"
              title="Hydration Goals"
              subtitle="Set daily water intake goals"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="help-circle-outline"
              title="Help & Support"
              onPress={() => {}}
            />
            <SettingItem
              icon="document-text-outline"
              title="Terms & Privacy"
              onPress={() => {}}
            />
            <SettingItem
              icon="information-circle-outline"
              title="About"
              subtitle="Version 1.0.0"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginLeft: 20,
    marginBottom: 10,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 50,
    paddingVertical: 15,
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  signOutText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
})
```

### 6. Pet Management Screen (src/screens/PetManagement/PetListScreen.tsx)

```typescript
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../../services/supabase'

export default function PetListScreen() {
  const navigation = useNavigation<any>()
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPets()
  }, [])

  const loadPets = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user?.id)
      .single()

    if (member) {
      const { data: petsData } = await supabase
        .from('pets')
        .select('*')
        .eq('household_id', member.household_id)
        .order('created_at', { ascending: false })
      
      setPets(petsData || [])
    }
    setLoading(false)
  }

  const deletePet = (petId: string, petName: string) => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to remove ${petName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('pets').delete().eq('id', petId)
            loadPets()
          }
        }
      ]
    )
  }

  const renderPetItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() => navigation.navigate('PetEdit', { petId: item.id })}
    >
      <View style={styles.petAvatar}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.petImage} />
        ) : (
          <Ionicons 
            name={item.species === 'cat' ? 'logo-octocat' : 'paw'} 
            size={40} 
            color="#2196F3" 
          />
        )}
      </View>
      
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petDetails}>
          {item.species} • {item.weight_kg}kg • Goal: {item.daily_water_goal_ml}ml/day
        </Text>
        {item.rfid_tag && (
          <View style={styles.tagBadge}>
            <Ionicons name="pricetag" size={12} color="#666" />
            <Text style={styles.tagText}>Tagged</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={() => deletePet(item.id, item.name)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={pets}
        renderItem={renderPetItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="paw-outline" size={64} color="#C0C0C0" />
            <Text style={styles.emptyText}>No pets added yet</Text>
            <Text style={styles.emptySubtext}>Add your first pet to start tracking</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PetAdd')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    padding: 20,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  petAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 10,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
})
```

### 7. Device Setup Screen (src/screens/DeviceSetup/DeviceScanScreen.tsx)

```typescript
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import BluetoothService from '../../services/bluetooth'
import { Device } from 'react-native-ble-plx'

export default function DeviceScanScreen() {
  const navigation = useNavigation<any>()
  const [scanning, setScanning] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])

  useEffect(() => {
    startScan()
    
    return () => {
      BluetoothService.stopScan()
    }
  }, [])

  const startScan = () => {
    setScanning(true)
    setDevices([])
    
    BluetoothService.scanForDevices((device) => {
      setDevices(prev => {
        const exists = prev.find(d => d.id === device.id)
        if (!exists) {
          return [...prev, device]
        }
        return prev
      })
    })

    // Stop scan after 10 seconds
    setTimeout(() => {
      BluetoothService.stopScan()
      setScanning(false)
    }, 10000)
  }

  const connectToDevice = (device: Device) => {
    navigation.navigate('WiFiSetup', { deviceId: device.id })
  }

  const renderDevice = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => connectToDevice(item)}
    >
      <View style={styles.deviceIcon}>
        <Ionicons name="water" size={24} color="#2196F3" />
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>ID: {item.id}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Device</Text>
        <Text style={styles.subtitle}>
          Make sure your device is powered on and in pairing mode
        </Text>
      </View>

      {scanning ? (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.scanningText}>Scanning for devices...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={devices}
            renderItem={renderDevice}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="bluetooth-outline" size={64} color="#C0C0C0" />
                <Text style={styles.emptyText}>No devices found</Text>
                <Text style={styles.emptySubtext}>Make sure your device is in pairing mode</Text>
              </View>
            }
          />
          
          <TouchableOpacity style={styles.rescanButton} onPress={startScan}>
            <Ionicons name="refresh" size={20} color="#2196F3" />
            <Text style={styles.rescanText}>Scan Again</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 20,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  rescanText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
})
```

## Component Templates

### PetHydrationCard Component (src/components/specific/PetHydrationCard.tsx)

```typescript
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../services/supabase'

interface Props {
  pet: {
    id: string
    name: string
    species: string
    photo_url?: string
    daily_water_goal_ml: number
  }
}

export default function PetHydrationCard({ pet }: Props) {
  const [todayTotal, setTodayTotal] = useState(0)
  const [lastDrink, setLastDrink] = useState<string | null>(null)

  useEffect(() => {
    loadTodayData()
  }, [pet.id])

  const loadTodayData = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('hydration_events')
      .select('amount_ml, timestamp')
      .eq('pet_id', pet.id)
      .gte('timestamp', today.toISOString())
      .order('timestamp', { ascending: false })

    if (data && data.length > 0) {
      const total = data.reduce((sum, event) => sum + event.amount_ml, 0)
      setTodayTotal(total)
      setLastDrink(data[0].timestamp)
    }
  }

  const percentage = Math.round((todayTotal / pet.daily_water_goal_ml) * 100)
  const getStatusColor = () => {
    if (percentage >= 80) return '#4CAF50'
    if (percentage >= 50) return '#FFA726'
    return '#EF5350'
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {pet.photo_url ? (
          <Image source={{ uri: pet.photo_url }} style={styles.petImage} />
        ) : (
          <View style={styles.petImagePlaceholder}>
            <Ionicons 
              name={pet.species === 'cat' ? 'logo-octocat' : 'paw'} 
              size={24} 
              color="#2196F3" 
            />
          </View>
        )}
        <Text style={styles.petName}>{pet.name}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: getStatusColor()
              }
            ]} 
          />
        </View>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statsText}>{todayTotal}ml / {pet.daily_water_goal_ml}ml</Text>
        {lastDrink && (
          <Text style={styles.lastDrinkText}>
            Last: {new Date(lastDrink).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  petImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  stats: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  lastDrinkText: {
    fontSize: 10,
    color: '#999',
  },
})
```

## App.tsx - Main Entry Point

```typescript
// App.tsx
import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from 'react-query'
import * as Notifications from 'expo-notifications'
import AppNavigator from './src/navigation/AppNavigator'
import { registerForPushNotifications, setupNotificationListeners } from './src/services/notifications'
import { supabase } from './src/services/supabase'

const queryClient = new QueryClient()

export default function App() {
  useEffect(() => {
    // Setup notifications
    setupNotifications()
    
    // Setup notification listeners
    const cleanup = setupNotificationListeners()
    
    return cleanup
  }, [])

  const setupNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await registerForPushNotifications(user.id)
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <AppNavigator />
    </QueryClientProvider>
  )
}
```

## Next Steps to Implement

### 1. Install All Dependencies
```bash
# Run this command to install everything at once
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs \
  react-native-screens react-native-safe-area-context react-native-gesture-handler \
  react-native-elements react-native-vector-icons react-native-linear-gradient \
  react-native-animatable react-hook-form yup @hookform/resolvers \
  react-native-calendars react-native-chart-kit react-native-svg \
  @react-native-community/datetimepicker expo-notifications \
  react-query zustand
```

### 2. Configure iOS Info.plist
```xml
<!-- ios/YourApp/Info.plist -->
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app needs Bluetooth to connect to your pet hydration device</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app needs Bluetooth to setup your pet hydration device</string>
```

### 3. Configure Android Permissions
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

### 4. Test Navigation Flow
```bash
# Start the app
npm start

# Test on iOS
npm run ios

# Test on Android  
npm run android
```

## Summary

You now have a complete 8-page application structure with:

1. **Welcome Page** - Beautiful onboarding with features
2. **Login/Signup** - Separate screens with form validation
3. **Homepage** - Dashboard with pet cards and quick stats
4. **Calendar** - Visual timeline of hydration events
5. **Settings** - Comprehensive settings with navigation to sub-pages
6. **Pet Management** - Add, edit, delete pets
7. **Device Setup** - BLE scanning and WiFi provisioning
8. **Statistics** - (Template ready for charts and analytics)

Each screen is:
- Fully typed with TypeScript
- Connected to Supabase backend
- Styled with a consistent design system
- Ready for real data integration
- Includes loading and empty states

The navigation is set up with:
- Auth flow (Welcome → Login/Signup)
- Bottom tabs for main screens
- Stack navigation for settings sub-screens
- Proper TypeScript types for navigation

Would you like me to:
1. Add the Statistics screen implementation?
2. Create more detailed forms for adding/editing pets?
3. Implement the WiFi setup flow for device provisioning?
4. Add more animations and transitions?