import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, Switch, TouchableOpacity, ScrollView, Alert, Modal, Linking } from 'react-native';
import { Colors } from '../constants/colors';
import { ChevronRight, ChevronLeft, Moon, Bell, Music, Save, Share, Globe, Lock, Info, LogOut, Trash2, X, Check } from 'lucide-react-native';
import { useProfileStore } from '../store/profileStore';
import { useHabitStore } from '../store/habitStore';
import { useSettingsStore } from '../store/settingsStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationService } from '../services/notificationService';
import { executeQuery, resetDB } from '../database/db';
import Share2Native from 'react-native-share';

const SOUND_OPTIONS = ['Chime', 'Bell', 'Ping', 'Soft', 'None'];
const LANGUAGE_OPTIONS = ['English'];

export default function SettingScreen({ navigation }: any) {
  const { isDarkMode, setDarkMode, notificationsEnabled, setNotifications, reminderSound, setReminderSound } = useSettingsStore();
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  
  const { selectProfile, activeProfileId, deleteProfile } = useProfileStore();
  const { habits, completions } = useHabitStore();

  const [soundModalVisible, setSoundModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  // ─── Notification Toggle ────────────────────────────────────────────────────
  const handleNotificationToggle = (enabled: boolean) => {
    setNotifications(enabled);
    if (!enabled) {
      notificationService.cancelAll();
    } else {
      Alert.alert('Notifications Enabled', 'Daily reminders will now be sent.');
    }
  };

  // ─── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => {
        selectProfile('');
        navigation.navigate('ProfileSelect');
      }}
    ]);
  };

  // ─── Delete Profile ─────────────────────────────────────────────────────────
  const handleDeleteProfile = () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to permanently delete this profile? All associated habits and progress will be lost. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            if (activeProfileId) {
              await deleteProfile(activeProfileId);
              navigation.navigate('ProfileSelect');
            }
          }
        }
      ]
    );
  };

  // ─── Export Data ────────────────────────────────────────────────────────────
  const handleExportData = async () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        profileId: activeProfileId,
        habits: habits.map(h => ({
          title: h.title,
          frequency: h.frequency,
          color: h.color,
          icon: h.icon,
          created_at: h.created_at,
        })),
        completions: completions.map(c => ({
          habit_id: c.habit_id,
          date: c.date,
          completed_at: c.completed_at,
        })),
        summary: {
          totalHabits: habits.length,
          totalCompletions: completions.length,
        }
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      // Base64 encode for React Native (no btoa available)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      const utf8String = unescape(encodeURIComponent(jsonString));
      let base64 = '';
      for (let i = 0; i < utf8String.length; i += 3) {
        const a = utf8String.charCodeAt(i);
        const b = i + 1 < utf8String.length ? utf8String.charCodeAt(i + 1) : 0;
        const c = i + 2 < utf8String.length ? utf8String.charCodeAt(i + 2) : 0;
        base64 += chars[a >> 2] + chars[((a & 3) << 4) | (b >> 4)];
        base64 += i + 1 < utf8String.length ? chars[((b & 15) << 2) | (c >> 6)] : '=';
        base64 += i + 2 < utf8String.length ? chars[c & 63] : '=';
      }

      await Share2Native.open({
        title: 'Export HabitForge Data',
        message: 'HabitForge Data Export',
        url: `data:application/json;base64,${base64}`,
        filename: `habitforge_export_${new Date().toISOString().split('T')[0]}`,
        type: 'application/json',
      });
    } catch (e: any) {
      if (e.message !== 'User did not share') {
        Alert.alert('Export Failed', 'Could not export your data. Please try again.');
      }
    }
  };

  // ─── Backup & Restore ──────────────────────────────────────────────────────
  const handleBackup = () => {
    Alert.alert(
      'Backup & Restore',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '⚠️ Reset All Data',
              'This will permanently delete ALL your habits, progress, and profiles. This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await resetDB();
                      selectProfile('');
                      navigation.replace('ProfileSelect');
                      Alert.alert('Done', 'All data has been reset.');
                    } catch (e) {
                      Alert.alert('Error', 'Failed to reset data.');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  // ─── Privacy Policy ─────────────────────────────────────────────────────────
  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'HabitForge stores all your data locally on your device. We do not collect, share, or transmit any personal information to external servers.\n\n• All habit data is stored in a local SQLite database\n• No analytics or tracking is used\n• No account or sign-up is required\n• Your data never leaves your device\n\nYour privacy is fully respected.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  // ─── Setting Row Helper ─────────────────────────────────────────────────────
  const renderSettingRow = (
    icon: React.ReactNode, 
    iconBg: string, 
    label: string, 
    onPress: () => void, 
    rightContent?: React.ReactNode,
    isLast?: boolean
  ) => (
    <TouchableOpacity 
      style={[styles.settingRow, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconBg, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <Text style={[styles.settingText, { color: theme.text }]}>{label}</Text>
      </View>
      {rightContent || <ChevronRight color={theme.textSecondary} size={20} />}
    </TouchableOpacity>
  );

  // ─── Picker Modal ───────────────────────────────────────────────────────────
  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: string[],
    selected: string,
    onSelect: (option: string) => void
  ) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={theme.textSecondary} size={22} />
            </TouchableOpacity>
          </View>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.modalOption,
                index < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
              ]}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <Text style={[
                styles.modalOptionText, 
                { color: selected === option ? theme.primary : theme.text }
              ]}>
                {option}
              </Text>
              {selected === option && <Check color={theme.primary} size={20} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 48), flexDirection: 'row', alignItems: 'center' }]}>
        {!activeProfileId && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
            <ChevronLeft color={theme.text} size={28} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* General Section */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>GENERAL</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
          {renderSettingRow(
            <Moon size={18} color="#6366F1" />,
            '#E0E7FF',
            'Dark Mode',
            () => setDarkMode(!isDarkMode),
            <Switch 
              value={isDarkMode} 
              onValueChange={setDarkMode}
              trackColor={{ true: theme.primary }} 
            />
          )}
          {renderSettingRow(
            <Bell size={18} color="#F97316" />,
            '#FFF7ED',
            'Notifications',
            () => handleNotificationToggle(!notificationsEnabled),
            <Switch 
              value={notificationsEnabled} 
              onValueChange={handleNotificationToggle}
              trackColor={{ true: theme.primary }} 
            />
          )}
          {renderSettingRow(
            <Music size={18} color="#10B981" />,
            '#D1FAE5',
            'Reminder Sound',
            () => setSoundModalVisible(true),
            <View style={styles.rowRight}>
              <Text style={[styles.valueText, { color: theme.textSecondary }]}>{reminderSound}</Text>
              <ChevronRight color={theme.textSecondary} size={20} />
            </View>,
            true
          )}
        </View>

        {/* Data Section */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DATA</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
          {renderSettingRow(
            <Save size={18} color="#3B82F6" />,
            '#DBEAFE',
            'Backup & Restore',
            handleBackup
          )}
          {renderSettingRow(
            <Share size={18} color="#8B5CF6" />,
            '#EDE9FE',
            'Export Data',
            handleExportData,
            undefined,
            true
          )}
        </View>

        {/* More Section */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>MORE</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
          {renderSettingRow(
            <Globe size={18} color="#0EA5E9" />,
            '#E0F2FE',
            'Language',
            () => setLanguageModalVisible(true),
            <View style={styles.rowRight}>
              <Text style={[styles.valueText, { color: theme.textSecondary }]}>English</Text>
              <ChevronRight color={theme.textSecondary} size={20} />
            </View>
          )}
          {renderSettingRow(
            <Lock size={18} color="#6B7280" />,
            '#F3F4F6',
            'Privacy Policy',
            handlePrivacyPolicy
          )}
          {renderSettingRow(
            <Info size={18} color="#14B8A6" />,
            '#CCFBF1',
            'About HabitForge',
            () => setAboutModalVisible(true),
            <View style={styles.rowRight}>
              <Text style={[styles.valueText, { color: theme.textSecondary }]}>1.0.0</Text>
              <ChevronRight color={theme.textSecondary} size={20} />
            </View>,
            true
          )}
        </View>

        {activeProfileId && (
          <View style={styles.dangerZone}>
            <TouchableOpacity 
              style={[styles.logoutButton, { backgroundColor: '#FEF2F2' }]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.logoutButton, { backgroundColor: '#FEF2F2', marginTop: 12 }]}
              onPress={handleDeleteProfile}
              activeOpacity={0.8}
            >
              <Trash2 size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Delete Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sound Picker Modal */}
      {renderPickerModal(
        soundModalVisible,
        () => setSoundModalVisible(false),
        'Reminder Sound',
        SOUND_OPTIONS,
        reminderSound,
        setReminderSound
      )}

      {/* Language Picker Modal */}
      {renderPickerModal(
        languageModalVisible,
        () => setLanguageModalVisible(false),
        'Language',
        LANGUAGE_OPTIONS,
        'English',
        () => Alert.alert('Language', 'Only English is currently supported.')
      )}

      {/* About Modal */}
      <Modal visible={aboutModalVisible} transparent animationType="fade" onRequestClose={() => setAboutModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAboutModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>About HabitForge</Text>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                <X color={theme.textSecondary} size={22} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.aboutBody}>
              <Text style={[styles.aboutAppName, { color: theme.text }]}>🔥 HabitForge</Text>
              <Text style={[styles.aboutVersion, { color: theme.textSecondary }]}>Version 1.0.0</Text>
              
              <View style={[styles.aboutDivider, { backgroundColor: theme.border }]} />
              
              <Text style={[styles.aboutDescription, { color: theme.textSecondary }]}>
                Build lasting habits with a beautiful, distraction-free tracker. Track your streaks, 
                visualize your progress, and stay motivated every day.
              </Text>
              
              <View style={[styles.aboutDivider, { backgroundColor: theme.border }]} />
              
              <View style={styles.aboutStatsRow}>
                <View style={styles.aboutStat}>
                  <Text style={[styles.aboutStatValue, { color: theme.primary }]}>{habits.length}</Text>
                  <Text style={[styles.aboutStatLabel, { color: theme.textSecondary }]}>Habits</Text>
                </View>
                <View style={styles.aboutStat}>
                  <Text style={[styles.aboutStatValue, { color: '#10B981' }]}>{completions.length}</Text>
                  <Text style={[styles.aboutStatLabel, { color: theme.textSecondary }]}>Completions</Text>
                </View>
              </View>

              <View style={[styles.aboutDivider, { backgroundColor: theme.border }]} />

              <Text style={[styles.aboutFooter, { color: theme.textSecondary }]}>
                Made with ❤️ by Monaswi
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 8,
    marginTop: 16,
    letterSpacing: 0.8,
  },
  sectionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 20,
    padding: 18,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerZone: {
    marginTop: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // About Modal Styles
  aboutBody: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  aboutAppName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    fontWeight: '500',
  },
  aboutDivider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  aboutDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  aboutStatsRow: {
    flexDirection: 'row',
    gap: 40,
  },
  aboutStat: {
    alignItems: 'center',
  },
  aboutStatValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  aboutStatLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  aboutFooter: {
    fontSize: 14,
    fontWeight: '500',
  },
});
