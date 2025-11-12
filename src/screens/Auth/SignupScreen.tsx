import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { supabase } from '../../services/supabase'
import { WelcomeScreenNavigationProp } from '../../navigation/types'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .matches(/[A-Z]/, 'Password must contain an uppercase letter')
    .matches(/[\d\W]/, 'Password must contain a number or symbol')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
})

interface Props {
  navigation: WelcomeScreenNavigationProp
}

export default function SignupScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  })

  const passwordValue = watch('password', '')
  const passwordChecks = useMemo(
    () => [
      { label: 'At least 6 characters', met: passwordValue.length >= 6 },
      { label: 'Contains an uppercase letter', met: /[A-Z]/.test(passwordValue) },
      { label: 'Contains a number or symbol', met: /[\d\W]/.test(passwordValue) },
    ],
    [passwordValue]
  )

  const onSubmit = async (data: any) => {
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
          emailRedirectTo: 'paws://auth/callback'
        }
      })

      if (error) {
        Alert.alert('Signup Error', error.message)
      } else {
        navigation.navigate('EmailVerification', { email: data.email })
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us to start monitoring your pets</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.nameRow}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="words"
                  />
                </View>
              )}
            />
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="words"
                  />
                </View>
              )}
            />
          </View>
          {(errors.firstName || errors.lastName) && (
            <Text style={styles.errorText}>
              {errors.firstName?.message || errors.lastName?.message}
            </Text>
          )}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          <View style={styles.passwordRequirements}>
            {passwordChecks.map((check) => (
              <View key={check.label} style={styles.requirementRow}>
                <Ionicons
                  name={check.met ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={check.met ? theme.colors.success : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.requirementText,
                    check.met && { color: theme.colors.success, fontWeight: '600' },
                  ]}
                >
                  {check.label}
                </Text>
              </View>
            ))}
          </View>

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      zIndex: 1,
    },
    header: {
      alignItems: 'center',
      marginTop: 80,
      marginBottom: 40,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    form: {
      paddingHorizontal: 30,
    },
    nameRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 15,
      paddingVertical: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    halfInput: {
      flex: 1,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: 12,
      marginBottom: 10,
      marginLeft: 5,
    },
    passwordRequirements: {
      marginBottom: 10,
      gap: 6,
      paddingLeft: 5,
    },
    requirementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    requirementText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    signupButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 25,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
    },
    signupButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 18,
      fontWeight: 'bold',
    },
    loginLink: {
      alignItems: 'center',
    },
    linkText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    linkTextBold: {
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
  })
