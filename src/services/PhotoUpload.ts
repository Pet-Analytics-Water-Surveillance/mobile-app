import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { supabase } from './supabase'
import uuid from 'react-native-uuid'

export interface UploadResult {
  fullUrl: string
  thumbnailUrl: string
  mlUrl?: string
}

export class PhotoUploadService {
  static async pickImage(fromCamera: boolean = false): Promise<string | null> {
    // Request permissions
    const permissionResult = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permissionResult.granted) {
      alert('Permission to access camera/gallery is required!')
      return null
    }

    // Launch camera or image picker
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1], // Square photos for consistent recognition
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1], // Square photos for consistent recognition
          quality: 0.8,
        })

    if (!result.canceled) {
      return result.assets[0].uri
    }

    return null
  }

  static async processAndUploadImage(
    imageUri: string,
    petId: string,
    saveToDatabase: boolean = true
  ): Promise<UploadResult | null> {
    try {
      console.log('Processing image:', imageUri)
      console.log('Pet ID:', petId)
      
      // Process images for different purposes
      console.log('Processing images in 3 sizes...')
      const [fullImage, thumbnail, mlImage] = await Promise.all([
        this.processImage(imageUri, 800, 0.8),  // Full size for display
        this.processImage(imageUri, 200, 0.6),  // Thumbnail
        this.processImage(imageUri, 224, 0.9),  // ML model size (224x224 for MobileNet)
      ])
      console.log('Image processing complete')

      // Upload all versions
      const timestamp = Date.now()
      const fullPath = `${petId}/${timestamp}_full.jpg`
      const thumbPath = `${petId}/${timestamp}_thumb.jpg`
      const mlPath = `${petId}/${timestamp}_ml.jpg`

      console.log('Uploading images to Supabase storage...')
      const [fullUpload, thumbUpload, mlUpload] = await Promise.all([
        this.uploadToSupabase(fullImage.uri, fullPath),
        this.uploadToSupabase(thumbnail.uri, thumbPath),
        this.uploadToSupabase(mlImage.uri, mlPath),
      ])

      console.log('Upload results:', {
        full: fullUpload ? 'success' : 'failed',
        thumb: thumbUpload ? 'success' : 'failed',
        ml: mlUpload ? 'success' : 'failed'
      })

      if (fullUpload && thumbUpload && mlUpload) {
        // Extract features for recognition (optional - can be done server-side)
        const features = await this.extractFeatures(mlImage.uri)

        // Save to database only if requested and pet exists
        if (saveToDatabase && !petId.startsWith('temp_')) {
          console.log('Saving photo record to database')
          await this.savePhotoRecord(petId, fullUpload, thumbUpload, mlUpload, features)
        }

        return {
          fullUrl: fullUpload,
          thumbnailUrl: thumbUpload,
          mlUrl: mlUpload,
        }
      }

      console.error('One or more uploads failed')
      if (!fullUpload) console.error('Full image upload failed')
      if (!thumbUpload) console.error('Thumbnail upload failed')
      if (!mlUpload) console.error('ML image upload failed')
      
      return null
    } catch (error) {
      console.error('ProcessAndUploadImage error:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      return null
    }
  }

  private static async processImage(
    uri: string,
    size: number,
    quality: number
  ): Promise<ImageManipulator.ImageResult> {
    return await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: size, height: size } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    )
  }

  private static async uploadToSupabase(
    uri: string,
    path: string
  ): Promise<string | null> {
    try {
      console.log('Starting upload to path:', path)
      
      // Convert URI to base64 for React Native compatibility
      const response = await fetch(uri)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      
      const blob = await response.blob()
      console.log('Blob size:', blob.size, 'bytes')
      
      if (blob.size === 0) {
        throw new Error('Image blob is empty')
      }

      // Convert blob to base64 using FileReader for React Native compatibility
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // Remove the data:image/jpeg;base64, prefix
          const base64Data = result.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      console.log('Base64 length:', base64.length)

      // Convert base64 to Uint8Array
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      console.log('Uint8Array size:', bytes.length, 'bytes')

      // Upload Uint8Array to Supabase Storage
      const { data, error } = await supabase.storage
        .from('pet-photos')
        .upload(path, bytes, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (error) {
        console.error('Upload error:', error)
        throw error
      }

      console.log('Upload successful:', data)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(path)

      console.log('Generated public URL:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('Supabase upload error:', error)
      return null
    }
  }

  private static async extractFeatures(imageUri: string): Promise<any> {
    // Option 1: Use TensorFlow.js for on-device feature extraction
    // Option 2: Send to backend API for processing
    // Option 3: Use cloud vision API
    
    // For now, return placeholder - implement based on your ML approach
    return {
      colorHistogram: [],
      textureFeatures: [],
      shapeFeatures: [],
    }
  }

  private static async savePhotoRecord(
    petId: string,
    fullUrl: string,
    thumbnailUrl: string,
    mlUrl: string,
    features: any
  ): Promise<void> {
    // Update main pet record
    await supabase
      .from('pets')
      .update({
        photo_url: fullUrl,
        thumbnail_url: thumbnailUrl,
        ml_image_url: mlUrl,
        recognition_features: features,
      })
      .eq('id', petId)

    // Add to photo history
    await supabase
      .from('pet_photos')
      .insert({
        pet_id: petId,
        photo_url: fullUrl,
        thumbnail_url: thumbnailUrl,
        features: features,
        is_primary: true,
      })
  }

  /**
   * Upload multiple training photos for AI recognition
   * User can choose camera or gallery for each photo
   * @param petId - Pet ID to associate photos with
   * @param numPhotos - Number of photos to capture (default 3)
   * @param onPhotoSelect - Callback to show camera/gallery picker
   */
  static async uploadTrainingPhotos(
    petId: string,
    numPhotos: number = 3,
    onPhotoSelect?: (photoNumber: number) => Promise<'camera' | 'gallery' | 'cancel'>
  ): Promise<boolean> {
    try {
      console.log(`Starting training photo upload for pet ${petId}`)
      
      const uploadedPhotos: UploadResult[] = []

      for (let i = 0; i < numPhotos; i++) {
        let imageUri: string | null = null
        
        // If callback provided, ask user to choose camera or gallery
        if (onPhotoSelect) {
          const choice = await onPhotoSelect(i + 1)
          
          if (choice === 'cancel') {
            console.log(`User cancelled photo ${i + 1}`)
            if (i === 0) return false // If user cancels first photo, abort
            break // If user cancels later photos, continue with what we have
          }
          
          imageUri = await this.pickImage(choice === 'camera')
        } else {
          // Default: use camera
          imageUri = await this.pickImage(true)
        }
        
        if (!imageUri) {
          console.log(`User cancelled photo ${i + 1}`)
          if (i === 0) return false // If user cancels first photo, abort
          break // If user cancels later photos, continue with what we have
        }

        // Process and upload
        const result = await this.processAndUploadImage(imageUri, petId, false)
        
        if (result) {
          uploadedPhotos.push(result)
        }
      }

      if (uploadedPhotos.length === 0) {
        return false
      }

      // Save all training photos to pet_photos table
      const photoRecords = uploadedPhotos.map((photo, index) => ({
        pet_id: petId,
        photo_url: photo.fullUrl,
        thumbnail_url: photo.thumbnailUrl,
        is_primary: index === 0, // First photo is primary
        features: null,
      }))

      const { error } = await supabase
        .from('pet_photos')
        .insert(photoRecords)

      if (error) {
        console.error('Error saving training photos:', error)
        return false
      }

      // Update pet's main photo to the first training photo
      if (uploadedPhotos[0]) {
        await supabase
          .from('pets')
          .update({
            photo_url: uploadedPhotos[0].fullUrl,
            thumbnail_url: uploadedPhotos[0].thumbnailUrl,
            ml_image_url: uploadedPhotos[0].mlUrl,
          })
          .eq('id', petId)
      }

      console.log(`Successfully uploaded ${uploadedPhotos.length} training photos`)
      return true
    } catch (error) {
      console.error('Training photos upload error:', error)
      return false
    }
  }
}