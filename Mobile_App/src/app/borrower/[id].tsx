import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api';

type BorrowerDetailsResponse = {
  borrower: {
    id: string;
    name: string;
    fatherOrHusband: string;
    village: string;
    mobile: string;
    monthlyPercentage: number;
    documentNote?: string | null;
    createdAt: string;
    loans: Array<{
      id: string;
      amount: number;
      purpose: string;
      givenDate: string;
      guarantor?: string | null;
      status: string;
    }>;
    payments: Array<{
      id: string;
      amount: number;
      paymentDate: string;
      note?: string | null;
    }>;
  };
  summary: {
    totalGiven: number;
    totalPaid: number;
    outstandingPrincipal: number;
  };
};

type LoanFormState = {
  amount: string;
  purpose: string;
  givenDate: string;
  guarantor: string;
};

const emptyLoanForm: LoanFormState = {
  amount: '',
  purpose: '',
  givenDate: '',
  guarantor: '',
};

export default function BorrowerDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [borrower, setBorrower] = useState<BorrowerDetailsResponse['borrower'] | null>(null);
  const [summary, setSummary] = useState<BorrowerDetailsResponse['summary'] | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
  const [loanForm, setLoanForm] = useState<LoanFormState>(emptyLoanForm);
  const [loanFormError, setLoanFormError] = useState('');
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);

  const loadBorrower = useCallback(async () => {
    if (!token || !id) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await apiRequest<BorrowerDetailsResponse>(`/api/borrowers/${id}`, { token });
      setBorrower(response.borrower);
      setSummary(response.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load borrower details');
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadBorrower();
  }, [loadBorrower]);

  function formatMoney(value: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function parseLoanDate(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const isoMatch = /^\d{4}-\d{2}-\d{2}$/.exec(trimmed);
    if (isoMatch) {
      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const slashMatch = /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.exec(trimmed);
    if (!slashMatch) {
      return null;
    }

    const [day, month, year] = trimmed.replace(/\//g, '-').split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function updateLoanField(field: keyof LoanFormState, value: string) {
    setLoanForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSaveLoan() {
    const requiredFields: Array<keyof LoanFormState> = ['amount', 'purpose', 'givenDate'];
    const missingField = requiredFields.find((field) => !String(loanForm[field]).trim());

    if (missingField) {
      setLoanFormError('Please fill in all required fields with a red asterisk.');
      return;
    }

    const amount = Number(loanForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setLoanFormError('Amount must be greater than 0.');
      return;
    }

    const givenDate = parseLoanDate(loanForm.givenDate);
    if (!givenDate) {
      setLoanFormError('Please enter a valid date in DD/MM/YYYY format.');
      return;
    }

    setLoanFormError('');
    setIsSubmittingLoan(true);

    try {
      await apiRequest('/api/loans', {
        token,
        method: 'POST',
        body: {
          borrowerId: borrower!.id,
          amount,
          purpose: loanForm.purpose.trim(),
          givenDate: givenDate.toISOString(),
          guarantor: loanForm.guarantor.trim() || undefined,
        },
      });

      setIsAddLoanOpen(false);
      setLoanForm(emptyLoanForm);
      await loadBorrower();
    } catch (err) {
      setLoanFormError(err instanceof Error ? err.message : 'Unable to add money record');
    } finally {
      setIsSubmittingLoan(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color="#061B35" />
      </View>
    );
  }

  if (error || !borrower || !summary) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.error}>{error || 'Borrower not found'}</Text>
          <Pressable onPress={() => router.back()} style={styles.retryButton}>
            <Text style={styles.retryText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Borrower Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{borrower.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{borrower.name}</Text>
            <Text style={styles.subtitle}>{borrower.village}</Text>

            <View style={styles.profileMetaInside}>
              <Text style={styles.profileMetaText}>Father / Husband: {borrower.fatherOrHusband}</Text>
              <Text style={styles.profileMetaText}>Mobile: {borrower.mobile}</Text>
              <Text style={styles.profileMetaText}>Village: {borrower.village}</Text>
              <Text style={styles.profileMetaText}>Monthly Rate: {borrower.monthlyPercentage}%</Text>
            </View>

            {borrower.documentNote ? (
              <View style={styles.documentNoteBox}>
                <Text style={styles.documentNoteLabel}>Document Note</Text>
                <Text style={styles.documentNoteText}>{borrower.documentNote}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.recordCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.summaryTitle}>Money Given</Text>
              <Pressable onPress={() => {
                const today = new Date();
                setLoanForm({
                  ...emptyLoanForm,
                  givenDate: today.toISOString().slice(0, 10),
                });
                setLoanFormError('');
                setIsAddLoanOpen(true);
              }} style={styles.addButton}>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            {borrower.loans.length ? (
              borrower.loans.map((loan) => (
                <View key={loan.id} style={styles.recordItem}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordAmount}>{formatMoney(loan.amount)}</Text>
                    <Text style={styles.recordStatus}>{loan.status}</Text>
                  </View>
                  <Text style={styles.recordSubtext}>Purpose: {loan.purpose}</Text>
                  <Text style={styles.recordSubtext}>Date: {formatDate(loan.givenDate)}</Text>
                  {loan.guarantor ? (
                    <Text style={styles.recordSubtext}>Guarantor: {loan.guarantor}</Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyStateText}>No money given records yet.</Text>
            )}
          </View>

          <View style={styles.recordCard}>
            <Text style={styles.summaryTitle}>Payments</Text>
            {borrower.payments.length ? (
              borrower.payments.map((payment) => (
                <View key={payment.id} style={styles.recordItem}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordAmount}>{formatMoney(payment.amount)}</Text>
                    <Text style={styles.recordStatus}>Paid</Text>
                  </View>
                  <Text style={styles.recordSubtext}>Date: {formatDate(payment.paymentDate)}</Text>
                  {payment.note ? <Text style={styles.recordSubtext}>Note: {payment.note}</Text> : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyStateText}>No payment records yet.</Text>
            )}
          </View>

        </ScrollView>
      </View>

      {isAddLoanOpen ? (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsAddLoanOpen(false)} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Money Record</Text>
                <Pressable onPress={() => setIsAddLoanOpen(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
                {loanFormError ? <Text style={styles.formError}>{loanFormError}</Text> : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Amount <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={loanForm.amount}
                    onChangeText={(value) => updateLoanField('amount', value)}
                    placeholder="Enter amount"
                    placeholderTextColor="#7A8A85"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Purpose <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={loanForm.purpose}
                    onChangeText={(value) => updateLoanField('purpose', value)}
                    placeholder="Cash / Business / Family"
                    placeholderTextColor="#7A8A85"
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Date <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={loanForm.givenDate}
                    onChangeText={(value) => updateLoanField('givenDate', value)}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="#7A8A85"
                    keyboardType="numbers-and-punctuation"
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Guarantor</Text>
                  <TextInput
                    value={loanForm.guarantor}
                    onChangeText={(value) => updateLoanField('guarantor', value)}
                    placeholder="Optional guarantor name"
                    placeholderTextColor="#7A8A85"
                    style={styles.input}
                  />
                </View>

                <Pressable
                  onPress={handleSaveLoan}
                  disabled={isSubmittingLoan}
                  style={[styles.submitButton, isSubmittingLoan && styles.submitButtonDisabled]}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmittingLoan ? 'Saving...' : 'Save Record'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F7F4',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F7F4',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerSpacer: {
    width: 36,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDE8E2',
  },
  backButtonText: {
    color: '#061B35',
    fontSize: 22,
    fontWeight: '900',
  },
  headerTitle: {
    color: '#121C22',
    fontSize: 18,
    fontWeight: '900',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: '#E3EAE5',
    marginBottom: 18,
  },
  documentNoteBox: {
    width: '100%',
    backgroundColor: '#F6FBF8',
    borderWidth: 1,
    borderColor: '#E5F0EA',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },
  documentNoteLabel: {
    color: '#0E7A61',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
  },
  documentNoteText: {
    color: '#354A46',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DFF7E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#0F3529',
    fontSize: 28,
    fontWeight: '900',
  },
  name: {
    color: '#111C22',
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: '#66706A',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  profileMetaInside: {
    width: '100%',
    backgroundColor: '#F8FBF9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E6EFEA',
  },
  profileMetaText: {
    color: '#1E2927',
    fontSize: 14,
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3EAE5',
    padding: 16,
    marginBottom: 18,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3EAE5',
    padding: 16,
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    color: '#111C22',
    fontSize: 18,
    fontWeight: '900',
  },
  addButton: {
    backgroundColor: '#061B35',
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F0',
  },
  summaryLabel: {
    color: '#5D6963',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryValue: {
    color: '#101C22',
    fontSize: 14,
    fontWeight: '900',
  },
  recordItem: {
    backgroundColor: '#F7FAF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7EFEA',
    padding: 12,
    marginBottom: 10,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordAmount: {
    color: '#0E1A1C',
    fontSize: 16,
    fontWeight: '900',
  },
  recordStatus: {
    color: '#0E7A61',
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: '#E6F8DD',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  recordSubtext: {
    color: '#4B5F5A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyStateText: {
    color: '#66706A',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 18, 22, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
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
  outstanding: {
    color: '#B85B00',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F7F4',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F3F7F4',
  },
  error: {
    color: '#B42318',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: 14,
  },
  retryButton: {
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#061B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
