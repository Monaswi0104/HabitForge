import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  useColorScheme,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { RootStackScreenProps } from '../../types/navigation.types';
import { useProfileStore } from '../../store/profileStore';
import { Colors } from '../../constants/colors';
import { User, Plus, Crown, Calendar, MoreVertical, X, AlertTriangle, ArrowLeft, Lock, Settings, Users, Trash2, Edit2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../store/settingsStore';
import PinEntryModal from '../../components/profile/PinEntryModal';

type Props = RootStackScreenProps<'ProfileSelect'>;

// NOTE: `currentStreak` isn't on the Profile type yet. Wire it up once per-profile
// stats exist (e.g. derived from the habits store) — the badge below will light up
// on its own as soon as a profile has a streak > 0.

function ProfileTile({
  profile,
  index,
  isSelected,
  onPress,
  onOptions,
  theme,
}: {
  profile: any;
  index: number;
  isSelected: boolean;
  onPress: (id: string) => void;
  onOptions: (id: string, name: string) => void;
  theme: any;
}) {
  const mountAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(mountAnim, {
      toValue: 1,
      delay: index * 70,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isSelected) {
      Animated.spring(checkAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [isSelected]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.94, speed: 50, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, speed: 50, useNativeDriver: true }).start();
  };

  const streak = profile.currentStreak ?? 0;
  const entranceScale = mountAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const entranceY = mountAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View
      style={{
        width: '47%',
        opacity: mountAnim,
        transform: [{ scale: Animated.multiply(pressAnim, entranceScale) }, { translateY: entranceY }],
      }}
    >
      <TouchableOpacity
        style={[
          styles.tile, 
          { 
            backgroundColor: theme.surface,
            borderColor: isSelected ? theme.primary : theme.border,
            borderWidth: 1,
          }
        ]}
        onPress={() => onPress(profile.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {isSelected && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.primary, opacity: 0.05, borderRadius: 24 }]} />
        )}
        {/* Delete Button / More Action */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={(e) => {
            e.stopPropagation();
            onOptions(profile.id, profile.name);
          }}
        >
          <MoreVertical color={theme.textSecondary} size={20} />
        </TouchableOpacity>

        <View style={styles.avatarWrap}>
          <View style={[styles.tileAvatar, { backgroundColor: profile.color || theme.primary }]}>
            <Text style={styles.tileAvatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {profile.pin && <Lock color={theme.text} size={14} />}
          <Text style={[styles.tileName, { color: theme.text }]} numberOfLines={1}>
            {profile.name}
          </Text>
        </View>

        {isSelected ? (
          <View style={[styles.statusBadge, { backgroundColor: theme.primary + '15' }]}>
            <Crown size={12} color={theme.primary} />
            <Text style={[styles.statusBadgeText, { color: theme.primary }]}>Current</Text>
          </View>
        ) : (
          <View style={styles.statusBadge}>
            <Calendar size={12} color={theme.textSecondary} />
            <Text style={[styles.statusBadgeText, { color: theme.textSecondary }]}>Joined recently</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function AddProfileTile({ index, theme, onPress }: { index: number; theme: any; onPress: () => void }) {
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(mountAnim, {
      toValue: 1,
      delay: index * 70,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const entranceScale = mountAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const entranceY = mountAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View
      style={{ width: '47%', opacity: mountAnim, transform: [{ scale: entranceScale }, { translateY: entranceY }] }}
    >
      <TouchableOpacity
        style={[styles.tile, styles.addTile, { borderColor: theme.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.addIconCircle, { backgroundColor: theme.primary + '15' }]}>
          <Plus color={theme.primary} size={26} strokeWidth={2.5} />
        </View>
        <Text style={[styles.tileName, { color: theme.primary, marginTop: 4 }]}>Add New Profile</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ProfileSelectScreen({ navigation }: Props) {
  const { profiles, selectProfile, deleteProfile } = useProfileStore();
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [localSelected, setLocalSelected] = useState<string | null>(null);

  // Clear profile when returning to this screen (e.g., via hardware back button)
  useFocusEffect(
    useCallback(() => {
      selectProfile('');
      setLocalSelected(null);
    }, [selectProfile])
  );

  // Modal State
  const [optionsMenuVisible, setOptionsMenuVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [activeMenuProfile, setActiveMenuProfile] = useState<{ id: string; name: string } | null>(null);

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [lockedProfileId, setLockedProfileId] = useState<string | null>(null);

  const handleSelectProfile = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (profile?.pin) {
      setLockedProfileId(id);
      setPinModalVisible(true);
      return;
    }

    proceedSelectProfile(id);
  };

  const proceedSelectProfile = (id: string) => {
    setLocalSelected(id);
    setTimeout(() => {
      selectProfile(id);
      navigation.navigate('MainTabs', { screen: 'Home' });
    }, 380);
  };

  const handleOpenOptions = (id: string, name: string) => {
    setActiveMenuProfile({ id, name });
    setOptionsMenuVisible(true);
  };

  const handleDeleteProfileRequest = () => {
    setOptionsMenuVisible(false);
    setTimeout(() => {
      setDeleteConfirmVisible(true);
    }, 300); // slight delay for smooth transition
  };

  const handleConfirmDelete = async () => {
    if (activeMenuProfile) {
      await deleteProfile(activeMenuProfile.id);
      setDeleteConfirmVisible(false);
      setActiveMenuProfile(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 16, 60),
            paddingBottom: Math.max(insets.bottom + 32, 48),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ width: 45, height: 45, resizeMode: 'contain' }} 
            />
            <Text style={[styles.brandText, { color: theme.textSecondary }]}>HABITFORGE</Text>
          </View>
          <TouchableOpacity 
            style={[styles.settingsBtn, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Settings color={theme.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          {getGreeting()}<Text style={{ color: theme.primary }}>.</Text>
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Who's building habits today?</Text>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitleText, { color: theme.textSecondary }]}>YOUR PROFILES</Text>
          <View style={[styles.sectionLine, { backgroundColor: theme.border }]} />
        </View>

        {profiles.length === 0 ? (
          <>
            <View style={styles.emptyAddWrap}>
              <AddProfileTile
                index={0}
                theme={theme}
                onPress={() => navigation.navigate('CreateProfile')}
              />
            </View>
            <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
              <View style={[styles.emptyIconBg, { backgroundColor: theme.primary + '15' }]}>
                <User color={theme.primary} size={28} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Profiles Yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Tap the button above to create your first profile and start tracking habits.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.grid}>
            {profiles.map((profile: any, index: number) => (
              <ProfileTile
                key={profile.id}
                profile={profile}
                index={index}
                isSelected={localSelected === profile.id}
                onPress={handleSelectProfile}
                onOptions={handleOpenOptions}
                theme={theme}
              />
            ))}
            <AddProfileTile
              index={profiles.length}
              theme={theme}
              onPress={() => navigation.navigate('CreateProfile')}
            />
          </View>
        )}

        <View style={[styles.bottomBanner, { backgroundColor: theme.primary + '10' }]}>
          <View style={[styles.bannerIconWrap, { backgroundColor: theme.primary + '1A' }]}>
            <Users color={theme.primary} size={24} />
          </View>
          <View style={styles.bannerTextWrap}>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>Switch between profiles</Text>
            <Text style={[styles.bannerSubtitle, { color: theme.textSecondary }]}>
              Keep your habits separate and track progress across different areas of your life.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Options Menu Modal */}
      <Modal visible={optionsMenuVisible} transparent animationType="fade" onRequestClose={() => setOptionsMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOptionsMenuVisible(false)}>
          <View style={[styles.menuContent, { backgroundColor: theme.surface }]}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setOptionsMenuVisible(false);
                if (activeMenuProfile) handleSelectProfile(activeMenuProfile.id);
              }}
            >
              <User size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Open Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setOptionsMenuVisible(false);
                Alert.alert('Rename', 'Rename profile feature coming soon.');
              }}
            >
              <Edit2 size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Rename</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: theme.border, marginTop: 4, paddingTop: 16 }]}
              onPress={handleDeleteProfileRequest}
            >
              <Trash2 size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Delete Profile</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteConfirmVisible} transparent animationType="slide" onRequestClose={() => setDeleteConfirmVisible(false)}>
        <TouchableOpacity style={styles.modalOverlayDark} activeOpacity={1} onPress={() => setDeleteConfirmVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.bottomSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.dragHandle} />
            <View style={styles.deleteIconWrap}>
              <Trash2 size={28} color="#EF4444" />
            </View>
            <Text style={[styles.deleteTitle, { color: theme.text }]}>Delete this profile?</Text>
            <Text style={[styles.deleteSubtitle, { color: theme.textSecondary }]}>
              This will permanently delete "{activeMenuProfile?.name}" and all of its data. This action cannot be undone.
            </Text>
            <TouchableOpacity 
              style={styles.deleteConfirmBtn}
              onPress={handleConfirmDelete}
            >
              <Text style={styles.deleteConfirmBtnText}>Delete Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.cancelBtn, { borderColor: theme.border }]}
              onPress={() => setDeleteConfirmVisible(false)}
            >
              <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {lockedProfileId && (
        <PinEntryModal
          visible={pinModalVisible}
          profileName={profiles.find(p => p.id === lockedProfileId)?.name || ''}
          expectedPin={profiles.find(p => p.id === lockedProfileId)?.pin || ''}
          onSuccess={() => {
            setPinModalVisible(false);
            proceedSelectProfile(lockedProfileId);
          }}
          onCancel={() => {
            setPinModalVisible(false);
            setLockedProfileId(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  tile: {
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  addTile: {
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  avatarWrap: {
    marginBottom: 14,
  },
  tileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tileAvatarText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
  },
  checkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  streakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tileName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  addIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyAddWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 24,
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  moreButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomBanner: {
    marginTop: 32,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayDark: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  menuContent: {
    width: 200,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    marginBottom: 24,
  },
  deleteIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  deleteSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  deleteConfirmBtn: {
    backgroundColor: '#EF4444',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteConfirmBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
