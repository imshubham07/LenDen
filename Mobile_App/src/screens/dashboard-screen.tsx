import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ProfileSheet } from '@/components/dashboard/profile-sheet';
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

const emptyBorrowerForm: BorrowerFormState = {
  name: '',
  fatherOrHusband: '',
  village: '',
  mobile: '',
  monthlyPercentage: '',
  documentNote: '',
};

export function DashboardScreen() {
  const { admin, logout, token } = useAuth();
  const router = useRouter();
  const [borrowers, setBorrowers] = useState<BorrowerSummary[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddBorrowerOpen, setIsAddBorrowerOpen] = useState(false);
  const [borrowerForm, setBorrowerForm] = useState<BorrowerFormState>(emptyBorrowerForm);
  const [formError, setFormError] = useState('');
  const [isSubmittingBorrower, setIsSubmittingBorrower] = useState(false);
  const intro = useSharedValue(0);

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
    setIsProfileOpen(false);
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

  const sections = useMemo(
    () => [
      ...(activeBorrowers.length > 0 ? [{ title: 'All Borrowers', data: activeBorrowers }] : []),
      ...(inactiveBorrowers.length > 0 ? [{ title: 'Inactive Borrowers', data: inactiveBorrowers }] : []),
    ],
    [activeBorrowers, inactiveBorrowers]
  );

  return (
    <View style={styles.screen}>
      <DashboardBackground />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.header, introStyle]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brand}>LenDen</Text>
              <Text style={styles.adminName}>Welcome, {admin?.name ?? 'Admin'}</Text>
            </View>

            <View style={styles.actionButtons}>
              <Pressable accessibilityRole="button" onPress={handleAddBorrowerOpen} style={[styles.searchButton, styles.addButton]}>
                <Text style={styles.searchButtonText}>Add Borrower</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => setShowSearch((value) => !value)}
                style={styles.searchButton}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </Pressable>
            </View>
          </View>

          {showSearch ? (
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
          ) : null}
        </Animated.View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#061B35" />
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={loadBorrowers} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <SectionList
            sections={sections}
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
                <Text style={styles.emptyTitle}>No borrowers yet</Text>
                <Text style={styles.emptyText}>Your borrower list will appear here.</Text>
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
        )}

        <BottomNav activeTab="home" onProfilePress={() => setIsProfileOpen(true)} />
      </SafeAreaView>

      {isProfileOpen ? (
        <ProfileSheet
          admin={admin}
          onClose={() => setIsProfileOpen(false)}
          onLogout={handleLogout}
        />
      ) : null}

      {isAddBorrowerOpen ? (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={handleAddBorrowerClose} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Borrower</Text>
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
    backgroundColor: '#F3F7F4',
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
  adminName: {
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE7E2',
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
    paddingBottom: 112,
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
