import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { TouchableOpacity } from 'react-native'
import HomeScreen from '../screens/Main/HomeScreen'
import CalendarScreen from '../screens/Main/CalendarScreen'
import StatisticsScreen from '../screens/Main/StatisticsScreen'
import SettingsScreen from '../screens/Main/SettingsScreen'
import PetManagementScreen from '../screens/PetManagement/PetListScreen'
import AddPetScreen from '../screens/PetManagement/AddPetScreen'
import EditPetScreen from '../screens/PetManagement/EditPetScreen'
import TrainAIScreen from '../screens/PetManagement/TrainAIScreen'
import DeviceScanScreen from '../screens/DeviceSetup/DeviceScanScreen'
import WiFiSetupScreen from '../screens/DeviceSetup/WiFiSetupScreen'
import SetupCompleteScreen from '../screens/DeviceSetup/SetupCompleteScreen'
import DeviceListScreen from '../screens/DeviceSetup/DeviceListScreen'
import { MainTabParamList, SettingsStackParamList } from './types'
import AccountProfile from '../screens/Settings/AccountProfile'
import HouseholdInvites from '../screens/Settings/HouseholdInvites'
import AboutScreen from '../screens/Settings/AboutScreen'
import HelpSupportScreen from '../screens/Settings/HelpSupportScreen'
import TermsPolicyScreen from '../screens/Settings/TermsPolicyScreen'
import SecurityScreen from '../screens/Settings/SecurityScreen'
import { useAppTheme } from '../theme'


const Tab = createBottomTabNavigator<MainTabParamList>()
const SettingsStack = createStackNavigator<SettingsStackParamList>()

function SettingsNavigator() {
  const { theme } = useAppTheme()

  const headerOptions = React.useMemo(
    () => ({
      headerStyle: {
        backgroundColor: theme.colors.card,
        shadowColor: 'transparent',
        borderBottomWidth: 0,
      },
      headerTintColor: theme.colors.text,
      headerTitleStyle: {
        color: theme.colors.text,
      },
      headerBackTitleVisible: false,
    }),
    [theme]
  )

  return (
    <SettingsStack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <SettingsStack.Screen 
        name="SettingsList" 
        component={SettingsScreen}
        options={{ title: 'Settings', headerShown: false }}
      />
      <SettingsStack.Screen 
        name="Profile"
        component={AccountProfile}
        options={{ title: 'Profile' }}
      />
      <SettingsStack.Screen 
        name="Security"
        component={SecurityScreen}
        options={{ title: 'Security' }}
      />
      <SettingsStack.Screen 
        name="HouseholdInvites"
        component={HouseholdInvites}
        options={{ title: 'Household Invites' }}
      />
      <SettingsStack.Screen 
        name="TermsPolicy"
        component={TermsPolicyScreen}
        options={{ title: 'Terms & Privacy' }}
      />
      <SettingsStack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ title: 'Help & Support' }}
      />
      <SettingsStack.Screen 
        name="About"
        component={AboutScreen}
        options={{ title: 'About Team P.A.W.S' }}
      />
      <SettingsStack.Screen 
        name="PetManagement" 
        component={PetManagementScreen}
        options={{ title: 'My Pets' }}
      />
      <SettingsStack.Screen 
        name="PetAdd" 
        component={AddPetScreen}
        options={({ navigation, route }) => ({
          title: 'Add Pet',
          headerLeft: () => (
            <TouchableOpacity
              style={{ paddingHorizontal: 10 }}
              onPress={() => {
                const fromHome = (route.params as any)?.fromHome
                if (fromHome) {
                  // If opened from Home, reset Settings stack to root
                  // then switch back to Home tab
                  navigation.reset({ index: 0, routes: [{ name: 'SettingsList' }] })
                  const parent = navigation.getParent() as any
                  parent?.navigate('Home')
                } else if (navigation.canGoBack()) {
                  navigation.goBack()
                } else {
                  navigation.navigate('SettingsList')
                }
              }}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          ),
        })}
      />
      <SettingsStack.Screen 
        name="PetEdit" 
        component={EditPetScreen}
        options={{ title: 'Edit Pet' }}
      />
      <SettingsStack.Screen 
        name="TrainAI" 
        component={TrainAIScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen 
        name="DeviceSetup" 
        component={DeviceScanScreen}
        options={{ 
          headerShown: false,
          title: 'Setup Device',
        }}
      />
      <SettingsStack.Screen 
        name="WiFiSetup" 
        component={WiFiSetupScreen}
        options={{ title: 'WiFi Setup' }}
      />
      <SettingsStack.Screen 
        name="SetupComplete" 
        component={SetupCompleteScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen 
        name="DeviceList" 
        component={DeviceListScreen}
        options={{ headerShown: false }}
      />
    </SettingsStack.Navigator>
  )
}

export default function MainNavigator() {
  const { theme } = useAppTheme()

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
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.tabBarBorder,
        },
        tabBarLabelStyle: {
          fontWeight: '500',
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  )
}
