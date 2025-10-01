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
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={80} color="#2196F3" />
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
            style={styles.resendButton}
            onPress={resendVerificationEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#2196F3" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 50,
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
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 40,
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    color: '#2196F3',
    marginRight: 10,
    minWidth: 20,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  helpContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  loginButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
})
