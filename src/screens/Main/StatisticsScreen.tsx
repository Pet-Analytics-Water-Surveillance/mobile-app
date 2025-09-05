import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit'
import { supabase } from '../../services/supabase'

const { width } = Dimensions.get('window')

export default function StatisticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [stats, setStats] = useState({
    totalWater: 0,
    averagePerDay: 0,
    totalEvents: 0,
    topPet: null,
  })
  const [chartData, setChartData] = useState({
    lineData: {},
    barData: {},
    pieData: [],
  })

  useEffect(() => {
    loadStatistics()
  }, [selectedPeriod])

  const loadStatistics = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user?.id)
      .single()

    if (member) {
      const endDate = new Date()
      const startDate = new Date()
      
      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      // Load hydration events
      const { data: events } = await supabase
        .from('hydration_events')
        .select(`
          amount_ml,
          timestamp,
          pet_id,
          pets (name)
        `)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: true })

      if (events) {
        const totalWater = events.reduce((sum, e) => sum + e.amount_ml, 0)
        const totalEvents = events.length
        const averagePerDay = totalWater / Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))

        // Group by pet
        const petStats = {}
        events.forEach(event => {
          const petName = event.pets?.name || 'Unknown'
          if (!petStats[petName]) {
            petStats[petName] = { total: 0, count: 0 }
          }
          petStats[petName].total += event.amount_ml
          petStats[petName].count += 1
        })

        const topPet = Object.entries(petStats)
          .sort(([,a], [,b]) => b.total - a.total)[0]

        setStats({
          totalWater,
          averagePerDay: Math.round(averagePerDay),
          totalEvents,
          topPet: topPet ? { name: topPet[0], amount: topPet[1].total } : null,
        })

        // Prepare chart data
        prepareChartData(events, startDate, endDate, petStats)
      }
    }
  }

  const prepareChartData = (events: any[], startDate: Date, endDate: Date, petStats: any) => {
    // Line chart data (daily water intake)
    const dailyData = {}
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0]
      dailyData[dateKey] = 0
      currentDate.setDate(currentDate.getDate() + 1)
    }

    events.forEach(event => {
      const dateKey = event.timestamp.split('T')[0]
      if (dailyData[dateKey] !== undefined) {
        dailyData[dateKey] += event.amount_ml
      }
    })

    const lineData = {
      labels: Object.keys(dailyData).map(date => 
        new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [{
        data: Object.values(dailyData),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      }]
    }

    // Bar chart data (pet comparison)
    const barData = {
      labels: Object.keys(petStats),
      datasets: [{
        data: Object.values(petStats).map((p: any) => p.total),
      }]
    }

    // Pie chart data (pet distribution)
    const pieData = Object.entries(petStats).map(([name, data]: [string, any], index) => ({
      name,
      population: data.total,
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][index % 5],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }))

    setChartData({ lineData, barData, pieData })
  }

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Hydration Statistics</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['week', 'month', 'year'].map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Water"
            value={`${stats.totalWater}ml`}
            subtitle={`${stats.averagePerDay}ml/day avg`}
            icon="water"
            color="#4FC3F7"
          />
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            subtitle="Drinking sessions"
            icon="list"
            color="#4CAF50"
          />
          {stats.topPet && (
            <StatCard
              title="Top Pet"
              value={stats.topPet.name}
              subtitle={`${stats.topPet.amount}ml`}
              icon="paw"
              color="#FF9800"
            />
          )}
        </View>

        {/* Daily Water Intake Chart */}
        {chartData.lineData.labels && chartData.lineData.labels.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Daily Water Intake</Text>
            <LineChart
              data={chartData.lineData}
              width={width - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#2196F3',
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Pet Comparison Chart */}
        {chartData.barData.labels && chartData.barData.labels.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Pet Comparison</Text>
            <BarChart
              data={chartData.barData}
              width={width - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              style={styles.chart}
            />
          </View>
        )}

        {/* Pet Distribution Chart */}
        {chartData.pieData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Water Distribution by Pet</Text>
            <PieChart
              data={chartData.pieData}
              width={width - 40}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  periodButtonActive: {
    backgroundColor: '#2196F3',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsGrid: {
    marginTop: 20,
    gap: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 12,
  },
})
