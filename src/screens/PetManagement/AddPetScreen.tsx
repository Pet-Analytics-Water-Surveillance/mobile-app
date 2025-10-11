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
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

export default function AddPetScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)
  
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
            activeOpacity={0.85}
          >
            {uploadingPhoto ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.petPhoto} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.photoText}>Tap to add photo</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handlePickImage(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="camera" size={20} color={theme.colors.primary} />
              <Text style={styles.photoButtonText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handlePickImage(false)}
              activeOpacity={0.75}
            >
              <Ionicons name="images" size={20} color={theme.colors.primary} />
              <Text style={styles.photoButtonText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleTakeMultiplePhotos}
              activeOpacity={0.75}
            >
              <Ionicons name="school" size={20} color={theme.colors.primary} />
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
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Species *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={petData.species}
                onValueChange={(value) => setPetData({ ...petData, species: value })}
                style={styles.picker}
                dropdownIconColor={theme.colors.text}
              >
                <Picker.Item label="Dog" value="dog" color={theme.colors.text} />
                <Picker.Item label="Cat" value="cat" color={theme.colors.text} />
                <Picker.Item label="Other" value="other" color={theme.colors.text} />
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
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <TextInput
              style={styles.input}
              value={petData.weight}
              onChangeText={(text) => setPetData({ ...petData, weight: text })}
              placeholder="Enter weight"
              placeholderTextColor={theme.colors.textSecondary}
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
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Water Goal (ml)</Text>
            <TextInput
              style={styles.input}
              value={petData.dailyWaterGoal}
              onChangeText={(text) => setPetData({ ...petData, dailyWaterGoal: text })}
              placeholder="500"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={savePet}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>Add Pet</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 0,
    },
    photoSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    photoHelp: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 15,
    },
    photoContainer: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    petPhoto: {
      width: 150,
      height: 150,
      borderRadius: 75,
    },
    photoText: {
      marginTop: 10,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    photoButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 8,
    },
    photoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: theme.colors.overlay,
    },
    photoButtonText: {
      marginLeft: 6,
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    formSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
    },
    picker: {
      color: theme.colors.text,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 24,
      marginHorizontal: 0,
    },
    saveButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
  })
