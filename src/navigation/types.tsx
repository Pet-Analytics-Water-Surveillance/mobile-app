import { StackNavigationProp } from '@react-navigation/stack'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { RouteProp, NavigatorScreenParams } from '@react-navigation/native'

// Auth Stack
export type AuthStackParamList = {
  Welcome: undefined
  Login: undefined
  Signup: undefined
  EmailVerification: { email: string }
}

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined
  Calendar: undefined
  Statistics: undefined
  Settings: NavigatorScreenParams<SettingsStackParamList>
}

// Settings Stack
export type SettingsStackParamList = {
  SettingsList: undefined
  PetManagement: undefined
  PetAdd: { fromHome?: boolean } | undefined
  PetEdit: { petId: string }
  DeviceSetup: { fromHome?: boolean } | undefined
  DeviceScan: undefined
  DeviceList: undefined
  WiFiSetup: { deviceId: string; deviceName?: string }
  SetupComplete: { deviceId: string; deviceName?: string }
  Profile: undefined
  HouseholdInvites: undefined
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
export type AccountProfileNavigationProp = StackNavigationProp<SettingsStackParamList, 'Profile'>
