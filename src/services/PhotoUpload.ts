import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { supabase } from './supabase'
import uuid from 'react-native-uuid'

export interface UploadResult {
  fullUrl: string
  thumbnailUrl: string
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
      // Process images for different purposes
      const [fullImage, thumbnail, mlImage] = await Promise.all([
        this.processImage(imageUri, 800, 0.8),  // Full size for display
        this.processImage(imageUri, 200, 0.6),  // Thumbnail
        this.processImage(imageUri, 224, 0.9),  // ML model size (224x224 for MobileNet)
      ])

      // Upload all versions
      const timestamp = Date.now()
      const fullPath = `${petId}/${timestamp}_full.jpg`
      const thumbPath = `${petId}/${timestamp}_thumb.jpg`
      const mlPath = `${petId}/${timestamp}_ml.jpg`

      const [fullUpload, thumbUpload, mlUpload] = await Promise.all([
        this.uploadToSupabase(fullImage.uri, fullPath),
        this.uploadToSupabase(thumbnail.uri, thumbPath),
        this.uploadToSupabase(mlImage.uri, mlPath),
      ])

      if (fullUpload && thumbUpload && mlUpload) {
        // Extract features for recognition (optional - can be done server-side)
        const features = await this.extractFeatures(mlImage.uri)

        // Save to database only if requested and pet exists
        if (saveToDatabase && !petId.startsWith('temp_')) {
          await this.savePhotoRecord(petId, fullUpload, thumbUpload, features)
        }

        return {
          fullUrl: fullUpload,
          thumbnailUrl: thumbUpload,
        }
      }

      return null
    } catch (error) {
      console.error('Upload error:', error)
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
    features: any
  ): Promise<void> {
    // Update main pet record
    await supabase
      .from('pets')
      .update({
        photo_url: fullUrl,
        thumbnail_url: thumbnailUrl,
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
}