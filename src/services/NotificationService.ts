import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import Constants from 'expo-constants'

/**
 * Notification Service
 * Handles push notifications, permissions, and notification display
 */
class NotificationService {
  private expoPushToken: string | null = null

  /**
   * Initialize notification service
   * - Request permissions
   * - Get push token
   * - Configure notification handler
   */
  async initialize(): Promise<void> {
    console.log('🔔 Initializing notification service...')

    // Configure how notifications are displayed
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    })

    // Request permissions
    const hasPermission = await this.requestPermissions()
    if (!hasPermission) {
      console.warn('⚠️ Notification permissions not granted')
      return
    }

    // Get push token
    await this.registerForPushNotifications()

    console.log('✅ Notification service initialized')
  }

  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions')
      return false
    }

    return true
  }

  /**
   * Register for push notifications and get Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if running on physical device
      if (Constants.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
        
        this.expoPushToken = token.data
        console.log('📱 Expo Push Token:', this.expoPushToken)

        // Configure Android notification channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('hydration-events', {
            name: 'Hydration Events',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4FC3F7',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
          })

          await Notifications.setNotificationChannelAsync('low-water-alerts', {
            name: 'Low Water Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 250, 500],
            lightColor: '#FF5252',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
          })
        }

        return this.expoPushToken
      } else {
        console.log('Must use physical device for push notifications')
        return null
      }
    } catch (error) {
      console.error('Error getting push token:', error)
      return null
    }
  }

  /**
   * Get the current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken
  }

  /**
   * Show a local notification for hydration event
   */
  async showHydrationNotification(petName: string, amountMl: number, petId?: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Pet Drank Water',
          body: `${petName} just drank ${amountMl}ml of water!`,
          data: { 
            type: 'hydration_event',
            petId,
            amountMl,
            timestamp: new Date().toISOString(),
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      })

      console.log(`✅ Notification sent: ${petName} drank ${amountMl}ml`)
    } catch (error) {
      console.error('Error showing hydration notification:', error)
    }
  }

  /**
   * Show a local notification for low water alert
   */
  async showLowWaterNotification(deviceName?: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Low Water Level',
          body: `${deviceName || 'Your device'} has low water. Please refill soon.`,
          data: { 
            type: 'low_water_alert',
            deviceName,
            timestamp: new Date().toISOString(),
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      })

      console.log('✅ Low water notification sent')
    } catch (error) {
      console.error('Error showing low water notification:', error)
    }
  }

  /**
   * Show a local notification for pet goal achievement
   */
  async showGoalAchievedNotification(petName: string, goalMl: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Daily Goal Achieved!',
          body: `${petName} has reached their daily water goal of ${goalMl}ml!`,
          data: { 
            type: 'goal_achieved',
            petName,
            goalMl,
            timestamp: new Date().toISOString(),
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      })

      console.log(`✅ Goal notification sent: ${petName}`)
    } catch (error) {
      console.error('Error showing goal notification:', error)
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync()
    console.log('✅ All notifications cleared')
  }

  /**
   * Get notification badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync()
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count)
  }

  /**
   * Clear notification badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0)
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback)
  }

  /**
   * Add notification response listener (user taps notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback)
  }
}

export const notificationService = new NotificationService()

