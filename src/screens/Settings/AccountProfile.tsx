// src/screens/Settings/AccountProfile.tsx
import React, { useMemo, useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ProfileService } from '../../services/ProfileService'
import { HouseholdService, Household } from '../../services/HouseholdService'
import JoinHouseholdModal from '../../components/JoinHouseholdModal'
import { AccountProfileNavigationProp } from '../../navigation/types'
import { AppTheme, useAppTheme, useThemedStyles } from '../../theme'

interface Props {
  navigation: AccountProfileNavigationProp
}

export default function AccountProfile({ navigation }: Props) {
  // Profile state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [units, setUnits] = useState<'Metric' | 'Imperial'>('Metric');
  const [notifications, setNotifications] = useState(true);

  // Household state
  const [household, setHousehold] = useState<Household | null>(null);
  const [householdName, setHouseholdName] = useState('');
  const [isHouseholdOwner, setIsHouseholdOwner] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const [initial, setInitial] = useState({
    avatarUri: null as string | null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthday: '',
    units: 'Metric' as 'Metric' | 'Imperial',
    notifications: true,
    householdName: '',
  });
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  // Load data on component mount
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Load profile data
      const profile = await ProfileService.getCurrentProfile();
      if (profile) {
        setAvatarUri(profile.avatar_url || null);
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setEmail(profile.email || '');
        setPhone(profile.phone || '');
        setBirthday(profile.user_metadata?.birthday || '');
        setUnits(profile.user_metadata?.units || 'Metric');
        setNotifications(profile.user_metadata?.notifications ?? true);
      }

      // Load household data
      const currentHousehold = await HouseholdService.getCurrentHousehold();
      setHousehold(currentHousehold);
      setHouseholdName(currentHousehold?.name || '');
      
      const isOwner = await HouseholdService.isHouseholdOwner();
      setIsHouseholdOwner(isOwner);

      // Set initial values for change detection
      setInitial({
        avatarUri: profile?.avatar_url || null,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        birthday: profile?.user_metadata?.birthday || '',
        units: profile?.user_metadata?.units || 'Metric',
        notifications: profile?.user_metadata?.notifications ?? true,
        householdName: currentHousehold?.name || '',
      });
    } catch (error) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = useMemo(() => {
    return (
      avatarUri !== initial.avatarUri ||
      firstName !== initial.firstName ||
      lastName !== initial.lastName ||
      email !== initial.email ||
      phone !== initial.phone ||
      birthday !== initial.birthday ||
      units !== initial.units ||
      notifications !== initial.notifications ||
      householdName !== initial.householdName
    );
  }, [avatarUri, firstName, lastName, email, phone, birthday, units, notifications, householdName, initial]);

  const onSave = async () => {
    try {
      setSaving(true);
      
      // Update profile
      await ProfileService.updateProfile({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        user_metadata: {
          birthday: birthday,
          units: units,
          notifications: notifications,
        },
      });

      // Update household name if changed and user is owner
      if (householdName !== initial.householdName && isHouseholdOwner && household) {
        await HouseholdService.updateHousehold({ name: householdName });
      }

      // Update initial values
      setInitial({
        avatarUri,
        firstName,
        lastName,
        email,
        phone,
        birthday,
        units,
        notifications,
        householdName,
      });

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setAvatarUri(initial.avatarUri);
    setFirstName(initial.firstName);
    setLastName(initial.lastName);
    setEmail(initial.email);
    setPhone(initial.phone);
    setBirthday(initial.birthday);
    setUnits(initial.units);
    setNotifications(initial.notifications);
    setHouseholdName(initial.householdName);
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.subtitle}>Edit your personal information</Text>

        {/* Personal Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          
          <Text style={styles.label}>First name</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Your First name"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>Last name</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Your Last name"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>Birthday</Text>
          <TextInput
            value={birthday}
            onChangeText={setBirthday}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
          />
        </View>
          
        {/* Contact info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="name@domain.com"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 ..."
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
          />
        </View>

        {/* Household Management */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Household</Text>
          
          <Text style={styles.label}>Household Name</Text>
          <TextInput
            value={householdName}
            onChangeText={setHouseholdName}
            placeholder="Your household name"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, !isHouseholdOwner && { opacity: 0.6 }]}
            editable={isHouseholdOwner}
          />
          
          {!isHouseholdOwner && (
            <Text style={styles.helper}>
              Only household owners can change the household name
            </Text>
          )}
          
          <View style={styles.householdInfo}>
            <View style={styles.householdItem}>
              <Ionicons name="people-outline" size={18} color={theme.colors.textSecondary} />
              <Text style={styles.householdText}>
                Role: {isHouseholdOwner ? 'Owner' : 'Member'}
              </Text>
            </View>
            
            {household && (
              <View style={styles.householdItem}>
                <Ionicons name="home-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.householdText}>
                  ID: {household.id.slice(0, 8)}...
                </Text>
              </View>
            )}
          </View>

          <View style={styles.householdActions}>
            {isHouseholdOwner && (
              <TouchableOpacity 
                style={styles.householdActionButton}
                onPress={() => navigation.navigate('HouseholdInvites')}
              >
                <Ionicons name="mail-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.householdActionText}>Manage Invites</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.householdActionButton}
              onPress={() => setShowJoinModal(true)}
            >
              <Ionicons name="add-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.householdActionText}>Join Household</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <Text style={styles.label}>Units</Text>
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentBtn, units === 'Metric' && styles.segmentBtnActive]}
              onPress={() => setUnits('Metric')}
            >
              <Text style={[styles.segmentText, units === 'Metric' && styles.segmentTextActive]}>
                Metric
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, units === 'Imperial' && styles.segmentBtnActive]}
              onPress={() => setUnits('Imperial')}
            >
              <Text style={[styles.segmentText, units === 'Imperial' && styles.segmentTextActive]}>
                Imperial
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.label}>Push Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: theme.colors.border, true: theme.colors.switchTrack }}
              thumbColor={notifications ? theme.colors.switchThumb : theme.colors.surface}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onCancel} disabled={!hasChanges}>
            <Text style={styles.btnTextSecondary}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, styles.btnPrimary, (!hasChanges || saving) && { opacity: 0.6 }]} 
            onPress={onSave} 
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                <Text style={styles.btnTextPrimary}>Saving...</Text>
              </>
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={theme.colors.onPrimary} />
                <Text style={styles.btnTextPrimary}>Save changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
      
      <JoinHouseholdModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={loadProfileData}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      padding: 16,
      paddingBottom: 40,
      gap: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.mode === 'dark' ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.mode === 'dark' ? 0 : 0.05,
      shadowRadius: 2,
      elevation: theme.mode === 'dark' ? 0 : 1,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarWrap: { position: 'relative' },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    avatarEditBtn: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      backgroundColor: theme.colors.primary,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface,
      elevation: theme.mode === 'dark' ? 0 : 1,
    },
    label: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 8,
      marginBottom: 6,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.colors.text,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    segmentBtnActive: { backgroundColor: theme.colors.primary },
    segmentText: { color: theme.colors.textSecondary, fontWeight: '600' },
    segmentTextActive: { color: theme.colors.onPrimary },
    toggleRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    helper: { color: theme.colors.textSecondary, fontSize: 12 },
    actions: { marginTop: 8, flexDirection: 'row', gap: 10 },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 8,
    },
    btnSecondary: { flex: 1, backgroundColor: theme.colors.surface },
    btnPrimary: {
      flex: 2,
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    btnTextSecondary: { fontWeight: '700', color: theme.colors.text },
    btnTextPrimary: { fontWeight: '700', color: theme.colors.onPrimary },
    householdInfo: { marginTop: 12, gap: 8 },
    householdItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    householdText: { color: theme.colors.textSecondary, fontSize: 14 },
    householdActions: { marginTop: 16, gap: 8 },
    householdActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 8,
    },
    householdActionText: { color: theme.colors.primary, fontWeight: '600' },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: theme.colors.textSecondary,
      fontSize: 16,
      marginTop: 16,
    },
  })
