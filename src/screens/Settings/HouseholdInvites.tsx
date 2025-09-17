import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InviteService, HouseholdInvitation } from '../../services/InviteService';
import { HouseholdService } from '../../services/HouseholdService';

const theme = {
  primary: '#1e90ff',
  text: '#0f172a',
  subtext: '#64748b',
  bg: '#ffffff',
  card: '#f8fafc',
  border: '#e2e8f0',
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
};

export default function HouseholdInvites() {
  const [loading, setLoading] = useState(true);
  const [isHouseholdOwner, setIsHouseholdOwner] = useState(false);
  const [sentInvitations, setSentInvitations] = useState<HouseholdInvitation[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<HouseholdInvitation[]>([]);
  
  // Send invite modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Invite code
  const [inviteCode, setInviteCode] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const isOwner = await HouseholdService.isHouseholdOwner();
      setIsHouseholdOwner(isOwner);

      if (isOwner) {
        const sent = await InviteService.getSentInvitations();
        setSentInvitations(sent);
      }

      const pending = await InviteService.getPendingInvitations();
      setPendingInvitations(pending);

      // Clean up expired invitations
      await InviteService.cleanupExpiredInvitations();
    } catch (error: any) {
      console.error('Error loading invite data:', error);
      
      // Check if it's a table doesn't exist error
      if (error?.message?.includes('relation "household_invitations" does not exist')) {
        Alert.alert(
          'Database Setup Required', 
          'The invitation system requires database setup. Please check the HouseholdInviteSystem.md file for setup instructions.'
        );
      } else {
        Alert.alert('Error', 'Failed to load invitation data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setSending(true);
      await InviteService.sendInvitation(inviteEmail.trim(), inviteMessage.trim() || undefined);
      
      setInviteEmail('');
      setInviteMessage('');
      setShowSendModal(false);
      
      Alert.alert('Success', 'Invitation sent successfully!');
      await loadData(); // Refresh the list
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptInvite = async (invitationId: string) => {
    try {
      await InviteService.acceptInvitation(invitationId);
      Alert.alert('Success', 'Invitation accepted! Welcome to the household!');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept invitation');
    }
  };

  const handleRejectInvite = async (invitationId: string) => {
    Alert.alert(
      'Reject Invitation',
      'Are you sure you want to reject this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await InviteService.rejectInvitation(invitationId);
              Alert.alert('Success', 'Invitation rejected');
              await loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject invitation');
            }
          }
        }
      ]
    );
  };

  const handleCancelInvite = async (invitationId: string) => {
    Alert.alert(
      'Cancel Invitation',
      'Are you sure you want to cancel this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await InviteService.cancelInvitation(invitationId);
              Alert.alert('Success', 'Invitation cancelled');
              await loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel invitation');
            }
          }
        }
      ]
    );
  };

  const generateInviteCode = async () => {
    try {
      const code = await InviteService.generateInviteCode();
      setInviteCode(code);
      setShowCodeModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate invite code');
    }
  };

  const shareInviteCode = async () => {
    try {
      await Share.share({
        message: `Join my household on PetCare! Use invite code: ${inviteCode}`,
        title: 'Household Invitation'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.warning;
      case 'accepted': return theme.success;
      case 'rejected': return theme.danger;
      case 'expired': return theme.subtext;
      default: return theme.subtext;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.subtitle, { marginTop: 16 }]}>Loading invitations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Household Invitations</Text>
      <Text style={styles.subtitle}>Manage your household invitations</Text>

      {/* Owner Controls */}
      {isHouseholdOwner && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Send Invitations</Text>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowSendModal(true)}
          >
            <Ionicons name="mail-outline" size={20} color={theme.primary} />
            <Text style={styles.actionButtonText}>Send Email Invitation</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={generateInviteCode}
          >
            <Ionicons name="qr-code-outline" size={20} color={theme.primary} />
            <Text style={styles.actionButtonText}>Generate Invite Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pending Invitations for Current User */}
      {pendingInvitations.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pending Invitations</Text>
          {pendingInvitations.map((invite) => (
            <View key={invite.id} style={styles.inviteItem}>
              <View style={styles.inviteInfo}>
                <Text style={styles.inviteTitle}>
                  {invite.household_name || 'Household'}
                </Text>
                <Text style={styles.inviteSubtitle}>
                  From: {invite.inviter_name}
                </Text>
                {invite.message && (
                  <Text style={styles.inviteMessage}>"{invite.message}"</Text>
                )}
                <Text style={styles.inviteDate}>
                  Expires: {formatDate(invite.expires_at)}
                </Text>
              </View>
              <View style={styles.inviteActions}>
                <TouchableOpacity
                  style={[styles.smallButton, { backgroundColor: theme.success }]}
                  onPress={() => handleAcceptInvite(invite.id)}
                >
                  <Text style={styles.smallButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, { backgroundColor: theme.danger }]}
                  onPress={() => handleRejectInvite(invite.id)}
                >
                  <Text style={styles.smallButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Sent Invitations (Owner Only) */}
      {isHouseholdOwner && sentInvitations.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sent Invitations</Text>
          {sentInvitations.map((invite) => (
            <View key={invite.id} style={styles.inviteItem}>
              <View style={styles.inviteInfo}>
                <Text style={styles.inviteTitle}>{invite.invitee_email}</Text>
                <Text style={[styles.inviteStatus, { color: getStatusColor(invite.status) }]}>
                  {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                </Text>
                <Text style={styles.inviteDate}>
                  Sent: {formatDate(invite.created_at)}
                </Text>
                {invite.status === 'pending' && (
                  <Text style={styles.inviteDate}>
                    Expires: {formatDate(invite.expires_at)}
                  </Text>
                )}
              </View>
              {invite.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.smallButton, { backgroundColor: theme.danger }]}
                  onPress={() => handleCancelInvite(invite.id)}
                >
                  <Text style={styles.smallButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Send Invite Modal */}
      <Modal
        visible={showSendModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSendModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Send Invitation</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={styles.label}>Message (Optional)</Text>
            <TextInput
              value={inviteMessage}
              onChangeText={setInviteMessage}
              placeholder="Add a personal message..."
              multiline
              numberOfLines={3}
              style={[styles.input, { height: 80 }]}
            />

            <TouchableOpacity
              style={[styles.sendButton, sending && { opacity: 0.6 }]}
              onPress={handleSendInvite}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.sendButtonText}>Send Invitation</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Invite Code Modal */}
      <Modal
        visible={showCodeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCodeModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Invite Code</Text>
            <TouchableOpacity onPress={shareInviteCode}>
              <Ionicons name="share-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.codeInstructions}>
              Share this code with others to let them join your household:
            </Text>
            
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={shareInviteCode}
            >
              <Ionicons name="share-outline" size={20} color={theme.primary} />
              <Text style={styles.shareButtonText}>Share Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 16 },
  title: { fontSize: 28, fontWeight: '700', color: theme.text },
  subtitle: { color: theme.subtext, marginBottom: 16 },
  
  card: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 12 },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8,
  },
  actionButtonText: { marginLeft: 8, color: theme.primary, fontWeight: '600' },
  
  inviteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.bg,
    borderRadius: 8,
    marginBottom: 8,
  },
  inviteInfo: { flex: 1 },
  inviteTitle: { fontSize: 16, fontWeight: '600', color: theme.text },
  inviteSubtitle: { fontSize: 14, color: theme.subtext, marginTop: 2 },
  inviteMessage: { fontSize: 14, color: theme.text, fontStyle: 'italic', marginTop: 4 },
  inviteDate: { fontSize: 12, color: theme.subtext, marginTop: 4 },
  inviteStatus: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  
  inviteActions: { flexDirection: 'row', gap: 8 },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  smallButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  
  // Modal styles
  modalContainer: { flex: 1, backgroundColor: theme.bg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: theme.text },
  modalContent: { padding: 16 },
  
  label: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 },
  input: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: theme.text,
  },
  
  sendButton: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  sendButtonText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
  
  codeInstructions: {
    fontSize: 16,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  codeContainer: {
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.primary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.primary,
    letterSpacing: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 8,
  },
  shareButtonText: { color: theme.primary, fontWeight: '600', marginLeft: 8 },
});
