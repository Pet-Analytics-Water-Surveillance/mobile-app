import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { PhotoUploadService } from '../../services/PhotoUpload'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

interface TrainAIRouteParams {
  petId: string
  petName: string
}

export default function TrainAIScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const params = route.params as TrainAIRouteParams | undefined
  const { theme } = useAppTheme()
  const styles = useThemedStyles(createStyles)

  const [photo1Uri, setPhoto1Uri] = useState<string | null>(null)
  const [photo2Uri, setPhoto2Uri] = useState<string | null>(null)
  const [photo3Uri, setPhoto3Uri] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Validate required parameters
  React.useEffect(() => {
    if (!params?.petId || !params?.petName) {
      Alert.alert(
        'Missing Pet Information',
        'Please save your pet first before training AI.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )
    }
  }, [params, navigation])

  // Early return with safe defaults if params are missing
  if (!params?.petId || !params?.petName) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  const { petId, petName } = params

  const selectPhotoSource = (photoNumber: 1 | 2 | 3) => {
    Alert.alert(
      `Photo ${photoNumber}`,
      'Choose photo source:',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        { 
          text: 'Camera',
          onPress: () => pickPhoto(photoNumber, true)
        },
        { 
          text: 'Gallery',
          onPress: () => pickPhoto(photoNumber, false)
        }
      ]
    )
  }

  const pickPhoto = async (photoNumber: 1 | 2 | 3, useCamera: boolean) => {
    try {
      const uri = await PhotoUploadService.pickImage(useCamera)
      
      if (uri) {
        switch (photoNumber) {
          case 1:
            setPhoto1Uri(uri)
            break
          case 2:
            setPhoto2Uri(uri)
            break
          case 3:
            setPhoto3Uri(uri)
            break
        }
      }
    } catch (error) {
      console.error('Error picking photo:', error)
      Alert.alert('Error', 'Failed to select photo')
    }
  }

  const removePhoto = (photoNumber: 1 | 2 | 3) => {
    switch (photoNumber) {
      case 1:
        setPhoto1Uri(null)
        break
      case 2:
        setPhoto2Uri(null)
        break
      case 3:
        setPhoto3Uri(null)
        break
    }
  }

  const uploadTrainingPhotos = async () => {
    const photoUris = [photo1Uri, photo2Uri, photo3Uri].filter(uri => uri !== null) as string[]
    
    if (photoUris.length === 0) {
      Alert.alert('No Photos', 'Please add at least one training photo')
      return
    }

    Alert.alert(
      'Upload Training Photos',
      `Upload ${photoUris.length} photo${photoUris.length > 1 ? 's' : ''}?\n\nTip: 3 photos from different angles work best!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload',
          onPress: async () => {
            setUploading(true)
            try {
              console.log('Starting upload for pet:', petId)
              console.log('Number of photos to upload:', photoUris.length)
              
              // Process and upload each photo
              const uploadResults = []
              
              for (let i = 0; i < photoUris.length; i++) {
                const uri = photoUris[i]
                console.log(`Uploading photo ${i + 1}/${photoUris.length}:`, uri)
                
                const result = await PhotoUploadService.processAndUploadImage(uri, petId, false)
                
                if (result) {
                  console.log(`Photo ${i + 1} uploaded successfully:`, result)
                  uploadResults.push(result)
                } else {
                  console.error(`Photo ${i + 1} upload failed - received null result`)
                }
              }

              console.log('Upload results:', uploadResults.length, 'out of', photoUris.length, 'succeeded')

              if (uploadResults.length === 0) {
                throw new Error('All photo uploads failed. Please check your internet connection and storage permissions.')
              }

              // Save all training photos to pet_photos table
              const { supabase } = require('../../services/supabase')
              
              console.log('Preparing to save photo records to database')
              const photoRecords = uploadResults.map((photo, index) => ({
                pet_id: petId,
                photo_url: photo.fullUrl,
                thumbnail_url: photo.thumbnailUrl,
                is_primary: index === 0,
                features: null,
              }))

              console.log('Inserting photo records:', photoRecords.length)
              const { error: insertError } = await supabase
                .from('pet_photos')
                .insert(photoRecords)

              if (insertError) {
                console.error('Database insert error:', insertError)
                throw new Error(`Failed to save photos to database: ${insertError.message}`)
              }

              console.log('Photo records saved successfully')

              // Update pet's main photo to the first training photo
              if (uploadResults[0]) {
                console.log('Updating pet main photo')
                const { error: updateError } = await supabase
                  .from('pets')
                  .update({
                    photo_url: uploadResults[0].fullUrl,
                    thumbnail_url: uploadResults[0].thumbnailUrl,
                    ml_image_url: uploadResults[0].mlUrl,
                  })
                  .eq('id', petId)

                if (updateError) {
                  console.error('Pet update error:', updateError)
                  // Don't throw - the photos are uploaded, just the main photo update failed
                }
              }

              console.log('All operations completed successfully')
              Alert.alert(
                'Success! 🎉',
                `${uploadResults.length} training photo${uploadResults.length > 1 ? 's' : ''} uploaded successfully!\n\n${petName} can now be recognized by the device.`,
                [
                  {
                    text: 'Done',
                    onPress: () => navigation.goBack()
                  }
                ]
              )
            } catch (error) {
              console.error('Upload error:', error)
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
              Alert.alert(
                'Upload Failed',
                `${errorMessage}\n\nPlease try again or check:\n• Internet connection\n• Storage permissions\n• Supabase storage bucket`,
                [{ text: 'OK' }]
              )
            } finally {
              setUploading(false)
            }
          }
        }
      ]
    )
  }

  const renderPhotoSlot = (
    photoNumber: 1 | 2 | 3, 
    photoUri: string | null,
    title: string,
    subtitle: string
  ) => (
    <View style={styles.photoSlot}>
      <View style={styles.photoSlotHeader}>
        <View>
          <Text style={styles.photoSlotTitle}>{title}</Text>
          <Text style={styles.photoSlotSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.photoSlotNumber}>
          <Text style={styles.photoSlotNumberText}>{photoNumber}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.photoBox, photoUri ? styles.photoBoxFilled : null]}
        onPress={() => selectPhotoSource(photoNumber)}
        activeOpacity={0.7}
      >
        {photoUri ? (
          <>
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removePhoto(photoNumber)}
            >
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
            <Text style={styles.photoPlaceholderSubtext}>Camera or Gallery</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerLeft}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Train AI for {petName}
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.instructionHeader}>
            <Ionicons name="bulb" size={24} color={theme.colors.primary} />
            <Text style={styles.instructionTitle}>Training Tips</Text>
          </View>
          <Text style={styles.instructionText}>
            • Add 3 photos from different angles{'\n'}
            • Front, left side, and right side views work best{'\n'}
            • Use good lighting and clear, focused shots{'\n'}
            • You can use camera or select from gallery
          </Text>
        </View>

        {/* Photo Slots */}
        {renderPhotoSlot(1, photo1Uri, 'Photo 1', 'Front view recommended')}
        {renderPhotoSlot(2, photo2Uri, 'Photo 2', 'Left side view')}
        {renderPhotoSlot(3, photo3Uri, 'Photo 3', 'Right side view')}

        {/* Upload Button */}
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!photo1Uri && !photo2Uri && !photo3Uri) || uploading
              ? styles.uploadButtonDisabled
              : null
          ]}
          onPress={uploadTrainingPhotos}
          disabled={(!photo1Uri && !photo2Uri && !photo3Uri) || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>
                Upload Training Photos
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 1,
      paddingBottom: 32,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 0,
      paddingVertical: 12,
    },
    headerLeft: {
      minWidth: 90,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    headerLeftText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      flex: 1,
    },
    headerRight: {
      minWidth: 90,
    },
    instructionsCard: {
      backgroundColor: theme.colors.surface,
      width: '100%',
      marginBottom: 24,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    instructionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    instructionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 8,
    },
    instructionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    photoSlot: {
      width: '100%',
      marginBottom: 20,
    },
    photoSlotHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    photoSlotTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    photoSlotSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    photoSlotNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoSlotNumberText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    photoBox: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      overflow: 'hidden',
    },
    photoBoxFilled: {
      borderStyle: 'solid',
      borderColor: theme.colors.primary,
    },
    photoImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    photoPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    photoPlaceholderText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 12,
      fontWeight: '500',
    },
    photoPlaceholderSubtext: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    removeButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 16,
    },
    uploadButton: {
      flexDirection: 'row',
      backgroundColor: theme.colors.primary,
      width: '100%',
      marginTop: 12,
      paddingVertical: 16,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    uploadButtonDisabled: {
      opacity: 0.5,
    },
    uploadButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  })
