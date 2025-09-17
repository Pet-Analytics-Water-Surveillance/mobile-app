import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InviteService } from '../services/InviteService';

const theme = {
  primary: '#1e90ff',
  text: '#0f172a',
  subtext: '#64748b',
  bg: '#ffffff',
  card: '#f8fafc',
  border: '#e2e8f0',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function JoinHouseholdModal({ visible, onClose, onSuccess }: Props) {
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    try {
      setJoining(true);
      await InviteService.joinWithCode(inviteCode.trim());
      
      setInviteCode('');
      Alert.alert('Success', 'Successfully joined the household!', [
        { text: 'OK', onPress: () => {
          onClose();
          onSuccess?.();
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join household');
    } finally {
      setJoining(false);
    }
  };

  const handleClose = () => {
    setInviteCode('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Join Household</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="home-outline" size={48} color={theme.primary} />
          </View>

          <Text style={styles.subtitle}>
            Enter the invite code shared by a household owner to join their household
          </Text>

          <Text style={styles.label}>Invite Code</Text>
          <TextInput
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="Enter 8-character code"
            autoCapitalize="none"
            maxLength={8}
            style={styles.input}
          />

          <TouchableOpacity
            style={[styles.joinButton, (joining || !inviteCode.trim()) && { opacity: 0.6 }]}
            onPress={handleJoin}
            disabled={joining || !inviteCode.trim()}
          >
            {joining ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={styles.joinButtonText}>Joining...</Text>
              </>
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.joinButtonText}>Join Household</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={styles.infoText}>
              Joining a household will remove you from your current household if you have one.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: { fontSize: 18, fontWeight: '600', color: theme.text },
  
  content: { padding: 24 },
  
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  
  subtitle: {
    fontSize: 16,
    color: theme.subtext,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: theme.text, 
    marginBottom: 8 
  },
  
  input: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 24,
  },
  
  joinButton: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  joinButtonText: { 
    color: '#fff', 
    fontWeight: '600', 
    marginLeft: 8,
    fontSize: 16,
  },
  
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: theme.subtext,
    lineHeight: 20,
  },
});
