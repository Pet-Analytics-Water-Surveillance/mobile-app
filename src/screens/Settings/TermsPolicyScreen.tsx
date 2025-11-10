import React from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

const SUPPORT_EMAIL = 'contact@teampaws.app'

type PolicySection = {
  title: string
  paragraphs: string[]
  bulletPoints?: string[]
}

const POLICY_SECTIONS: PolicySection[] = [
  {
    title: 'Terms of Use',
    paragraphs: [
      'Smart Pet Bowl and the Pet Hydration Analytics & Wellness System (P.A.W.S) are designed to help you monitor hydration habits. By using the app you agree to operate the hardware and software as intended and in compliance with local regulations.',
    ],
    bulletPoints: [
      'Keep your account credentials private and notify us if you suspect unauthorized access.',
      'Only connect certified Smart Pet Bowl devices to ensure accurate readings.',
      'Do not reverse engineer, tamper with, or resell the firmware or companion app.',
    ],
  },
  {
    title: 'Privacy Practices',
    paragraphs: [
      'We collect only the information needed to deliver hydration insights, improve pet wellness features, and support your devices. Data is encrypted in transit and at rest within our cloud platform.',
    ],
    bulletPoints: [
      'Pet profiles: name, breed, age, hydration targets.',
      'Device telemetry: water consumption, timestamps, sensor diagnostics.',
      'Account details: email address and optional household sharing settings.',
    ],
  },
  {
    title: 'How We Use Data',
    paragraphs: [
      'Hydration trends help personalize notifications and detect out-of-pattern behavior. Aggregated and anonymized analytics guide future product improvements.',
      'We never sell personal information. Third-party processors (such as Supabase and Expo services) are used solely to host and deliver the application.',
    ],
  },
  {
    title: 'Your Choices & Controls',
    paragraphs: [
      'You can update pet details, delete hydration logs, or request full account removal at any time from the Settings section.',
    ],
    bulletPoints: [
      'Disable non-critical notifications in Settings → Preferences.',
      'Request data export or deletion by emailing our support team.',
      'Revoke household invites to stop data sharing with other caretakers.',
    ],
  },
  {
    title: 'Security Commitments',
    paragraphs: [
      'Regular firmware updates and secure authentication help protect your device. We recommend keeping your app up to date and protecting your home Wi-Fi network.',
    ],
  },
]

export default function TermsPolicyScreen() {
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <LinearGradient
          colors={[
            theme.mode === 'dark'
              ? theme.colors.gradientStart
              : 'rgba(79,195,247,0.16)',
            theme.mode === 'dark'
              ? theme.colors.gradientEnd
              : 'rgba(25,118,210,0.05)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroTitle}>Terms & Privacy</Text>
          <Text style={styles.heroSubtitle}>
            Transparency is central to Team P.A.W.S. Review how we safeguard your data and outline responsibilities when using Smart Pet Bowl.
          </Text>
        </LinearGradient>

        {POLICY_SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((text) => (
              <Text key={text} style={styles.paragraph}>
                {text}
              </Text>
            ))}
            {section.bulletPoints && (
              <View style={styles.bulletList}>
                {section.bulletPoints.map((item) => (
                  <View key={item} style={styles.bulletItem}>
                    <Ionicons
                      name="ellipse"
                      size={6}
                      color={theme.colors.primary}
                      style={styles.bulletIcon}
                    />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Questions or Requests</Text>
          <Text style={styles.paragraph}>
            If you need clarification on any policy, want to review your data, or wish to request deletion, contact our support team and we&apos;ll respond within 48 hours.
          </Text>
          <TouchableOpacity
            style={styles.contactRow}
            activeOpacity={0.85}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Smart%20Pet%20Bowl%20Privacy%20Request`)}
          >
            <View style={styles.contactIconWrapper}>
              <Ionicons name="shield-checkmark" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.contactDetails}>
              <Text style={styles.contactLabel}>Reach Us</Text>
              <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
          </TouchableOpacity>
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
      paddingVertical: 24,
      gap: 20,
    },
    heroCard: {
      borderRadius: 24,
      padding: 24,
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 10,
    },
    heroSubtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 20,
      gap: 12,
      borderWidth: theme.mode === 'dark' ? 1 : 0,
      borderColor: theme.colors.border,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: theme.mode === 'dark' ? 0 : 3,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    paragraph: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textSecondary,
    },
    bulletList: {
      gap: 10,
    },
    bulletItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    bulletIcon: {
      marginTop: 8,
    },
    bulletText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.text,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 4,
    },
    contactIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contactDetails: {
      flex: 1,
      gap: 4,
    },
    contactLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.muted,
      textTransform: 'uppercase',
    },
    contactValue: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
  })
