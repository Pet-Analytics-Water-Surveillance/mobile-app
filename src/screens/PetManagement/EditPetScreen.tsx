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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { PhotoUploadService } from '../../services/PhotoUpload'
import { supabase } from '../../services/supabase'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'
import type { SettingsStackParamList } from '../../navigation/types'

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
  const navigation = useNavigation<StackNavigationProp<SettingsStackParamList>>()
  const route = useRoute()
  const { petId } = route.params as { petId: string }
  
  const [loading, setLoading] = useState(false)
  const [loadingPet, setLoadingPet] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)
  const insets = useSafeAreaInsets()
  const contentPaddingBottom = insets.bottom + 60
  
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
    // Navigate to dedicated Train AI screen
    navigation.navigate('TrainAI', { 
      petId: petId, 
      petName: petData.name 
    })
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
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading pet data...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      >
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
              placeholderTextColor={theme.colors.textSecondary}
              placeholder="Enter pet name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Breed</Text>
            <TextInput
              style={styles.input}
              value={petData.breed}
              onChangeText={(text) => setPetData({ ...petData, breed: text })}
              placeholderTextColor={theme.colors.textSecondary}
              placeholder="e.g., Golden Retriever"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <TextInput
              style={styles.input}
              value={petData.weight}
              onChangeText={(text) => setPetData({ ...petData, weight: text })}
              placeholderTextColor={theme.colors.textSecondary}
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
              placeholderTextColor={theme.colors.textSecondary}
              placeholder="YYYY-MM-DD (optional)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>RFID Tag ID</Text>
            <TextInput
              style={styles.input}
              value={petData.rfidTag}
              onChangeText={(text) => setPetData({ ...petData, rfidTag: text })}
              placeholderTextColor={theme.colors.textSecondary}
              placeholder="Optional - for RFID recognition"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Water Goal (ml)</Text>
            <TextInput
              style={styles.input}
              value={petData.dailyWaterGoal}
              onChangeText={(text) => setPetData({ ...petData, dailyWaterGoal: text })}
              placeholderTextColor={theme.colors.textSecondary}
              placeholder="500"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={updatePet}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>Update Pet</Text>
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
    saveButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 16,
    },
    saveButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      color: theme.colors.textSecondary,
      fontSize: 16,
    },
  })
