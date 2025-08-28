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
