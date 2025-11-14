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
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

export default function SettingsScreen() {
  const navigation = useNavigation<any>()
  const [notifications, setNotifications] = React.useState(true)
  const { isDarkMode, toggleThemeMode, theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

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
    rightComponent,
  }: any) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress} 
      activeOpacity={0.8}
      disabled={!onPress || !!rightComponent}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent ||
        (showArrow && (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
        ))}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              onPress={() => navigation.navigate('Security')}
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
              title="My Devices"
              subtitle="View and manage devices"
              onPress={() => navigation.navigate('DeviceList')}
            />
            <SettingItem
              icon="add-circle-outline"
              title="Add Device"
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
                  trackColor={{ false: theme.colors.border, true: theme.colors.switchTrack }}
                  thumbColor={notifications ? theme.colors.switchThumb : theme.colors.surface}
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
                  value={isDarkMode}
                  onValueChange={toggleThemeMode}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.switchTrack,
                  }}
                  thumbColor={isDarkMode ? theme.colors.switchThumb : theme.colors.surface}
                />
              }
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
              onPress={() => navigation.navigate('HelpSupport')}
            />
            <SettingItem
              icon="document-text-outline"
              title="Terms & Privacy"
              onPress={() => navigation.navigate('TermsPolicy')}
            />
            <SettingItem
              icon="information-circle-outline"
              title="About"
              subtitle="Version 1.0.0"
              onPress={() => navigation.navigate('About')}
            />
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      //backgroundColor: theme.colors.surface,
    },
    title: {
      fontSize: 34,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    section: {
      marginTop: 30,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.muted,
      textTransform: 'uppercase',
      marginLeft: 20,
      marginBottom: 10,
    },
    sectionContent: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.surface,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 30,
      marginBottom: 50,
      paddingVertical: 15,
      marginHorizontal: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.danger,
    },
    signOutText: {
      marginLeft: 10,
      fontSize: 16,
      color: theme.colors.danger,
      fontWeight: '600',
    },
  })
