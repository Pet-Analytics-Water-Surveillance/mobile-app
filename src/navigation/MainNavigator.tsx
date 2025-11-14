import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import {
  TouchableOpacity,
  Platform,
  View,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import HomeScreen from "../screens/Main/HomeScreen";
import CalendarScreen from "../screens/Main/CalendarScreen";
import StatisticsScreen from "../screens/Main/StatisticsScreen";
import SettingsScreen from "../screens/Main/SettingsScreen";
import AlertsScreen from "../screens/Main/AlertsScreen";
import PetManagementScreen from "../screens/PetManagement/PetListScreen";
import AddPetScreen from "../screens/PetManagement/AddPetScreen";
import EditPetScreen from "../screens/PetManagement/EditPetScreen";
import TrainAIScreen from "../screens/PetManagement/TrainAIScreen";
import DeviceScanScreen from "../screens/DeviceSetup/DeviceScanScreen";
import WiFiSetupScreen from "../screens/DeviceSetup/WiFiSetupScreen";
import SetupCompleteScreen from "../screens/DeviceSetup/SetupCompleteScreen";
import DeviceListScreen from "../screens/DeviceSetup/DeviceListScreen";
import {
  MainTabParamList,
  MainStackParamList,
  SettingsStackParamList,
} from "./types";
import AccountProfile from "../screens/Settings/AccountProfile";
import HouseholdInvites from "../screens/Settings/HouseholdInvites";
import AboutScreen from "../screens/Settings/AboutScreen";
import HelpSupportScreen from "../screens/Settings/HelpSupportScreen";
import TermsPolicyScreen from "../screens/Settings/TermsPolicyScreen";
import SecurityScreen from "../screens/Settings/SecurityScreen";
import { useAppTheme } from "../theme";

const Tab = createBottomTabNavigator<MainTabParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

function SettingsNavigator() {
  const { theme } = useAppTheme();

  const headerOptions = React.useMemo(
    () => ({
      headerStyle: {
        backgroundColor: theme.colors.card,
        shadowColor: "transparent",
        borderBottomWidth: 0,
      },
      headerTintColor: theme.colors.text,
      headerTitleStyle: {
        color: theme.colors.text,
      },
      headerBackTitleVisible: false,
      headerBackTitle: '',
    }),
    [theme],
  );

  return (
    <SettingsStack.Navigator
      screenOptions={{ ...headerOptions, headerShown: true }}
    >
      <SettingsStack.Screen
        name="SettingsList"
        component={SettingsScreen}
        options={{ title: "Settings", headerShown: false }}
      />
      <SettingsStack.Screen
        name="Profile"
        component={AccountProfile}
        options={{ title: "Profile" }}
      />
      <SettingsStack.Screen
        name="Security"
        component={SecurityScreen}
        options={{ title: "Security" }}
      />
      <SettingsStack.Screen
        name="HouseholdInvites"
        component={HouseholdInvites}
        options={{ title: "Household Invites" }}
      />
      <SettingsStack.Screen
        name="TermsPolicy"
        component={TermsPolicyScreen}
        options={{ title: "Terms & Privacy" }}
      />
      <SettingsStack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ title: "Help & Support" }}
      />
      <SettingsStack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: "About Team P.A.W.S" }}
      />
      <SettingsStack.Screen
        name="PetManagement"
        component={PetManagementScreen}
        options={({ navigation, route }) => ({
          title: "My Pets",
          headerLeft: () => (
            <TouchableOpacity
              style={{ paddingHorizontal: 10 }}
              onPress={() => {
                // Reset Settings stack to SettingsList first
                navigation.reset({
                  index: 0,
                  routes: [{ name: "SettingsList" }],
                });
                // Then navigate to Home tab
                const parent = navigation.getParent() as any;
                parent?.navigate("Home");
              }}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          ),
        })}
      />
      <SettingsStack.Screen
        name="PetAdd"
        component={AddPetScreen}
        options={({ navigation, route }) => ({
          title: "Add Pet",
          headerLeft: () => (
            <TouchableOpacity
              style={{ paddingHorizontal: 10 }}
              onPress={() => {
                const fromHome = (route.params as any)?.fromHome;
                if (fromHome) {
                  // If opened from Home, reset Settings stack to root
                  // then switch back to Home tab
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "SettingsList" }],
                  });
                  const parent = navigation.getParent() as any;
                  parent?.navigate("Home");
                } else if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate("SettingsList");
                }
              }}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          ),
        })}
      />
      <SettingsStack.Screen
        name="PetEdit"
        component={EditPetScreen}
        options={{ title: "Edit Pet" }}
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
          title: "Setup Device",
        }}
      />
      <SettingsStack.Screen
        name="WiFiSetup"
        component={WiFiSetupScreen}
        options={{ title: "WiFi Setup" }}
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
  );
}

