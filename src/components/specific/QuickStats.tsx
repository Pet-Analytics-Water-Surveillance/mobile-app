import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  stats: {
    totalWater: number
    activeDevices: number
    alerts: number
  }
}

export default function QuickStats({ stats }: Props) {
  const StatItem = ({ icon, value, label, color }: any) => (
    <View style={[styles.statItem, { borderLeftColor: color }]}>
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
        color="#4FC3F7"
      />
      <StatItem
        icon="hardware-chip"
        value={stats.activeDevices}
        label="Active Devices"
        color="#4CAF50"
      />
      <StatItem
        icon="notifications"
        value={stats.alerts}
        label="Alerts"
        color={stats.alerts > 0 ? "#FF9800" : "#9E9E9E"}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
})
