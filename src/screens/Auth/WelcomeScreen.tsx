import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Animatable from 'react-native-animatable'
import { WelcomeScreenNavigationProp } from '../../navigation/types'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

const { width, height } = Dimensions.get('window')

interface Props {
  navigation: WelcomeScreenNavigationProp
}

export default function WelcomeScreen({ navigation }: Props) {
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)
  const heroGradient = React.useMemo(() => {
    if (theme.mode === 'light') {
      return ['#57b1fbff', '#ffffff', '#ffffff'] as const
    }

    return [
      theme.colors.gradientStart,
      theme.colors.primary,
      theme.colors.gradientEnd,
    ] as const
  }, [
    theme.colors.gradientEnd,
    theme.colors.gradientStart,
    theme.colors.primary,
    theme.mode,
  ])

  const buttonGradient = React.useMemo(
    () => (
      theme.mode === 'dark'
        ? ([theme.colors.primary, theme.colors.primary] as const)
        : ([theme.colors.surface, theme.colors.card] as const)
    ),
    [theme.colors.card, theme.colors.primary, theme.colors.surface, theme.mode]
  )

  const features = [
    { icon: '💧', text: 'Real-time water tracking' },
    { icon: '📊', text: 'Health insights & analytics' },
    { icon: '🔔', text: 'Smart hydration alerts' },
    { icon: '🐕', text: 'Multi-pet support' },
  ]

  return (
    <LinearGradient colors={heroGradient} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Animatable.Image
            animation="bounceIn"
            duration={1500}
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Animatable.View animation="fadeInUpBig" style={styles.footer}>
          <Text style={styles.title}>Pet Hydration Monitor</Text>
          <Text style={styles.subtitle}>
            Track your pet's water intake and ensure they stay healthy and hydrated
          </Text>

          <View style={styles.features}>
            {features.map((item) => (
              <View key={item.text} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{item.icon}</Text>
                <Text style={styles.featureText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={buttonGradient} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            style={styles.signupLink}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    footer: {
      flex: 2,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      paddingVertical: 30,
      paddingHorizontal: 30,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: theme.mode === 'dark' ? 0 : 0.08,
      shadowRadius: 8,
      elevation: theme.mode === 'dark' ? 0 : 6,
    },
    logo: {
      width: width * 0.5,
      height: width * 0.5,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 22,
    },
    features: {
      marginBottom: 30,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    featureIcon: {
      fontSize: 24,
      marginRight: 15,
    },
    featureText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    getStartedButton: {
      marginTop: 20,
      borderRadius: 25,
      overflow: 'hidden',
    },
    buttonGradient: {
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.mode === 'dark' ? 0 : 0.2,
      shadowRadius: 3,
      elevation: theme.mode === 'dark' ? 0 : 5,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.mode === 'dark' ? theme.colors.onPrimary : theme.colors.primary,
    },
    signupLink: {
      marginTop: 20,
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
