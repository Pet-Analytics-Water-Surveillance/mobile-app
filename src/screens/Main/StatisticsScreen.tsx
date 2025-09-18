import React, { useState, useEffect, useMemo } from 'react'
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
const SCROLL_HORIZONTAL_PADDING = 20
const CARD_HORIZONTAL_PADDING = 16
const CHART_HORIZONTAL_PADDING = 2 * (SCROLL_HORIZONTAL_PADDING + CARD_HORIZONTAL_PADDING)
const chartWidth = Math.max(width - CHART_HORIZONTAL_PADDING, 220)

type Period = 'week' | 'month' | 'year'

type HydrationEvent = {
  amount_ml: number
  timestamp: string
  pet_id: string | number
  pets?: { name?: string | null } | null
}

type PetStat = { total: number; count: number }

type LineData = {
  labels: string[]
  datasets: { data: number[]; color?: (opacity?: number) => string; strokeWidth?: number }[]
}

type BarData = {
  labels: string[]
  datasets: { data: number[] }[]
}

type PieDatum = {
  name: string
  population: number
  color: string
  legendFontColor: string
  legendFontSize: number
}

type Stats = {
  totalWater: number
  averagePerDay: number
  totalEvents: number
  topPet: { name: string; amount: number } | null
}

type ChartData = {
  lineData: LineData
  barData: BarData
  pieData: PieDatum[]
}

