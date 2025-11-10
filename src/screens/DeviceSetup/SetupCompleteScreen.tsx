import React, { useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'
import * as Animatable from 'react-native-animatable'

export default function SetupCompleteScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { deviceName } = route.params || {}
  
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

  useEffect(() => {
    // Disable back button since setup is complete
    navigation.setOptions({
      headerLeft: () => null,
      gestureEnabled: false,
    })
  }, [navigation])

  const handleDone = () => {
    // Navigate back to Settings root
    navigation.reset({
      index: 0,
      routes: [{ name: 'SettingsList' }],
    })
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Success Animation */}
        <Animatable.View animation="bounceIn" duration={1000} style={styles.iconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={64} color={theme.colors.success} />
          </View>
        </Animatable.View>

        {/* Success Message */}
        <Animatable.View animation="fadeInUp" delay={300} style={styles.messageContainer}>
          <Text style={styles.title}>Setup Complete! 🎉</Text>
          <Text style={styles.subtitle}>
            {deviceName || 'Your device'} has been successfully configured and connected to WiFi.
          </Text>
        </Animatable.View>

        {/* Info Cards */}
        <Animatable.View animation="fadeInUp" delay={600} style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="wifi" size={24} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Connected to WiFi</Text>
              <Text style={styles.infoText}>
                Device is now online and ready to detect your pets
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="cloud-done-outline" size={24} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Synced with Cloud</Text>
              <Text style={styles.infoText}>
                Real-time hydration tracking is active
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Notifications Enabled</Text>
              <Text style={styles.infoText}>
                You'll receive alerts when your pets drink water
              </Text>
            </View>
          </View>
        </Animatable.View>

        {/* Action Buttons */}
        <Animatable.View animation="fadeInUp" delay={900} style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Done</Text>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.onPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </SafeAreaView>
  )
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: 20,
      justifyContent: 'space-evenly',
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    successCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.success,
    },
    messageContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    infoSection: {
      marginBottom: 20,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoContent: {
      flex: 1,
      marginLeft: 15,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    buttonContainer: {
      gap: 12,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      gap: 10,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.overlay,
      paddingVertical: 16,
      borderRadius: 12,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  })
