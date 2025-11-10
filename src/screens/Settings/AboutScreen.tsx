import React from 'react'
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

const TEAM_FEATURES = [
  'Custom YOLOv8 AI model for pet identification',
  'ESP32 and Raspberry Pi Zero W integration',
  'Professional PCB design under $100',
] as const

const LOGO = require('../../../assets/icon.png')

export default function AboutScreen() {
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)
  const { width } = useWindowDimensions()
  const isWideLayout = width >= 768

  const gradientColors = React.useMemo<[string, string]>(
    () =>
      theme.mode === 'dark'
        ? [theme.colors.gradientStart, theme.colors.gradientEnd]
        : ['rgba(79,195,247,0.16)', 'rgba(25,118,210,0.05)'],
    [theme]
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        scrollIndicatorInsets={{ top: 0, bottom: 0 }}
        contentInset={{ top: 0, bottom: 0 }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Smart Pet Bowl</Text>
          </View>
          <Text style={styles.heroTitle}>About Team P.A.W.S</Text>
          <Text style={styles.heroSubtitle}>
            Pet Hydration Analytics & Wellness System
          </Text>
        </LinearGradient>

        <View
          style={[
            styles.overviewCard,
            isWideLayout && styles.overviewCardWide,
          ]}
        >
          <View style={styles.overviewContent}>
            <Text style={styles.sectionHeading}>Our Story</Text>
            <Text style={styles.paragraph}>
              Developed by Team P.A.W.S (ECE Team 5) at San Diego State
              University's College of Engineering for the EE/COMPE 491W
              Senior Design course, sponsored by Dr. Hidenori Yamada.
            </Text>
            <Text style={styles.paragraph}>
              Our interdisciplinary team combines Computer Engineering expertise
              (Tri Bui, Abdulmohsen Almunayes) with Electrical Engineering
              knowledge (Ehren Abeto, Brandon Lord, Zachary Xavier Encarnacion)
              to create this innovative pet health monitoring solution.
            </Text>
          </View>
          <View style={styles.logoWrapper}>
            <Image
              source={LOGO}
              style={[styles.logo, isWideLayout && styles.logoWide]}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.sectionHeading}>{"What We're Building"}</Text>
          {TEAM_FEATURES.map((item) => (
            <View key={item} style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={theme.colors.success}
              />
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 15,
      paddingBottom: 24,
      gap: 20,
    },
    heroCard: {
      borderRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 24,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.mode === 'dark'
        ? theme.colors.overlay
        : 'rgba(255,255,255,0.6)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 12,
    },
    heroBadgeText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      maxWidth: 320,
    },
    overviewCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 24,
      flexDirection: 'column',
      gap: 24,
      borderWidth: theme.mode === 'dark' ? 1 : 0,
      borderColor: theme.colors.border,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
      elevation: theme.mode === 'dark' ? 0 : 4,
    },
    overviewCardWide: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    overviewContent: {
      flex: 1,
      gap: 12,
    },
    sectionHeading: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    paragraph: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
    },
    logoWrapper: {
      alignItems: 'center',
    },
    logo: {
      width: 120,
      height: 120,
    },
    logoWide: {
      width: 160,
      height: 160,
    },
    featureCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 24,
      gap: 16,
      borderWidth: theme.mode === 'dark' ? 1 : 0,
      borderColor: theme.colors.border,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: theme.mode === 'dark' ? 0 : 3,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    featureText: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
    },
    themeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: theme.mode === 'dark' ? 1 : 0,
      borderColor: theme.colors.border,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: theme.mode === 'dark' ? 0 : 3,
    },
    toggleText: {
      flex: 1,
      marginRight: 16,
      gap: 6,
    },
  })
