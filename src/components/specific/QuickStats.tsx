import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

interface Props {
  stats: {
    totalWater: number
    activeDevices: number
    alerts: number
  }
}

export default function QuickStats({ stats }: Props) {
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

  const StatItem = ({ icon, value, label, color }: any) => (
    <View style={[styles.statItem, { borderLeftColor: color }]}
    >
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <StatItem
        icon="water"
        value={`${stats.totalWater}ml`}
        label="Today's Water"
        color={theme.colors.info}
      />
      <StatItem
        icon="hardware-chip"
        value={stats.activeDevices}
        label="Active Devices"
        color={theme.colors.success}
      />
      <StatItem
        icon="notifications"
        value={stats.alerts}
        label="Alerts"
        color={stats.alerts > 0 ? theme.colors.warning : theme.colors.muted}
      />
    </View>
  )
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 15,
    },
    statItem: {
      flex: 1,
      backgroundColor: theme.colors.card,
      padding: 15,
      borderRadius: 12,
      borderLeftWidth: 4,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.mode === 'dark' ? 0 : 0.05,
      shadowRadius: 3,
      elevation: theme.mode === 'dark' ? 0 : 2,
      borderColor: theme.colors.border,
      borderWidth: theme.mode === 'dark' ? 1 : 0,
    },
    statIcon: {
      marginBottom: 8,
    },
    statContent: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  })
