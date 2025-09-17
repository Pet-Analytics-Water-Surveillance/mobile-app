// src/screens/Settings/AccountProfile.tsx
import React, { useMemo, useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileService, UserProfile } from '../../services/ProfileService';
import { HouseholdService, Household } from '../../services/HouseholdService';
import JoinHouseholdModal from '../../components/JoinHouseholdModal';
import { AccountProfileNavigationProp } from '../../navigation/types';

const theme = {
  // keep this in sync with your app colors
  primary: '#1e90ff',
  text: '#0f172a',
  subtext: '#64748b',
  bg: '#ffffff',
  card: '#f8fafc',
  border: '#e2e8f0',
  danger: '#ef4444',
};

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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.subtitle, { marginTop: 16 }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            placeholderTextColor={theme.subtext}
            style={styles.input}
          />

          <Text style={styles.label}>Last name</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Your Last name"
            placeholderTextColor={theme.subtext}
            style={styles.input}
          />

          <Text style={styles.label}>Birthday</Text>
          <TextInput
            value={birthday}
            onChangeText={setBirthday}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.subtext}
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
            placeholderTextColor={theme.subtext}
            style={styles.input}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 ..."
            placeholderTextColor={theme.subtext}
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
            placeholderTextColor={theme.subtext}
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
              <Ionicons name="people-outline" size={18} color={theme.subtext} />
              <Text style={styles.householdText}>
                Role: {isHouseholdOwner ? 'Owner' : 'Member'}
              </Text>
            </View>
            
            {household && (
              <View style={styles.householdItem}>
                <Ionicons name="home-outline" size={18} color={theme.subtext} />
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
                <Ionicons name="mail-outline" size={18} color={theme.primary} />
                <Text style={styles.householdActionText}>Manage Invites</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.householdActionButton}
              onPress={() => setShowJoinModal(true)}
            >
              <Ionicons name="add-outline" size={18} color={theme.primary} />
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
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={notifications ? '#fff' : theme.subtext}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onCancel} disabled={!hasChanges}>
            <Text style={[styles.btnText, styles.btnTextSecondary]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, styles.btnPrimary, (!hasChanges || saving) && { opacity: 0.6 }]} 
            onPress={onSave} 
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.btnText, { color: '#fff', marginLeft: 8 }]}>Saving...</Text>
              </>
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={[styles.btnText, { color: '#fff', marginLeft: 8 }]}>Save changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Change Password */}
        <View style={[styles.card, { borderColor: theme.danger }]}>
          <TouchableOpacity style={[styles.btn, { borderColor: theme.danger }]} onPress={() => console.log('Change password')}>
            <Ionicons name="key-outline" size={18} color={theme.danger} />
            <Text style={[styles.btnText, { color: theme.danger, marginLeft: 8 }]}>Change Password</Text>
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

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: theme.text },
  subtitle: { color: theme.subtext, marginBottom: 8 },

  card: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12 },

  avatarRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarEditBtn: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: theme.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.bg,
    elevation: 1,
  },

  label: { fontSize: 12, color: theme.subtext, marginTop: 8, marginBottom: 6 },
  input: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.text,
  },

  segment: {
    flexDirection: 'row',
    backgroundColor: theme.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: '#e6f0ff', borderColor: theme.primary },
  segmentText: { color: theme.subtext, fontWeight: '600' },
  segmentTextActive: { color: theme.primary },

  toggleRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  helper: { color: theme.subtext, fontSize: 12 },

  actions: { marginTop: 8, flexDirection: 'row', gap: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnSecondary: { flex: 1, borderColor: theme.border, backgroundColor: theme.bg },
  btnPrimary: { flex: 2, borderColor: theme.primary, backgroundColor: theme.primary },
  btnText: { fontWeight: '700', color: theme.text },
  btnTextSecondary: { color: theme.text },

  // Household styles
  householdInfo: { marginTop: 12, gap: 8 },
  householdItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  householdText: { color: theme.subtext, fontSize: 14 },
  householdActions: { marginTop: 16, gap: 8 },
  householdActionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: theme.bg, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: theme.border 
  },
  householdActionText: { marginLeft: 8, color: theme.primary, fontWeight: '600' },
});