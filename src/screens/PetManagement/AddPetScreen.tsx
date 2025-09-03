import React, { useState } from 'react'
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
import { useNavigation } from '@react-navigation/native'
import { Picker } from '@react-native-picker/picker'
import { PhotoUploadService } from '../../services/PhotoUpload'
import { HouseholdService } from '../../services/HouseholdService'
import { supabase } from '../../services/supabase'

export default function AddPetScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  const [petData, setPetData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    weight: '',
    birthDate: '',
    rfidTag: '',
    dailyWaterGoal: '500',
  })
  
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState<string | null>(null)

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
    
    // Create temporary pet ID for folder structure
    const tempPetId = `temp_${Date.now()}`
    
    const result = await PhotoUploadService.processAndUploadImage(uri, tempPetId, false)
    
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
    
    setUploadingPhoto(false)
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

  const savePet = async () => {
    console.log('Save pet button pressed')
    console.log('Pet data:', petData)
    console.log('Uploaded photo URL:', uploadedPhotoUrl)
    
    if (!petData.name || !petData.weight) {
      Alert.alert('Error', 'Please fill in required fields')
      return
    }

    setLoading(true)

        try {
      console.log('Getting or creating household...')
      const householdId = await HouseholdService.getOrCreateHousehold()
      console.log('Household ID:', householdId)

      console.log('Inserting pet...')
      const { data: pet, error } = await supabase
        .from('pets')
        .insert({
          household_id: householdId,
          name: petData.name,
          species: petData.species,
          breed: petData.breed,
          weight_kg: parseFloat(petData.weight),
          birth_date: petData.birthDate || null,
          rfid_tag: petData.rfidTag || null,
          daily_water_goal_ml: parseInt(petData.dailyWaterGoal),
          photo_url: uploadedPhotoUrl,
          thumbnail_url: uploadedThumbnailUrl,
        })
        .select()
        .single()

      if (error) {
        console.error('Pet insert error:', error)
        throw error
      }

      console.log('Pet inserted successfully:', pet)
      Alert.alert('Success', 'Pet added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (error) {
      console.error('Save pet error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      Alert.alert('Error', `Failed to add pet: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
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
            <Text style={styles.label}>Species *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={petData.species}
                onValueChange={(value) => setPetData({ ...petData, species: value })}
              >
                <Picker.Item label="Dog" value="dog" />
                <Picker.Item label="Cat" value="cat" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
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
          onPress={savePet}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Add Pet</Text>
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
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