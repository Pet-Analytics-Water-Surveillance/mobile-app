import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { EmailVerificationService } from '../../services/EmailVerificationService'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

interface Props {
  navigation: any
  route: {
    params: {
      email: string
    }
  }
}

export default function EmailVerificationScreen({ navigation, route }: Props) {
  const [loading, setLoading] = useState(false)
  const { email } = route.params
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

  const resendVerificationEmail = async () => {
    setLoading(true)
    
    try {
      await EmailVerificationService.resendVerificationEmail(email)
      Alert.alert(
        'Email Sent!',
        'We\'ve sent a new verification email. Please check your inbox and spam folder.'
      )
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend verification email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={80} color={theme.colors.primary} />
        </View>

        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification link to:
        </Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>What to do next:</Text>
          <View style={styles.instruction}>
            <Text style={styles.stepNumber}>1.</Text>
            <Text style={styles.stepText}>Check your email inbox</Text>
          </View>
          <View style={styles.instruction}>
            <Text style={styles.stepNumber}>2.</Text>
            <Text style={styles.stepText}>Look for an email from PAWS</Text>
          </View>
          <View style={styles.instruction}>
            <Text style={styles.stepNumber}>3.</Text>
            <Text style={styles.stepText}>Click the verification link</Text>
          </View>
          <View style={styles.instruction}>
            <Text style={styles.stepNumber}>4.</Text>
            <Text style={styles.stepText}>Return to the app to sign in</Text>
          </View>
        </View>

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Don't see the email? Check your spam folder or
          </Text>
          <TouchableOpacity
            style={[styles.resendButton, loading && styles.resendButtonDisabled]}
            onPress={resendVerificationEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={styles.resendButtonText}>Resend Email</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Back to Login</Text>
        </TouchableOpacity>
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
    backButton: {
      position: 'absolute',
      top: 110,
      left: 20,
      zIndex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconContainer: {
      marginBottom: 30,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 5,
    },
    email: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: 40,
    },
    instructionsContainer: {
      width: '100%',
      backgroundColor: theme.mode === 'dark' ? theme.colors.card : '#F8F9FA',
      borderRadius: 12,
      padding: 20,
      marginBottom: 30,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    instructionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 15,
    },
    instruction: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginRight: 10,
      minWidth: 20,
    },
    stepText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    helpContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    helpText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 10,
    },
    resendButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
    },
    resendButtonDisabled: {
      opacity: 0.6,
    },
    resendButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    loginButton: {
      backgroundColor: theme.mode === 'dark' ? theme.colors.card : '#F5F5F5',
      borderRadius: 25,
      paddingVertical: 15,
      paddingHorizontal: 40,
      alignItems: 'center',
    },
    loginButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  })