// Custom Tab Bar with sliding indicator
function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme, isDarkMode } = useAppTheme();
  const { width } = Dimensions.get("window");
  const tabWidth = (width - 40) / state.routes.length; // 40 is total horizontal margin
  const translateX = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View style={customTabBarStyles.container}>
      {/* BlurView as background */}
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={100}
          tint={isDarkMode ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {/* Background color overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor:
              Platform.OS === "ios"
                ? isDarkMode
                  ? "rgba(30, 30, 30, 0.5)"
                  : "rgba(240, 240, 245, 0.8)"
                : theme.colors.tabBarBackground,
            borderRadius: 32,
          },
        ]}
      />

      {/* Sliding indicator */}
      <Animated.View
        style={[
          customTabBarStyles.indicator,
          {
            width: 66,
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
            transform: [
              { translateX: Animated.add(translateX, (tabWidth - 66) / 2) },
            ],
          },
        ]}
      />

      {/* Tab buttons */}
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName: string;
        switch (route.name) {
          case "Home":
            iconName = isFocused ? "home" : "home-outline";
            break;
          case "Calendar":
            iconName = isFocused ? "calendar" : "calendar-outline";
            break;
          case "Statistics":
            iconName = isFocused ? "stats-chart" : "stats-chart-outline";
            break;
          case "Settings":
            iconName = isFocused ? "settings" : "settings-outline";
            break;
          default:
            iconName = "circle";
        }

        return (
          <CustomTabBarButton
            key={route.key}
            onPress={onPress}
            isFocused={isFocused}
            iconName={iconName}
            label={options.tabBarLabel || route.name}
            theme={theme}
          />
        );
      })}
    </View>
  );
}

// Custom Tab Bar Button with animation
function CustomTabBarButton({
  onPress,
  isFocused,
  iconName,
  label,
  theme,
}: any) {
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const translateY = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: isFocused ? 1.05 : 1,
        useNativeDriver: true,
        friction: 5,
      }),
      Animated.spring(translateY, {
        toValue: isFocused ? -2 : 0,
        useNativeDriver: true,
        friction: 5,
      }),
    ]).start();
  }, [isFocused]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={tabButtonStyles.container}
    >
      <Animated.View
        style={[
          tabButtonStyles.iconContainer,
          {
            transform: [{ scale: scaleValue }, { translateY }],
          },
        ]}
      >
        <Ionicons
          name={iconName as any}
          size={24}
          color={isFocused ? theme.colors.primary : theme.colors.muted}
        />
        <Animated.Text
          style={[
            tabButtonStyles.label,
            {
              color: isFocused ? theme.colors.primary : theme.colors.muted,
            },
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const customTabBarStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 32,
    height: 65,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
    borderRadius: 32,
  },
  indicator: {
    position: "absolute",
    height: 50,
    borderRadius: 32,
    top: 7.5,
  },
});

const tabButtonStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});

function TabNavigator() {
  const { theme, isDarkMode } = useAppTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />
      <Tab.Screen 
        name="Settings" 
        component={SettingsNavigator}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            // Get the state of the Settings navigator
            const state = (route as any).state;
            
            // If we're not on the first screen (SettingsList), reset to it
            if (state && state.index > 0) {
              e.preventDefault();
              navigation.navigate('Settings', {
                screen: 'SettingsList',
              });
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={TabNavigator} />
      <MainStack.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          presentation: "modal",
        }}
      />
    </MainStack.Navigator>
  );
}
