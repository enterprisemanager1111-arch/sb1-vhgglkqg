import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ArrowLeft, Search, Plus, Crown, Shield, UserX, MoveVertical as MoreVertical, Mail, Phone, Calendar, CreditCard as Edit3, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useFamily } from '@/contexts/FamilyContext';
import { useLanguage } from '@/contexts/LanguageContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MemberAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  onPress: () => void;
  destructive?: boolean;
}

export default function FamilyMembers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showMemberActions, setShowMemberActions] = useState(false);
  
  const { familyMembers, userRole, currentFamily } = useFamily();
  const { t } = useLanguage();
  const backButtonScale = useSharedValue(1);

  const filteredMembers = familyMembers.filter(member =>
    member.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMemberActions = (memberId: string): MemberAction[] => {
    const isAdmin = userRole === 'admin';
    const member = familyMembers.find(m => m.id === memberId);
    const isTargetAdmin = member?.role === 'admin';

    const actions: MemberAction[] = [];

    if (isAdmin && !isTargetAdmin) {
      actions.push({
        id: 'promote',
        title: 'Zum Admin machen',
        icon: <Crown size={18} color="#FFB800" strokeWidth={2} />,
        color: '#FFB800',
        onPress: () => handlePromoteMember(memberId),
      });
    }

    if (isAdmin && isTargetAdmin && familyMembers.filter(m => m.role === 'admin').length > 1) {
      actions.push({
        id: 'demote',
        title: 'Admin-Rechte entziehen',
        icon: <Shield size={18} color="#666666" strokeWidth={2} />,
        color: '#666666',
        onPress: () => handleDemoteMember(memberId),
      });
    }

    actions.push({
      id: 'contact',
      title: 'Kontaktieren',
      icon: <Mail size={18} color="#54FE54" strokeWidth={2} />,
      color: '#54FE54',
      onPress: () => handleContactMember(memberId),
    });

    if (isAdmin && !isTargetAdmin) {
      actions.push({
        id: 'remove',
        title: 'Aus Familie entfernen',
        icon: <UserX size={18} color="#FF0000" strokeWidth={2} />,
        color: '#FF0000',
        onPress: () => handleRemoveMember(memberId),
        destructive: true,
      });
    }

    return actions;
  };

  const handlePromoteMember = (memberId: string) => {
    Alert.alert(
      'Admin-Rechte vergeben',
      'Möchten Sie diesem Mitglied Admin-Rechte geben?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Bestätigen', onPress: () => console.log('Promote:', memberId) },
      ]
    );
    setShowMemberActions(false);
  };

  const handleDemoteMember = (memberId: string) => {
    Alert.alert(
      'Admin-Rechte entziehen',
      'Möchten Sie diesem Mitglied die Admin-Rechte entziehen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Bestätigen', onPress: () => console.log('Demote:', memberId) },
      ]
    );
    setShowMemberActions(false);
  };

  const handleContactMember = (memberId: string) => {
    // Open contact options
    setShowMemberActions(false);
  };

  const handleRemoveMember = (memberId: string) => {
    const member = familyMembers.find(m => m.id === memberId);
    Alert.alert(
      'Mitglied entfernen',
      `Möchten Sie ${member?.profiles?.name || 'dieses Mitglied'} aus der Familie entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: () => console.log('Remove:', memberId),
        },
      ]
    );
    setShowMemberActions(false);
  };

  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
  }));

  const handleBackPress = () => {
    backButtonScale.value = withSpring(0.95, {}, () => {
      backButtonScale.value = withSpring(1);
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          style={[styles.backButton, backButtonAnimatedStyle]}
          onPress={handleBackPress}
        >
          <ArrowLeft size={24} color="#161618" strokeWidth={2} />
        </AnimatedPressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Family Members</Text>
          <Text style={styles.headerSubtitle}>{familyMembers.length} members</Text>
        </View>
        <Pressable style={styles.addButton}>
          <Plus size={24} color="#54FE54" strokeWidth={2} />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#666666" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Mitglieder suchen..."
            placeholderTextColor="#888888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Family Info */}
      <View style={styles.familyInfoCard}>
        <View style={styles.familyInfoHeader}>
          <Text style={styles.familyName}>{currentFamily?.name}</Text>
          <Text style={styles.familyCode}>#{currentFamily?.code}</Text>
        </View>
        <Text style={styles.familyDescription}>
          {familyMembers.filter(m => m.role === 'admin').length} Administrator(en) • 
          {familyMembers.filter(m => m.role === 'member').length} Mitglieder
        </Text>
      </View>

      {/* Members List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.membersContainer}>
          {filteredMembers
            .sort((a, b) => {
              // Sort admins first, then by name
              if (a.role === 'admin' && b.role !== 'admin') return -1;
              if (a.role !== 'admin' && b.role === 'admin') return 1;
              return (a.profiles?.name || '').localeCompare(b.profiles?.name || '');
            })
            .map((member, index) => (
              <View key={member.id} style={styles.memberCard}>
                {/* Member Avatar and Info */}
                <View style={styles.memberLeft}>
                  <View style={styles.memberAvatarContainer}>
                    {member.profiles?.avatar_url ? (
                      <Image 
                        source={{ uri: member.profiles.avatar_url }} 
                        style={styles.memberAvatar}
                      />
                    ) : (
                      <View style={styles.memberAvatarPlaceholder}>
                        <Text style={styles.memberAvatarText}>
                          {member.profiles?.name?.charAt(0).toUpperCase() || 'M'}
                        </Text>
                      </View>
                    )}
                    
                    {/* Role Badge */}
                    {member.role === 'admin' && (
                      <View style={styles.roleBadge}>
                        <Crown size={12} color="#FFB800" strokeWidth={2} fill="#FFB800" />
                      </View>
                    )}
                    
                    {/* Online Status */}
                    <View style={[
                      styles.onlineStatus,
                      { backgroundColor: index === 0 ? '#54FE54' : '#E0E0E0' } // Admin is always online for demo
                    ]} />
                  </View>
                  
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.profiles?.name || 'Unknown User'}
                    </Text>
                    <View style={styles.memberMeta}>
                      <Text style={styles.memberRole}>
                        {member.role === 'admin' ? 'Administrator' : 'Mitglied'}
                      </Text>
                      <View style={styles.memberStats}>
                        <Text style={styles.memberStatText}>
                          {Math.floor(Math.random() * 50)} Aufgaben
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Member Actions */}
                <View style={styles.memberRight}>
                  <View style={styles.memberActivity}>
                    <Text style={styles.activityText}>Aktiv vor 2h</Text>
                  </View>
                  <Pressable
                    style={styles.memberActionsButton}
                    onPress={() => {
                      setSelectedMember(member.id);
                      setShowMemberActions(true);
                    }}
                  >
                    <MoreVertical size={20} color="#666666" strokeWidth={2} />
                  </Pressable>
                </View>
              </View>
            ))}
        </View>
        
        {/* Empty State */}
        {filteredMembers.length === 0 && searchQuery && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Keine Mitglieder gefunden für "{searchQuery}"
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Member Actions Modal */}
      <Modal
        visible={showMemberActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMemberActions(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackground} 
            onPress={() => setShowMemberActions(false)} 
          />
          <View style={styles.actionsModal}>
            <View style={styles.modalHandle} />
            {selectedMember && (
              <>
                <Text style={styles.modalTitle}>Aktionen</Text>
                {getMemberActions(selectedMember).map((action) => (
                  <Pressable
                    key={action.id}
                    style={[
                      styles.actionItem,
                      action.destructive && styles.destructiveAction
                    ]}
                    onPress={action.onPress}
                  >
                    <View style={styles.actionIcon}>
                      {action.icon}
                    </View>
                    <Text style={[
                      styles.actionText,
                      action.destructive && styles.destructiveText
                    ]}>
                      {action.title}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#161618',
    fontFamily: 'Montserrat-Regular',
  },

  // Family Info
  familyInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  familyInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  familyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  familyCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  familyDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },

  // Members List
  scrollView: {
    flex: 1,
  },
  membersContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  memberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  roleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberRole: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  memberStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberStatText: {
    fontSize: 12,
    color: '#54FE54',
    fontFamily: 'Montserrat-Medium',
  },
  memberRight: {
    alignItems: 'flex-end',
  },
  memberActivity: {
    marginBottom: 8,
  },
  activityText: {
    fontSize: 11,
    color: '#999999',
    fontFamily: 'Montserrat-Regular',
  },
  memberActionsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackground: {
    flex: 1,
  },
  actionsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(84, 254, 84, 0.05)',
  },
  destructiveAction: {
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
  },
  actionIcon: {
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#161618',
    fontFamily: 'Montserrat-Medium',
  },
  destructiveText: {
    color: '#FF0000',
  },
});