import React, { useState, useEffect, useMemo } from 'react';
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
import { AppTheme, useAppTheme } from '../../theme';

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
  const { theme } = useAppTheme();
  const palette = useMemo(() => buildPalette(theme), [theme]);
  const styles = useMemo(() => createStyles(palette), [palette]);
  

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
      case 'pending': return palette.warning;
      case 'accepted': return palette.success;
      case 'rejected': return palette.danger;
      case 'expired': return palette.subtext;
      default: return palette.subtext;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>Loading invitations...</Text>
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
            <Ionicons name="mail-outline" size={20} color={palette.primary} />
            <Text style={styles.actionButtonText}>Send Email Invitation</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={generateInviteCode}
          >
            <Ionicons name="qr-code-outline" size={20} color={palette.primary} />
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
                  style={[styles.smallButton, { backgroundColor: palette.success }]}
                  onPress={() => handleAcceptInvite(invite.id)}
                >
                  <Text style={styles.smallButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, { backgroundColor: palette.danger }]}
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
                  style={[styles.smallButton, { backgroundColor: palette.danger }]}
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
              <Ionicons name="close" size={24} color={palette.text} />
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
              placeholderTextColor={palette.subtext}
              style={styles.input}
            />

            <Text style={styles.label}>Message (Optional)</Text>
            <TextInput
              value={inviteMessage}
              onChangeText={setInviteMessage}
              placeholder="Add a personal message..."
              multiline
              numberOfLines={3}
              placeholderTextColor={palette.subtext}
              style={[styles.input, { height: 80 }]}
            />

            <TouchableOpacity
              style={[styles.sendButton, sending && { opacity: 0.6 }]}
              onPress={handleSendInvite}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color={palette.onPrimary} />
              ) : (
                <>
                  <Ionicons name="send" size={20} color={palette.onPrimary} />
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
              <Ionicons name="close" size={24} color={palette.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Invite Code</Text>
            <TouchableOpacity onPress={shareInviteCode}>
              <Ionicons name="share-outline" size={24} color={palette.primary} />
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
              <Ionicons name="share-outline" size={20} color={palette.primary} />
              <Text style={styles.shareButtonText}>Share Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

type Palette = ReturnType<typeof buildPalette>

const buildPalette = (theme: AppTheme) => ({
  primary: theme.colors.primary,
  onPrimary: theme.colors.onPrimary,
  text: theme.colors.text,
  subtext: theme.colors.textSecondary,
  bg: theme.colors.background,
  card: theme.colors.card,
  border: theme.colors.border,
  danger: theme.colors.danger,
  success: theme.colors.success,
  warning: theme.colors.warning,
})

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.bg, padding: 16 },
    title: { fontSize: 28, fontWeight: '700', color: palette.text },
    subtitle: { color: palette.subtext, marginBottom: 16 },
    card: {
      backgroundColor: palette.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: palette.border,
    },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: palette.text, marginBottom: 12 },
    actionRow: { flexDirection: 'row', gap: 12 },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      backgroundColor: palette.bg,
      borderWidth: 1,
      borderColor: palette.border,
      flex: 1,
      gap: 8,
    },
    actionButtonText: { color: palette.primary, fontWeight: '600' },
    inviteCard: {
      backgroundColor: palette.card,
      padding: 14,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: palette.border,
    },
    inviteItem: {
      backgroundColor: palette.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: palette.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    inviteInfo: { flex: 1 },
    inviteTitle: { fontSize: 16, fontWeight: '600', color: palette.text },
    inviteSubtitle: { fontSize: 14, color: palette.subtext, marginTop: 2 },
    inviteMessage: { fontSize: 14, color: palette.text, fontStyle: 'italic', marginTop: 4 },
    inviteDate: { fontSize: 12, color: palette.subtext, marginTop: 4 },
    inviteStatus: { fontSize: 14, fontWeight: '600', marginTop: 2 },
    inviteActions: { flexDirection: 'row', gap: 8 },
    smallButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
    },
    smallButtonText: { color: palette.onPrimary, fontSize: 12, fontWeight: '600' },
    modalContainer: { flex: 1, backgroundColor: palette.bg },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    modalTitle: { fontSize: 18, fontWeight: '600', color: palette.text },
    modalContent: { padding: 16, gap: 16 },
    label: { fontSize: 14, fontWeight: '600', color: palette.text, marginBottom: 8 },
    input: {
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 12,
      padding: 12,
      color: palette.text,
    },
    textarea: {
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      textAlignVertical: 'top',
      color: palette.text,
      minHeight: 100,
    },
    sendButton: {
      backgroundColor: palette.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    sendButtonText: { color: palette.onPrimary, fontWeight: '600' },
    codeInstructions: { fontSize: 16, color: palette.text, textAlign: 'center' },
    codeContainer: {
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.primary,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
    },
    codeText: { fontSize: 32, fontWeight: 'bold', color: palette.primary, letterSpacing: 4 },
    shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.primary,
      borderRadius: 12,
      gap: 8,
    },
    shareButtonText: { color: palette.primary, fontWeight: '600' },
    loadingContainer: { flex: 1, backgroundColor: palette.bg, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: palette.subtext },
  });
