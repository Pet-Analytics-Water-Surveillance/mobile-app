// src/screens/Settings/AccountProfile.tsx
import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

export default function AccountProfile() {
  // demo state (replace with your user data later)
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [Firstname, setName1] = useState('Abdulmohsen');
  const [Lastname, setName2] = useState('Almunayes');
  const [email, setEmail] = useState('abdulmohsen@example.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [birthday, setBirthday] = useState('2000-01-01');
  const [units, setUnits] = useState<'Metric' | 'Imperial'>('Metric');
  const [notifications, setNotifications] = useState(true);

  const [initial] = useState({
    avatarUri: null as string | null,
    Firstname: 'Abdulmohsen Almunayes',
    Lastname: 'Almunayes',
    email: 'abdulmohsen@example.com',
    phone: '+1 (555) 123-4567',
    birthday: '2000-01-01',
    units: 'Metric' as 'Metric' | 'Imperial',
    notifications: true,
  });

  const hasChanges = useMemo(() => {
    return (
      avatarUri !== initial.avatarUri ||
      Firstname !== initial.Firstname ||
      Lastname !== initial.Lastname ||
      email !== initial.email ||
      phone !== initial.phone ||
      birthday !== initial.birthday ||
      units !== initial.units ||
      notifications !== initial.notifications
    );
  }, [avatarUri, Firstname, Lastname, email, phone, birthday, units, notifications, initial]);

  const onSave = () => {
    // Hook up to backend later.
    console.log('Save profile', { avatarUri, Firstname, Lastname, email, phone, birthday, units, notifications });
  };

  const onCancel = () => {
    setAvatarUri(initial.avatarUri);
    setName1(initial.Firstname);
    setName2(initial.Lastname);
    setEmail(initial.email);
    setPhone(initial.phone);
    setBirthday(initial.birthday);
    setUnits(initial.units);
    setNotifications(initial.notifications);
  };


  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Edit your personal information</Text>

        {/* Avatar card */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Info</Text>
              <Text style={styles.label}>First name</Text>
              <TextInput
                value={Firstname}
                onChangeText={setName1}
                placeholder="Your First name"
                placeholderTextColor={theme.subtext}
                style={styles.input}
              />

              <Text style={styles.label}>Last name</Text>
              <TextInput
              value={Lastname}
              onChangeText={setName2}
              placeholder='Your Last name'
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


        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onCancel} disabled={!hasChanges}>
            <Text style={[styles.btnText, styles.btnTextSecondary]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary, !hasChanges && { opacity: 0.6 }]} onPress={onSave} disabled={!hasChanges}>
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={[styles.btnText, { color: '#fff', marginLeft: 8 }]}>Save changes</Text>
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
});