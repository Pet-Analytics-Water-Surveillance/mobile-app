import React, { useMemo, useState } from 'react'
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../services/supabase'
import { ProfileService } from '../../services/ProfileService'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'
export default function SecurityScreen() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)
  const passwordChecks = useMemo(
    () => [
      {
        label: 'At least 6 characters',
        met: newPassword.length >= 6,
      },
      {
        label: 'Contains an uppercase letter',
        met: /[A-Z]/.test(newPassword),
      },
      {
        label: 'Contains a number or symbol',
        met: /[\d\W]/.test(newPassword),
      },
    ],
    [newPassword]
  )
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing information', 'Fill out every password field before continuing.')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Confirm password must match the new password.')
      return
    }
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters for your new password.')
      return
    }
    setIsUpdating(true)
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user || !user.email) {
        throw new Error('Unable to verify your account. Please re-login and try again.')
      }
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (authError) {
        throw new Error('The current password you entered is incorrect.')
      }
      await ProfileService.changePassword(newPassword)
      Alert.alert('Password updated', 'Your password was changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      const message =
        error?.message ??
        'We could not change your password right now. Please try again in a moment.'
      Alert.alert('Update failed', message)
    } finally {
      setIsUpdating(false)
    }
  }
  const renderPasswordInput = (
    label: string,
    value: string,
    setValue: (text: string) => void,
    placeholder: string
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        secureTextEntry
        onChangeText={setValue}
        style={styles.input}
        autoCapitalize="none"
      />
    </View>
  )
  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="lock-closed-outline" size={22} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.title}>Change Password</Text>
              <Text style={styles.subtitle}>
                Keep your account secure by updating your password regularly.
              </Text>
            </View>
          </View>
          {renderPasswordInput('Current password', currentPassword, setCurrentPassword, '••••••••')}
          {renderPasswordInput('New password', newPassword, setNewPassword, 'Minimum 6 characters')}
          {renderPasswordInput('Confirm new password', confirmPassword, setConfirmPassword, 'Repeat new password')}
          <View style={styles.divider} />
          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Password requirements</Text>
            {passwordChecks.map((check) => (
              <View key={check.label} style={styles.requirementRow}>
                <Ionicons
                  name={check.met ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={check.met ? theme.colors.success : theme.colors.muted}
                />
                <Text style={styles.requirementText}>{check.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, isUpdating && styles.disabledButton]}
            onPress={handleChangePassword}
            disabled={isUpdating}
            activeOpacity={0.85}
          >
            {isUpdating ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <>
                <Ionicons name="key-outline" size={18} color={theme.colors.onPrimary} />
                <Text style={styles.primaryButtonText}>Update password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.primary} />
          <View style={styles.infoTextWrapper}>
            <Text style={styles.infoTitle}>Need extra protection?</Text>
            <Text style={styles.infoDescription}>
              Household members never see your password. If you suspect suspicious activity, change it immediately and sign out on other devices.
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
    content: {
      padding: 20,
      paddingBottom: 40,
      gap: 20,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 14,
    },
    cardHeader: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      marginBottom: 6,
    },
    iconWrapper: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: theme.colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    field: {
      gap: 6,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 4,
    },
    requirements: {
      gap: 10,
    },
    requirementsTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
    },
    requirementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    requirementText: {
      color: theme.colors.text,
    },
    primaryButton: {
      marginTop: 6,
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    disabledButton: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
      fontSize: 16,
    },
    infoCard: {
      flexDirection: 'row',
      gap: 12,
      padding: 10,
      borderRadius: 16,
      backgroundColor:
        theme.mode === 'dark'
          ? theme.colors.overlay
          : 'rgba(79, 195, 247, 0.12)',
      borderWidth: theme.mode === 'dark' ? 1 : 0,
      borderColor: theme.colors.border,
    },
    infoTextWrapper: {
      flex: 1,
      gap: 4,
    },
    infoTitle: {
      fontWeight: '600',
      color: theme.colors.text,
    },
    infoDescription: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
  })
