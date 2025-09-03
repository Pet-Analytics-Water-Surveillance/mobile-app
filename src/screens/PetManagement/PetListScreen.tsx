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

export default function PetListScreen() {
  const navigation = useNavigation<any>()
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)

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

  const renderPetItem = ({ item }: any) => {
    console.log('Rendering pet item:', {
      name: item.name,
      photo_url: item.photo_url,
      thumbnail_url: item.thumbnail_url
    })

    return (
      <TouchableOpacity
        style={styles.petCard}
        onPress={() => navigation.navigate('PetEdit', { petId: item.id })}
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
              color="#2196F3" 
            />
          )}
        </View>
      
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petDetails}>
          {item.species} • {item.weight_kg}kg • Goal: {item.daily_water_goal_ml}ml/day
        </Text>
        {item.rfid_tag && (
          <View style={styles.tagBadge}>
            <Ionicons name="pricetag" size={12} color="#666" />
            <Text style={styles.tagText}>Tagged</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={() => deletePet(item.id, item.name)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading pets...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={pets}
        renderItem={renderPetItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="paw-outline" size={64} color="#C0C0C0" />
            <Text style={styles.emptyText}>No pets added yet</Text>
            <Text style={styles.emptySubtext}>Add your first pet to start tracking their hydration</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('PetAdd')}
            >
              <Text style={styles.addButtonText}>Add Pet</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PetAdd')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    padding: 20,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  petAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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
    color: '#333',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    marginHorizontal: 40,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
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
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
})
