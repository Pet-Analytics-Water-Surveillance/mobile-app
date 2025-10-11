import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { supabase } from '../../services/supabase'
import { HouseholdService } from '../../services/HouseholdService'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

// Define Pet type
interface Pet {
  id: string
  name: string
  species: string
  breed?: string
  weight_kg: number
  daily_water_goal_ml: number
  photo_url?: string
  thumbnail_url?: string
  rfid_tag?: string
  household_id: string
  created_at: string
  updated_at: string
}

export default function PetListScreen() {
  const navigation = useNavigation<any>()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

  useEffect(() => {
    loadPets()
  }, [])

  // Reload pets when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadPets()
    }, [])
  )

  const loadPets = async () => {
    try {
      console.log('Loading pets...')
      setLoading(true)
      
      // Get household ID using the HouseholdService
      const householdId = await HouseholdService.getOrCreateHousehold()
      console.log('Household ID for pets:', householdId)
      
      // Load pets for this household
      const { data: petsData, error } = await supabase
        .from('pets')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error loading pets:', error)
        throw error
      }
      
      console.log('Pets data:', petsData)
      setPets(petsData || [])
    } catch (error) {
      console.error('Load pets error:', error)
      Alert.alert('Error', 'Failed to load pets')
      setPets([])
    } finally {
      setLoading(false)
    }
  }

  const deletePet = (petId: string, petName: string) => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to remove ${petName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('pets').delete().eq('id', petId)
            loadPets()
          }
        }
      ]
    )
  }
  const renderPetItem = ({ item }: { item: Pet }) => {
    console.log('Rendering pet item:', {
      name: item.name,
      photo_url: item.photo_url,
      thumbnail_url: item.thumbnail_url
    })

    return (
      <TouchableOpacity
        style={styles.petCard}
        onPress={() => navigation.navigate('PetEdit', { petId: item.id })}
        activeOpacity={0.85}
      >
        <View style={styles.petAvatar}>
          {(item.thumbnail_url || item.photo_url) ? (
            <Image 
              source={{ uri: item.thumbnail_url || item.photo_url }} 
              style={styles.petImage}
              onError={(error) => {
                console.log('Image load error:', error.nativeEvent.error)
              }}
              onLoadStart={() => {
                console.log('Image loading started for:', item.name)
              }}
              onLoadEnd={() => {
                console.log('Image loading ended for:', item.name)
              }}
            />
          ) : (
            <Ionicons
              name={item.species === 'cat' ? 'logo-octocat' : 'paw'}
              size={40}
              color={theme.colors.primary}
            />
          )}
        </View>
      
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petDetails}>
          {item.breed ? `${item.breed} • ` : ''}{item.weight_kg}kg • Goal: {item.daily_water_goal_ml}ml/day
        </Text>
        {item.rfid_tag && (
          <View style={styles.tagBadge}>
            <Ionicons name={'pricetag' as any} size={12} color={theme.colors.textSecondary} />
            <Text style={styles.tagText}>Tagged</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={() => deletePet(item.id, item.name)}
        style={styles.deleteButton}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading pets...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={pets}
        renderItem={renderPetItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="paw-outline" size={64} color={theme.colors.muted} />
            <Text style={styles.emptyText}>No pets added yet</Text>
            <Text style={styles.emptySubtext}>Add your first pet to start tracking their hydration</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('PetAdd')}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>Add Pet</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PetAdd')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color={theme.colors.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 80,
    },
    petCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.mode === 'dark' ? 0 : 0.05,
      shadowRadius: 3,
      elevation: theme.mode === 'dark' ? 0 : 2,
    },
    petAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    petImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    petInfo: {
      flex: 1,
    },
    petName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    petDetails: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    tagBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.overlay,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      alignSelf: 'flex-start',
      marginTop: 4,
      gap: 4,
    },
    tagText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    deleteButton: {
      padding: 10,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      marginTop: 60,
      paddingHorizontal: 20,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 20,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
      marginHorizontal: 40,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      marginTop: 20,
    },
    addButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.mode === 'dark' ? 0 : 0.3,
      shadowRadius: 4,
      elevation: theme.mode === 'dark' ? 0 : 8,
    },
  })
