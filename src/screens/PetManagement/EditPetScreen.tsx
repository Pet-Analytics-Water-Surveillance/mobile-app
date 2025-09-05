import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { PhotoUploadService } from '../../services/PhotoUpload'
import { supabase } from '../../services/supabase'

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
  birth_date?: string
}

export default function EditPetScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { petId } = route.params as { petId: string }
  
  const [loading, setLoading] = useState(false)
  const [loadingPet, setLoadingPet] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  const [petData, setPetData] = useState({
    name: '',
    breed: '',
    weight: '',
    birthDate: '',
    rfidTag: '',
    dailyWaterGoal: '',
  })
  
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState<string | null>(null)

  useEffect(() => {
    loadPetData()
  }, [])

  const loadPetData = async () => {
    try {
      console.log('Loading pet data for ID:', petId)
      setLoadingPet(true)
      
      const { data: pet, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single()

      if (error) {
        console.error('Error loading pet:', error)
        Alert.alert('Error', 'Failed to load pet data')
        navigation.goBack()
        return
      }

      console.log('Pet data loaded:', pet)
      
      // Set form data
      setPetData({
        name: pet.name || '',
        breed: pet.breed || '',
        weight: pet.weight_kg?.toString() || '',
        birthDate: pet.birth_date || '',
        rfidTag: pet.rfid_tag || '',
        dailyWaterGoal: pet.daily_water_goal_ml?.toString() || '500',
      })

      // Set photo URLs
      setUploadedPhotoUrl(pet.photo_url || null)
      setUploadedThumbnailUrl(pet.thumbnail_url || null)
      setPhotoUri(pet.thumbnail_url || pet.photo_url || null)
      
    } catch (error) {
      console.error('Load pet error:', error)
      Alert.alert('Error', 'Failed to load pet data')
      navigation.goBack()
    } finally {
      setLoadingPet(false)
    }
  }

  const handlePickImage = async (fromCamera: boolean) => {
    const uri = await PhotoUploadService.pickImage(fromCamera)
    if (uri) {
      setPhotoUri(uri)
      // Upload immediately for preview
      await uploadPhoto(uri)
    }
  }

  const uploadPhoto = async (uri: string) => {
    setUploadingPhoto(true)
    
    try {
      // Use actual pet ID for upload path
      const result = await PhotoUploadService.processAndUploadImage(uri, petId, false)
      
      if (result) {
        setUploadedPhotoUrl(result.fullUrl)
        setUploadedThumbnailUrl(result.thumbnailUrl)
        console.log('Photo uploaded:', {
          fullUrl: result.fullUrl,
          thumbnailUrl: result.thumbnailUrl
        })
        Alert.alert('Success', 'Photo uploaded successfully!')
      } else {
        Alert.alert('Error', 'Failed to upload photo')
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      Alert.alert('Error', 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleTakeMultiplePhotos = () => {
    Alert.alert(
      'Training Photos',
      'Take multiple photos from different angles for better recognition. This feature will be available soon!',
      [
        { text: 'OK', style: 'default' }
      ]
    )
  }

  const updatePet = async () => {
    console.log('Update pet button pressed')
    console.log('Pet data:', petData)
    console.log('Uploaded photo URL:', uploadedPhotoUrl)
    
    if (!petData.name || !petData.weight) {
      Alert.alert('Error', 'Please fill in required fields')
      return
    }

    setLoading(true)

    try {
      console.log('Updating pet...')
      const { data: pet, error } = await supabase
        .from('pets')
        .update({
          name: petData.name,
          breed: petData.breed,
          weight_kg: parseFloat(petData.weight),
          birth_date: petData.birthDate || null,
          rfid_tag: petData.rfidTag || null,
          daily_water_goal_ml: parseInt(petData.dailyWaterGoal),
          photo_url: uploadedPhotoUrl,
          thumbnail_url: uploadedThumbnailUrl,
        })
        .eq('id', petId)
        .select()
        .single()

      if (error) {
        console.error('Pet update error:', error)
        throw error
      }

      console.log('Pet updated successfully:', pet)
      Alert.alert('Success', 'Pet updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (error) {
      console.error('Update pet error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      Alert.alert('Error', `Failed to update pet: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (loadingPet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading pet data...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never">
        {/* Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Pet Photo</Text>
          <Text style={styles.photoHelp}>
            Add photos to enable visual recognition
          </Text>
          
          <TouchableOpacity 
            style={styles.photoContainer}
            onPress={() => handlePickImage(false)}
          >
            {uploadingPhoto ? (
              <ActivityIndicator size="large" color="#2196F3" />
            ) : photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.petPhoto} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={48} color="#999" />
                <Text style={styles.photoText}>Tap to add photo</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.photoButtons}>
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={() => handlePickImage(true)}
            >
              <Ionicons name="camera" size={20} color="#2196F3" />
              <Text style={styles.photoButtonText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={() => handlePickImage(false)}
            >
              <Ionicons name="images" size={20} color="#2196F3" />
              <Text style={styles.photoButtonText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={handleTakeMultiplePhotos}
            >
              <Ionicons name="school" size={20} color="#2196F3" />
              <Text style={styles.photoButtonText}>Train AI</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pet Information Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Pet Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={petData.name}
              onChangeText={(text) => setPetData({ ...petData, name: text })}
              placeholder="Enter pet name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Breed</Text>
            <TextInput
              style={styles.input}
              value={petData.breed}
              onChangeText={(text) => setPetData({ ...petData, breed: text })}
              placeholder="e.g., Golden Retriever"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <TextInput
              style={styles.input}
              value={petData.weight}
              onChangeText={(text) => setPetData({ ...petData, weight: text })}
              placeholder="Enter weight"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Date</Text>
            <TextInput
              style={styles.input}
              value={petData.birthDate}
              onChangeText={(text) => setPetData({ ...petData, birthDate: text })}
              placeholder="YYYY-MM-DD (optional)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>RFID Tag ID</Text>
            <TextInput
              style={styles.input}
              value={petData.rfidTag}
              onChangeText={(text) => setPetData({ ...petData, rfidTag: text })}
              placeholder="Optional - for RFID recognition"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Water Goal (ml)</Text>
            <TextInput
              style={styles.input}
              value={petData.dailyWaterGoal}
              onChangeText={(text) => setPetData({ ...petData, dailyWaterGoal: text })}
              placeholder="500"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={updatePet}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Update Pet</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 0,
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
  photoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  photoHelp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  photoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  petPhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  photoText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
  },
  photoButtonText: {
    marginLeft: 6,
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 0,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
})