export default function StatisticsScreen(): React.ReactElement {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week')
  const [stats, setStats] = useState<Stats>({
    totalWater: 0,
    averagePerDay: 0,
    totalEvents: 0,
    topPet: null,
  })
  const [chartData, setChartData] = useState<ChartData>({
    lineData: { labels: [], datasets: [{ data: [] }] },
    barData: { labels: [], datasets: [{ data: [] }] },
    pieData: [],
  })

  useEffect(() => {
    loadStatistics()
  }, [selectedPeriod])

  const loadStatistics = async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user?.id)
      .single()

    if (member) {
      const endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
      const startDate = new Date(endDate)
      
      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(endDate.getDate() - 6)
          break
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1)
          break
        case 'year':
          startDate.setMonth(endDate.getMonth() - 11)
          startDate.setDate(1)
          break
      }

      startDate.setHours(0, 0, 0, 0)

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
        const eventsTyped = (events ?? []) as HydrationEvent[]
        const totalWater = eventsTyped.reduce((sum: number, e: HydrationEvent) => sum + e.amount_ml, 0)
        const totalEvents = eventsTyped.length
        const averagePerDay = totalWater / Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

        // Group by pet
        const petStats: Record<string, PetStat> = {}
        eventsTyped.forEach((event: HydrationEvent) => {
          const petName = event.pets?.name || 'Unknown'
          if (!petStats[petName]) {
            petStats[petName] = { total: 0, count: 0 }
          }
          petStats[petName].total += event.amount_ml
          petStats[petName].count += 1
        })

        const sortedEntries = Object.entries(petStats) as [string, PetStat][]
        const topPet = sortedEntries.sort(([, a], [, b]) => b.total - a.total)[0]

        setStats({
          totalWater,
          averagePerDay: Math.round(averagePerDay),
          totalEvents,
          topPet: topPet ? { name: topPet[0], amount: topPet[1].total } : null,
        })

        // Prepare chart data
        prepareChartData(eventsTyped, startDate, endDate, petStats)
      }
    }
  }

  const prepareChartData = (
    events: HydrationEvent[],
    startDate: Date,
    endDate: Date,
    petStats: Record<string, PetStat>
  ): void => {
    const startOfDay = (date: Date): Date => {
      const copy = new Date(date)
      copy.setHours(0, 0, 0, 0)
      return copy
    }

    const start = startOfDay(startDate)
    const end = startOfDay(endDate)
    const MS_PER_DAY = 24 * 60 * 60 * 1000

    let lineLabels: string[] = []
    let lineValues: number[] = []

    if (selectedPeriod === 'week') {
      const dailyKeys: string[] = []
      const dailyTotals: Record<string, number> = {}
      const cursor = new Date(start)

      while (cursor.getTime() <= end.getTime()) {
        const key = cursor.toISOString().split('T')[0]
        dailyKeys.push(key)
        dailyTotals[key] = 0
        cursor.setDate(cursor.getDate() + 1)
      }

      events.forEach((event: HydrationEvent) => {
        const key = startOfDay(new Date(event.timestamp)).toISOString().split('T')[0]
        if (dailyTotals[key] !== undefined) {
          dailyTotals[key] += event.amount_ml
        }
      })

      lineLabels = dailyKeys.map(date =>
        new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
      )
      lineValues = dailyKeys.map(key => dailyTotals[key])
    } else if (selectedPeriod === 'month') {
      const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1)
      const weekCount = Math.max(1, Math.ceil(totalDays / 7))
      const weekTotals = new Array(weekCount).fill(0)

      events.forEach((event: HydrationEvent) => {
        const eventDate = startOfDay(new Date(event.timestamp))
        const diffDays = Math.floor((eventDate.getTime() - start.getTime()) / MS_PER_DAY)

        if (diffDays >= 0 && diffDays < totalDays) {
          const bucketIndex = Math.min(Math.floor(diffDays / 7), weekCount - 1)
          weekTotals[bucketIndex] += event.amount_ml
        }
      })

      lineLabels = Array.from({ length: weekCount }).map((_, index) => {
        const weekStart = new Date(start)
        weekStart.setDate(weekStart.getDate() + index * 7)
        return weekStart.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
      })
      lineValues = weekTotals
    } else {
      const monthKeys: string[] = []
      const monthTotals: number[] = []
      const monthIndex: Record<string, number> = {}

      for (let i = 11; i >= 0; i--) {
        const cursor = new Date(end.getFullYear(), end.getMonth() - i, 1)
        const key = `${cursor.getFullYear()}-${cursor.getMonth()}`
        monthIndex[key] = monthKeys.length
        monthKeys.push(key)
        monthTotals.push(0)
      }

      events.forEach((event: HydrationEvent) => {
        const eventDate = new Date(event.timestamp)
        const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}`
        const index = monthIndex[key]
        if (index !== undefined) {
          monthTotals[index] += event.amount_ml
        }
      })

      lineLabels = monthKeys.map(key => {
        const [yearString, monthString] = key.split('-')
        const year = Number(yearString)
        const month = Number(monthString)
        return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' })
      })
      lineValues = monthTotals
    }

    const lineData: LineData = {
      labels: lineLabels,
      datasets: [{
        data: lineValues,
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      }]
    }

    // Bar chart data (pet comparison)
    const barData: BarData = {
      labels: Object.keys(petStats),
      datasets: [{
        data: Object.values(petStats).map((p: PetStat) => p.total),
      }]
    }

    // Pie chart data (pet distribution)
    const pieData: PieDatum[] = Object.entries(petStats).map(([name, data], index) => ({
      name,
      population: (data as PetStat).total,
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][index % 5],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }))

    setChartData({ lineData, barData, pieData })
  }

  const lineChartWidth = useMemo(() => {
    if (selectedPeriod === 'year') {
      const dataset = chartData.lineData.datasets[0]
      const dataPoints = dataset?.data?.length ?? chartData.lineData.labels.length
      const MIN_WIDTH_PER_POINT = 56
      return Math.max(chartWidth, dataPoints * MIN_WIDTH_PER_POINT)
    }
    return chartWidth
  }, [chartData.lineData, selectedPeriod])

  const enableLineChartScroll = selectedPeriod === 'year' && lineChartWidth > chartWidth

  const StatCard = ({ title, value, subtitle, icon, color }: {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ComponentProps<typeof Ionicons>['name']
    color: string
  }) => (
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
        {(['week', 'month', 'year'] as Period[]).map((period: Period) => (
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
        {chartData.lineData.labels.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Water Intake</Text>
            {enableLineChartScroll ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalChartContent}
              >
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={chartData.lineData}
                    width={lineChartWidth}
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
                    yLabelsOffset={8}
                  />
                </View>
              </ScrollView>
            ) : (
              <View style={styles.chartWrapper}>
                <LineChart
                  data={chartData.lineData}
                  width={lineChartWidth}
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
                  yLabelsOffset={8}
                />
              </View>
            )}
          </View>
        )}

        {/* Pet Comparison Chart */}
        {chartData.barData.labels.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Pet Comparison</Text>
            <View style={styles.chartWrapper}>
              <BarChart
                data={chartData.barData as any}
                width={chartWidth}
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
                } as any}
                style={styles.chart}
                yAxisLabel={''}
                yAxisSuffix={''}
                yLabelsOffset={8}
              />
            </View>
          </View>
        )}

        {/* Pet Distribution Chart */}
        {chartData.pieData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Water Distribution by Pet</Text>
            <View style={styles.chartWrapper}>
              <PieChart
                data={chartData.pieData}
                width={chartWidth}
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
    //backgroundColor: '#fff',
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
    //backgroundColor: '#fff',
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
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 15,
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
    paddingVertical: 14,
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
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
  horizontalChartContent: {
    paddingRight: 16,
  },
  chartWrapper: {
    marginLeft: -8,
    paddingRight: 8,
  },
})
