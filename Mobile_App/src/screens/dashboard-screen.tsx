import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotesPanel } from '@/components/dashboard/notes-panel';
import { ProfileOptions } from '@/components/dashboard/profile-options';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BorrowerCard } from '@/components/dashboard/borrower-card';
import { BottomNav } from '@/components/dashboard/bottom-nav';
import { DashboardBackground } from '@/components/dashboard/dashboard-background';
import { useAuth } from '@/context/auth-context';
import { BorrowerSummary, apiRequest } from '@/lib/api';

type BorrowersResponse = {
  borrowers: BorrowerSummary[];
};

type BorrowerFormState = {
  name: string;
  fatherOrHusband: string;
  village: string;
  mobile: string;
  monthlyPercentage: string;
  documentNote: string;
};

type BorrowerFilter = 'all' | 'active' | 'inactive';

const emptyBorrowerForm: BorrowerFormState = {
  name: '',
  fatherOrHusband: '',
  village: '',
  mobile: '',
  monthlyPercentage: '',
  documentNote: '',
};

export function DashboardScreen() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [hindi, setHindi] = useState(false);
  const [languageReady, setLanguageReady] = useState(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(`lenden:language:${user?.id}`).then((value) => {
      if (active) setHindi(value === 'hi');
    }).catch(() => {}).finally(() => { if (active) setLanguageReady(true); });
    return () => { active = false; };
  }, [user?.id]);
  async function changeLanguage(value: boolean) {
    await AsyncStorage.setItem(`lenden:language:${user?.id}`, value ? 'hi' : 'en');
    setHindi(value);
  }
  const t = (english: string, translated: string) => hindi ? translated : english;
  const [borrowers, setBorrowers] = useState<BorrowerSummary[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [borrowerFilter, setBorrowerFilter] = useState<BorrowerFilter>('active');
  const [isAddBorrowerOpen, setIsAddBorrowerOpen] = useState(false);
  const [borrowerForm, setBorrowerForm] = useState<BorrowerFormState>(emptyBorrowerForm);
  const [formError, setFormError] = useState('');
  const [isSubmittingBorrower, setIsSubmittingBorrower] = useState(false);
  const intro = useSharedValue(0);
  const homeScroll = useRef<ScrollView>(null);
  const notesPosition = useRef(0);
  const [noteFocusRequest, setNoteFocusRequest] = useState(0);

  const loadBorrowers = useCallback(async () => {
    if (!token) {
      return;
    }

    setError('');

    try {
      const response = await apiRequest<BorrowersResponse>('/api/borrowers', { token });
      setBorrowers(response.borrowers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load borrowers');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadBorrowers();
  }, [loadBorrowers]);

  useEffect(() => {
    intro.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [intro]);

  function refresh() {
    setIsRefreshing(true);
    loadBorrowers();
  }

  function handleLogout() {
    logout();
  }

  function handleAddBorrowerOpen() {
    setFormError('');
    setBorrowerForm(emptyBorrowerForm);
    setIsAddBorrowerOpen(true);
  }

  function handleAddBorrowerClose() {
    setIsAddBorrowerOpen(false);
    setFormError('');
    setBorrowerForm(emptyBorrowerForm);
  }

  function updateBorrowerField(field: keyof BorrowerFormState, value: string) {
    setBorrowerForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSaveBorrower() {
    const requiredFields: Array<keyof BorrowerFormState> = [
      'name',
      'fatherOrHusband',
      'village',
      'mobile',
      'monthlyPercentage',
    ];

    const missingField = requiredFields.find((field) => !String(borrowerForm[field]).trim());

    if (missingField) {
      setFormError('Please fill in all required fields with a red asterisk.');
      return;
    }

    const monthlyPercentage = Number(borrowerForm.monthlyPercentage);

    if (Number.isNaN(monthlyPercentage) || monthlyPercentage < 0 || monthlyPercentage > 100) {
      setFormError('Monthly percentage must be a number between 0 and 100.');
      return;
    }

    setFormError('');
    setIsSubmittingBorrower(true);

    try {
      await apiRequest('/api/borrowers', {
        token,
        method: 'POST',
        body: {
          name: borrowerForm.name.trim(),
          fatherOrHusband: borrowerForm.fatherOrHusband.trim(),
          village: borrowerForm.village.trim(),
          mobile: borrowerForm.mobile.trim(),
          monthlyPercentage,
          documentNote: borrowerForm.documentNote.trim() || undefined,
        },
      });

      setIsAddBorrowerOpen(false);
      setBorrowerForm(emptyBorrowerForm);
      await loadBorrowers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to add borrower');
    } finally {
      setIsSubmittingBorrower(false);
    }
  }

  const introStyle = useAnimatedStyle(() => ({
    opacity: intro.value,
    transform: [{ translateY: interpolate(intro.value, [0, 1], [18, 0]) }],
  }));

  const filteredBorrowers = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    if (!normalized) {
      return borrowers;
    }

    return borrowers.filter((borrower) => {
      const haystack = `${borrower.name} ${borrower.village} ${borrower.mobile}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [borrowers, searchQuery]);

  const activeBorrowers = useMemo(
    () => filteredBorrowers.filter((borrower) => borrower.outstandingPrincipal > 0),
    [filteredBorrowers]
  );

  const inactiveBorrowers = useMemo(
    () => filteredBorrowers.filter((borrower) => borrower.outstandingPrincipal <= 0),
    [filteredBorrowers]
  );

  const borrowerSections = useMemo(() => {
    if (borrowerFilter === 'all') {
      return [
        ...(activeBorrowers.length > 0 ? [{ title: 'Active Borrowers', data: activeBorrowers }] : []),
        ...(inactiveBorrowers.length > 0 ? [{ title: 'Inactive Borrowers', data: inactiveBorrowers }] : []),
      ];
    }

    if (borrowerFilter === 'inactive') {
      return inactiveBorrowers.length > 0 ? [{ title: 'Inactive Borrowers', data: inactiveBorrowers }] : [];
    }

    return activeBorrowers.length > 0 ? [{ title: 'Active Borrowers', data: activeBorrowers }] : [];
  }, [activeBorrowers, borrowerFilter, inactiveBorrowers]);

  return (
    <View style={styles.screen}>
      <DashboardBackground />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.header, introStyle]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brand}>LenDen</Text>
              <Text style={styles.userName}>{t('Welcome', 'स्वागत है')}, {user?.name ?? 'User'}</Text>
            </View>

            <View style={styles.actionButtons}>
              <Pressable accessibilityRole="button" onPress={handleAddBorrowerOpen} style={[styles.searchButton, styles.addButton]}>
                <Text style={styles.searchButtonText}>{t('Add Borrower', 'उधारकर्ता जोड़ें')}</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {activeTab === 'borrowers' && isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#061B35" />
          </View>
        ) : activeTab === 'borrowers' && error ? (
          <View style={styles.centerState}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={loadBorrowers} style={styles.retryButton}>
              <Text style={styles.retryText}>{t('Retry', 'फिर कोशिश करें')}</Text>
            </Pressable>
          </View>
        ) : activeTab === 'borrowers' ? (
          <SectionList
            sections={borrowerSections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refresh}
                tintColor="#061B35"
                progressBackgroundColor="#FFFFFF"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{t('No borrowers yet', 'अभी कोई उधारकर्ता नहीं')}</Text>
                <Text style={styles.emptyText}>{t('Your borrower list will appear here.', 'आपके उधारकर्ता यहाँ दिखेंगे।')}</Text>
              </View>
            }
            ListHeaderComponent={
              <View style={styles.borrowerTools}>
                <View style={styles.searchBox}>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search borrower"
                    placeholderTextColor="#6E7C7B"
                    style={styles.searchInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.filterRow}>
                  {(['active', 'all', 'inactive'] as BorrowerFilter[]).map((filter) => {
                    const active = borrowerFilter === filter;
                    const label = filter.charAt(0).toUpperCase() + filter.slice(1);

                    return (
                      <Pressable
                        key={filter}
                        onPress={() => setBorrowerFilter(filter)}
                        style={[styles.filterChip, active && styles.activeFilterChip]}
                      >
                        <Text style={[styles.filterChipText, active && styles.activeFilterChipText]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            }
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.count}>{section.data.length}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <BorrowerCard
                borrower={item}
                onPress={() => router.push({ pathname: '/borrower/[id]', params: { id: item.id } })}
              />
            )}
            stickySectionHeadersEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        ) : activeTab === 'profile' ? (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {user?.name?.slice(0, 1).toUpperCase() ?? 'A'}
                </Text>
              </View>
              <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
              <Text style={styles.profileMobile}>{user?.mobile ?? 'LenDen account'}</Text>

              <View style={styles.profileMetaCard}>
                <Text style={styles.profileMetaLabel}>{t('Account Type', 'खाता प्रकार')}</Text>
                <Text style={styles.profileMetaValue}>{t('User', 'उपयोगकर्ता')}</Text>
              </View>

              {languageReady ? <ProfileOptions hindi={hindi} onLanguageChange={changeLanguage} /> : null}

              <Pressable onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>{t('Logout', 'लॉग आउट')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            ref={homeScroll}
            contentContainerStyle={styles.homeContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refresh}
                tintColor="#061B35"
                progressBackgroundColor="#FFFFFF"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.quickTitle}>{t('Quick Actions', 'त्वरित कार्य')}</Text>
            <Text style={styles.quickSubtitle}>{t('What would you like to do?', 'आप क्या करना चाहते हैं?')}</Text>
            <View style={styles.quickActions}>
              {[
                { icon: '+', title: t('Add Borrower', 'उधारकर्ता जोड़ें'), detail: t('Create a new borrower record', 'नया उधारकर्ता रिकॉर्ड बनाएं'), action: handleAddBorrowerOpen },
                { icon: '⌕', title: t('Find Borrower', 'उधारकर्ता खोजें'), detail: t('Search records and manage payments', 'रिकॉर्ड खोजें और भुगतान देखें'), action: () => { setSearchQuery(''); setBorrowerFilter('all'); setActiveTab('borrowers'); } },
                { icon: '✎', title: t('Write a Note', 'नोट लिखें'), detail: t('Save a reminder or a quick thought', 'याद रखने के लिए एक छोटा नोट लिखें'), action: () => { homeScroll.current?.scrollTo({ y: notesPosition.current, animated: true }); setNoteFocusRequest((value) => value + 1); }, disabled: !languageReady },
              ].map((item) => (
                <Pressable key={item.icon} accessibilityRole="button" disabled={item.disabled} onPress={item.action} style={[styles.quickAction, item.disabled && { opacity: 0.5 }]}>
                  <View style={styles.quickIcon}><Text style={styles.quickIconText}>{item.icon}</Text></View>
                  <View style={styles.quickActionInfo}><Text style={styles.quickActionTitle}>{item.title}</Text><Text style={styles.quickActionDetail}>{item.detail}</Text></View>
                  <Text style={styles.quickChevron}>›</Text>
                </Pressable>
              ))}
            </View>
            <View onLayout={(event) => { notesPosition.current = event.nativeEvent.layout.y; }}>
              {user && languageReady ? <NotesPanel key={user.id} userId={user.id} hindi={hindi} focusRequest={noteFocusRequest} /> : null}
            </View>
          </ScrollView>
        )}

        <BottomNav
          hindi={hindi}
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />
      </SafeAreaView>

      {isAddBorrowerOpen ? (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={handleAddBorrowerClose} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('Add Borrower', 'उधारकर्ता जोड़ें')}</Text>
                <Pressable onPress={handleAddBorrowerClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
                {formError ? <Text style={styles.formError}>{formError}</Text> : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={borrowerForm.name}
                    onChangeText={(value) => updateBorrowerField('name', value)}
                    placeholder="Enter borrower name"
                    placeholderTextColor="#7A8A85"
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Father / Husband <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={borrowerForm.fatherOrHusband}
                    onChangeText={(value) => updateBorrowerField('fatherOrHusband', value)}
                    placeholder="Enter guardian name"
                    placeholderTextColor="#7A8A85"
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Village <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={borrowerForm.village}
                    onChangeText={(value) => updateBorrowerField('village', value)}
                    placeholder="Enter village"
                    placeholderTextColor="#7A8A85"
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Mobile <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={borrowerForm.mobile}
                    onChangeText={(value) => updateBorrowerField('mobile', value)}
                    placeholder="Enter mobile number"
                    placeholderTextColor="#7A8A85"
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Monthly Percentage <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={borrowerForm.monthlyPercentage}
                    onChangeText={(value) => updateBorrowerField('monthlyPercentage', value)}
                    placeholder="e.g. 5"
                    placeholderTextColor="#7A8A85"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Document Note</Text>
                  <TextInput
                    value={borrowerForm.documentNote}
                    onChangeText={(value) => updateBorrowerField('documentNote', value)}
                    placeholder="Optional note"
                    placeholderTextColor="#7A8A85"
                    multiline
                    numberOfLines={3}
                    style={[styles.input, styles.textArea]}
                  />
                </View>

                <Pressable
                  onPress={handleSaveBorrower}
                  disabled={isSubmittingBorrower}
                  style={[styles.submitButton, isSubmittingBorrower && styles.submitButtonDisabled]}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmittingBorrower ? 'Saving...' : 'Save Borrower'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#E6EEE8',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    color: '#0E1A1C',
    fontSize: 34,
    fontWeight: '900',
  },
  userName: {
    color: '#5F6F6A',
    fontSize: 14,
    marginTop: 2,
    fontWeight: '700',
  },
  searchButton: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#061B35',
    justifyContent: 'center',
    shadowColor: '#041422',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  addButton: {
    backgroundColor: '#0E7A61',
  },
  searchBox: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#EEF5F0',
    borderWidth: 1,
    borderColor: '#BFD0C7',
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  searchInput: {
    color: '#111C22',
    fontSize: 15,
    fontWeight: '700',
    minHeight: 42,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#111C22',
    fontSize: 23,
    fontWeight: '900',
  },
  count: {
    color: '#65756D',
    fontSize: 14,
    fontWeight: '800',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  error: {
    color: '#B42318',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 14,
    fontWeight: '700',
  },
  retryButton: {
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#061B35',
    paddingHorizontal: 18,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 112,
  },
  borrowerTools: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  filterChip: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF5F0',
    borderWidth: 1,
    borderColor: '#BFD0C7',
  },
  activeFilterChip: {
    backgroundColor: '#061B35',
    borderColor: '#061B35',
  },
  filterChipText: {
    color: '#5D6963',
    fontSize: 13,
    fontWeight: '900',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  homeContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 112,
  },
  quickTitle: { color: '#061B35', fontSize: 22, fontWeight: '900' },
  quickSubtitle: { color: '#60736D', fontSize: 13, marginTop: 5, marginBottom: 16 },
  quickActions: { gap: 10 },
  quickAction: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, backgroundColor: '#EEF5F0', borderWidth: 1, borderColor: '#B9CAC1' },
  quickIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#D8F4EF', alignItems: 'center', justifyContent: 'center' },
  quickIconText: { color: '#0E7A61', fontSize: 26, fontWeight: '800' },
  quickActionInfo: { flex: 1, minWidth: 0 },
  quickActionTitle: { color: '#061B35', fontSize: 15, fontWeight: '800' },
  quickActionDetail: { color: '#60736D', fontSize: 12, lineHeight: 18, marginTop: 4 },
  quickChevron: { color: '#0E7A61', fontSize: 26 },
  profileContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 112,
  },
  profileCard: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#B9CAC1',
    backgroundColor: '#EEF5F0',
    paddingHorizontal: 18,
    paddingVertical: 24,
    shadowColor: '#08203A',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  profileAvatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF8E5',
    marginBottom: 12,
  },
  profileAvatarText: {
    color: '#0C2A22',
    fontSize: 28,
    fontWeight: '900',
  },
  profileName: {
    color: '#111C22',
    fontSize: 24,
    fontWeight: '900',
  },
  profileMobile: {
    color: '#66706A',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 5,
  },
  profileMetaCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C5D5CD',
    backgroundColor: '#E3ECE7',
    padding: 14,
    marginTop: 20,
  },
  profileMetaLabel: {
    color: '#66706A',
    fontSize: 12,
    fontWeight: '800',
  },
  profileMetaValue: {
    color: '#111C22',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 5,
  },
  logoutButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#061B35',
    marginTop: 18,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
  },
  emptyTitle: {
    color: '#111C22',
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: '#66706A',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '600',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 18, 22, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#07161D',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#111C22',
    fontSize: 22,
    fontWeight: '900',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF4F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#0B1E23',
    fontSize: 18,
    fontWeight: '800',
  },
  formContent: {
    paddingBottom: 8,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#1A2523',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  required: {
    color: '#D92D20',
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9E6E0',
    backgroundColor: '#F8FBF9',
    paddingHorizontal: 12,
    color: '#0F1720',
    fontSize: 15,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  formError: {
    color: '#B42318',
    backgroundColor: '#FEE4E2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#061B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
