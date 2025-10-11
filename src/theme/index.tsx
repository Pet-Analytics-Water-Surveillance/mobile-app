import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'app:theme-mode'

type ThemeColors = {
  background: string
  surface: string
  card: string
  elevatedCard: string
  primary: string
  onPrimary: string
  text: string
  textSecondary: string
  muted: string
  border: string
  overlay: string
  success: string
  danger: string
  warning: string
  info: string
  icon: string
  tabBarBackground: string
  tabBarBorder: string
  switchTrack: string
  switchThumb: string
  gradientStart: string
  gradientEnd: string
}

export type AppTheme = {
  mode: ThemeMode
  colors: ThemeColors
  statusBarStyle: 'light' | 'dark'
}

type ThemeContextValue = {
  theme: AppTheme
  isDarkMode: boolean
  setThemeMode: (mode: ThemeMode) => Promise<void>
  toggleThemeMode: () => Promise<void>
}

const lightTheme: AppTheme = {
  mode: 'light',
  statusBarStyle: 'dark',
  colors: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    elevatedCard: '#FFFFFF',
    primary: '#2196F3',
    onPrimary: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#555555',
    muted: '#757575',
    border: '#E0E0E0',
    overlay: 'rgba(0, 0, 0, 0.05)',
    success: '#4CAF50',
    danger: '#FF3B30',
    warning: '#FFC107',
    info: '#0288D1',
    icon: '#2196F3',
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E0E0E0',
    switchTrack: '#81C784',
    switchThumb: '#4CAF50',
    gradientStart: '#4FC3F7',
    gradientEnd: '#1976D2',
  },
}

const darkTheme: AppTheme = {
  mode: 'dark',
  statusBarStyle: 'light',
  colors: {
    background: '#0F172A',
    surface: '#111827',
    card: '#1F2937',
    elevatedCard: '#243447',
    primary: '#4FC3F7',
    onPrimary: '#0B1220',
    text: '#F3F4F6',
    textSecondary: '#CBD5F5',
    muted: '#94A3B8',
    border: '#1E293B',
    overlay: 'rgba(255, 255, 255, 0.08)',
    success: '#4ADE80',
    danger: '#FB7185',
    warning: '#FBBF24',
    info: '#38BDF8',
    icon: '#4FC3F7',
    tabBarBackground: '#111827',
    tabBarBorder: '#1F2937',
    switchTrack: '#2563EB',
    switchThumb: '#60A5FA',
    gradientStart: '#0F172A',
    gradientEnd: '#080b13ff',
  },
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(lightTheme)

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedMode = await AsyncStorage.getItem(STORAGE_KEY)
        if (storedMode === 'dark') {
          setTheme(darkTheme)
        }
      } catch (error) {
        console.warn('Failed to load stored theme mode', error)
      }
    }

    loadTheme()
  }, [])

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    const nextTheme = mode === 'dark' ? darkTheme : lightTheme
    setTheme(nextTheme)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode)
    } catch (error) {
      console.warn('Failed to persist theme mode', error)
    }
  }, [])

  const toggleThemeMode = useCallback(async () => {
    await setThemeMode(theme.mode === 'dark' ? 'light' : 'dark')
  }, [setThemeMode, theme.mode])

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    isDarkMode: theme.mode === 'dark',
    setThemeMode,
    toggleThemeMode,
  }), [setThemeMode, theme, toggleThemeMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useAppTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider')
  }

  return context
}

export function useThemedStyles<T>(stylesFactory: (theme: AppTheme) => T): T {
  const { theme } = useAppTheme()
  return useMemo(() => stylesFactory(theme), [stylesFactory, theme])
}

export function useRefreshControlColors() {
  const { theme } = useAppTheme()

  return useMemo(
    () => ({
      tintColor: theme.mode === 'dark' ? theme.colors.primary : theme.colors.text,
      colors: theme.mode === 'dark'
        ? [theme.colors.primary]
        : [theme.colors.text],
      progressBackgroundColor: theme.mode === 'dark'
        ? theme.colors.card
        : theme.colors.surface,
    }),
    [theme]
  )
}
