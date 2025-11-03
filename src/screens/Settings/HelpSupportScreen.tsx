import React from 'react'
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

const SUPPORT_EMAIL = 'contact@teampaws.app'

type SupportLink = {
  id: string
  icon: keyof typeof Ionicons.glyphMap
  title: string
  description: string
  action: () => void
}

export default function HelpSupportScreen() {
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

  const supportLinks: SupportLink[] = React.useMemo(
    () => [
      {
        id: 'email',
        icon: 'mail-outline',
        title: 'Email Support',
        description: 'Reach us directly and the team will respond within 1-2 business days.',
        action: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`),
      },
      {
        id: 'faq',
        icon: 'book-outline',
        title: 'Quick Start & FAQs',
        description: 'Review setup guides, sensor maintenance tips, and common troubleshooting steps.',
        action: () =>
          Alert.alert(
            'Documentation Coming Soon',
            'We are finalizing our online help center. Check back shortly!'
          ),
      },
      {
        id: 'feedback',
        icon: 'chatbubble-ellipses-outline',
        title: 'Send Feedback',
        description: 'Share ideas to improve Smart Pet Bowl and future updates.',
        action: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Smart%20Pet%20Bowl%20Feedback`),
      },
    ],
    []
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
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
          <Text style={styles.heroTitle}>Need Some Help?</Text>
          <Text style={styles.heroSubtitle}>
            We&apos;re here to help with your Smart Pet Bowl setup, device performance, and hydration insights.
          </Text>
        </LinearGradient>

        <View style={styles.contactCard}>
          <View style={styles.contactRow}>
            <View style={styles.contactIconWrapper}>
              <Ionicons name="mail" size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.contactDetails}>
              <Text style={styles.contactLabel}>Support Email</Text>
              <Text
                style={styles.contactValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.95}
              >
                {SUPPORT_EMAIL}
              </Text>
              <Text style={styles.contactHint}>
                Drop us a message with screenshots or logs for faster assistance.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.pillButton}
            activeOpacity={0.85}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          >
            <Ionicons name="send-outline" size={18} color={theme.colors.onPrimary} />
            <Text style={styles.pillButtonText}>Compose</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Get Support</Text>
          {supportLinks.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.supportRow}
                onPress={item.action}
              >
                <View style={styles.rowIcon}>
                  <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowDescription}>{item.description}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.muted}
                />
              </TouchableOpacity>
              {index < supportLinks.length - 1 && (
                <View style={styles.rowDivider} />
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tips for Faster Help</Text>
          <View style={styles.listItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={theme.colors.success}
              style={styles.listIcon}
            />
            <Text style={styles.listText}>
              Include your pet&apos;s profile name and device serial for hardware questions.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={theme.colors.success}
              style={styles.listIcon}
            />
            <Text style={styles.listText}>
              Attach hydration logs or app screenshots when something looks off.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={theme.colors.success}
              style={styles.listIcon}
            />
            <Text style={styles.listText}>
              Mention recent changes (new bowl location, firmware updates, diet shifts).
            </Text>
          </View>
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
    contactCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 20,
      gap: 16,
      borderWidth: theme.mode === 'dark' ? 1 : 0,
      borderColor: theme.colors.border,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
      elevation: theme.mode === 'dark' ? 0 : 4,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    contactIconWrapper: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactDetails: {
      flex: 1,
      gap: 4,
    },
    contactLabel: {
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      color: theme.colors.muted,
    },
    contactValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flexShrink: 1,
    },
    contactHint: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    pillButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      gap: 6,
      alignSelf: 'center',
    },
    pillButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
      fontSize: 14,
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
    supportRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
    },
    rowIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rowContent: {
      flex: 1,
      gap: 4,
    },
    rowTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    rowDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    rowDivider: {
      height: 1,
      marginLeft: 58,
      marginTop: 14,
      backgroundColor: theme.colors.border,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    listIcon: {
      marginTop: 2,
    },
    listText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textSecondary,
    },
  })
