import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
      updatedAt: string;
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

type PaymentFormState = {
  amount: string;
  paymentDate: string;
  note: string;
};

type DatePickerTarget = 'loan' | 'payment';
type CalculatorTarget = 'loan' | 'payment';
type LoanStatus = 'ACTIVE' | 'CLOSED';
type LoanRecord = BorrowerDetailsResponse['borrower']['loans'][number];
const STATUS_CHANGE_WINDOW_MS = 15 * 60 * 1000;

const emptyLoanForm: LoanFormState = {
  amount: '',
  purpose: '',
  givenDate: '',
  guarantor: '',
};

const emptyPaymentForm: PaymentFormState = {
  amount: '',
  paymentDate: '',
  note: '',
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
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(emptyPaymentForm);
  const [paymentFormError, setPaymentFormError] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget | null>(null);
  const [pickerMonth, setPickerMonth] = useState(() => new Date());
  const [calculatorTarget, setCalculatorTarget] = useState<CalculatorTarget | null>(null);
  const [calculatorValue, setCalculatorValue] = useState('');
  const [calculatorError, setCalculatorError] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<LoanRecord | null>(null);
  const [loanStatusError, setLoanStatusError] = useState('');
  const [isUpdatingLoanStatus, setIsUpdatingLoanStatus] = useState(false);
  const isPaymentCleared = (summary?.outstandingPrincipal ?? 0) <= 0;

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

  const calendarDays = useMemo(() => {
    const year = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days: Array<number | null> = Array.from({ length: firstDay }, () => null);

    for (let day = 1; day <= totalDays; day += 1) {
      days.push(day);
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [pickerMonth]);

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

  function formatFormDate(date: Date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
  }

  function formatRecordCount(count: number) {
    return `${count} ${count === 1 ? 'record' : 'records'}`;
  }

  function canChangeLoanStatus(loan: LoanRecord) {
    if (loan.status !== 'CLOSED') {
      return true;
    }

    return Date.now() - new Date(loan.updatedAt).getTime() <= STATUS_CHANGE_WINDOW_MS;
  }

  function getActiveFormDate() {
    const value = datePickerTarget === 'loan' ? loanForm.givenDate : paymentForm.paymentDate;
    return parseLoanDate(value) ?? new Date();
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

  function updatePaymentField(field: keyof PaymentFormState, value: string) {
    setPaymentForm((current) => ({ ...current, [field]: value }));
  }

  function openCalculator(target: CalculatorTarget) {
    const amount = target === 'loan' ? loanForm.amount : paymentForm.amount;
    setCalculatorTarget(target);
    setCalculatorValue(amount.trim());
    setCalculatorError('');
  }

  function openPaymentModal() {
    const today = new Date();
    setPaymentForm({
      ...emptyPaymentForm,
      paymentDate: formatFormDate(today),
    });
    setPaymentFormError('');
    setIsPaymentOpen(true);
  }

  function openDatePicker(target: DatePickerTarget) {
    const value = target === 'loan' ? loanForm.givenDate : paymentForm.paymentDate;
    const parsed = parseLoanDate(value) ?? new Date();

    setPickerMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    setDatePickerTarget(target);
  }

  function selectDate(day: number) {
    const selected = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day);
    const formatted = formatFormDate(selected);

    if (datePickerTarget === 'loan') {
      updateLoanField('givenDate', formatted);
    } else if (datePickerTarget === 'payment') {
      updatePaymentField('paymentDate', formatted);
    }

    setDatePickerTarget(null);
  }

  function movePickerMonth(direction: -1 | 1) {
    setPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  function selectToday() {
    const today = new Date();
    const formatted = formatFormDate(today);

    if (datePickerTarget === 'loan') {
      updateLoanField('givenDate', formatted);
    } else if (datePickerTarget === 'payment') {
      updatePaymentField('paymentDate', formatted);
    }

    setPickerMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setDatePickerTarget(null);
  }

  function calculateExpression(expression: string) {
    const compactExpression = expression.replace(/\s/g, '');
    if (!compactExpression) {
      return null;
    }

    const values: number[] = [];
    const operators: string[] = [];
    const priority: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
    let index = 0;
    let expectsValue = true;

    function applyOperator() {
      const operator = operators.pop();
      const right = values.pop();
      const left = values.pop();

      if (!operator || left === undefined || right === undefined) {
        return false;
      }

      if (operator === '+') values.push(left + right);
      if (operator === '-') values.push(left - right);
      if (operator === '*') values.push(left * right);
      if (operator === '/') {
        if (right === 0) return false;
        values.push(left / right);
      }

      return true;
    }

    while (index < compactExpression.length) {
      const char = compactExpression[index];

      if (char === '-' && expectsValue) {
        const sign = -1;
        index += 1;
        let numberText = '';

        while (index < compactExpression.length && /[\d.]/.test(compactExpression[index])) {
          numberText += compactExpression[index];
          index += 1;
        }

        if (!numberText || (numberText.match(/\./g)?.length ?? 0) > 1) {
          return null;
        }

        values.push(sign * Number(numberText));
        expectsValue = false;
        continue;
      }

      if (/[\d.]/.test(char)) {
        let numberText = '';

        while (index < compactExpression.length && /[\d.]/.test(compactExpression[index])) {
          numberText += compactExpression[index];
          index += 1;
        }

        if (!expectsValue || (numberText.match(/\./g)?.length ?? 0) > 1) {
          return null;
        }

        const value = Number(numberText);
        if (!Number.isFinite(value)) {
          return null;
        }

        values.push(value);
        expectsValue = false;
        continue;
      }

      if (char === '%') {
        if (expectsValue || values.length === 0) {
          return null;
        }

        values[values.length - 1] = values[values.length - 1] / 100;
        index += 1;
        continue;
      }

      if (!['+', '-', '*', '/'].includes(char) || expectsValue) {
        return null;
      }

      while (operators.length && priority[operators[operators.length - 1]] >= priority[char]) {
        if (!applyOperator()) return null;
      }
      operators.push(char);
      expectsValue = true;
      index += 1;
    }

    if (expectsValue) {
      return null;
    }

    while (operators.length) {
      if (!applyOperator()) return null;
    }

    return values.length === 1 && Number.isFinite(values[0]) ? values[0] : null;
  }

  function pressCalculatorKey(key: string) {
    setCalculatorError('');

    if (key === 'C') {
      setCalculatorValue('');
      return;
    }

    if (key === '⌫') {
      setCalculatorValue((current) => current.slice(0, -1));
      return;
    }

    if (key === '=') {
      const result = calculateExpression(calculatorValue);
      if (result === null) {
        setCalculatorError('Enter a valid calculation.');
        return;
      }

      setCalculatorValue(String(Number(result.toFixed(2))));
      return;
    }

    setCalculatorValue((current) => `${current}${key}`);
  }

  async function updateLoanStatus(status: LoanStatus) {
    if (!selectedLoan) {
      return;
    }

    setLoanStatusError('');
    setIsUpdatingLoanStatus(true);

    try {
      await apiRequest(`/api/loans/${selectedLoan.id}/status`, {
        token,
        method: 'PATCH',
        body: { status },
      });

      setSelectedLoan(null);
      await loadBorrower();
    } catch (err) {
      setLoanStatusError(err instanceof Error ? err.message : 'Unable to update loan status');
    } finally {
      setIsUpdatingLoanStatus(false);
    }
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

  async function handleSavePayment() {
    const requiredFields: Array<keyof PaymentFormState> = ['amount', 'paymentDate'];
    const missingField = requiredFields.find((field) => !String(paymentForm[field]).trim());

    if (missingField) {
      setPaymentFormError('Please fill in all required fields with a red asterisk.');
      return;
    }

    const amount = Number(paymentForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setPaymentFormError('Amount must be greater than 0.');
      return;
    }

    const paymentDate = parseLoanDate(paymentForm.paymentDate);
    if (!paymentDate) {
      setPaymentFormError('Please enter a valid date in DD/MM/YYYY format.');
      return;
    }

    setPaymentFormError('');
    setIsSubmittingPayment(true);

    try {
      await apiRequest('/api/payments', {
        token,
        method: 'POST',
        body: {
          borrowerId: borrower!.id,
          amount,
          paymentDate: paymentDate.toISOString(),
          note: paymentForm.note.trim() || undefined,
        },
      });

      setIsPaymentOpen(false);
      setPaymentForm(emptyPaymentForm);
      await loadBorrower();
    } catch (err) {
      setPaymentFormError(err instanceof Error ? err.message : 'Unable to receive payment');
    } finally {
      setIsSubmittingPayment(false);
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
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Borrower Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatarShadow} />
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{borrower.name.charAt(0).toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.profileTitleBlock}>
                <Text style={styles.name} numberOfLines={1}>{borrower.name}</Text>
                <View style={styles.inlineMetaRow}>
                  <Text style={styles.subtitle} numberOfLines={1}>{borrower.village}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.subtitle} numberOfLines={1}>{borrower.mobile}</Text>
                </View>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoTile}>
                <Text style={styles.infoLabel}>Father / Husband Name</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{borrower.fatherOrHusband}</Text>
              </View>
              <View style={styles.infoTile}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{borrower.mobile}</Text>
              </View>
              <View style={styles.infoTile}>
                <Text style={styles.infoLabel}>Monthly Interest</Text>
                <Text style={styles.infoValue}>{borrower.monthlyPercentage}%</Text>
              </View>
              <View style={styles.infoTile}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[styles.infoValue, summary.outstandingPrincipal > 0 && styles.outstanding]}>
                  {summary.outstandingPrincipal > 0 ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            {borrower.documentNote ? (
              <View style={styles.documentNoteBox}>
                <Text style={styles.documentNoteLabel}>Document Details</Text>
                <Text style={styles.documentNoteText}>{borrower.documentNote}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.moneyGivenCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.summaryTitle}>Loan Records</Text>
                <Text style={styles.sectionSubtitle}>{formatRecordCount(borrower.loans.length)}</Text>
              </View>
              <Pressable onPress={() => {
                const today = new Date();
                setLoanForm({
                  ...emptyLoanForm,
                  givenDate: formatFormDate(today),
                });
                setLoanFormError('');
                setIsAddLoanOpen(true);
              }} style={styles.addButton}>
                <Text style={styles.addButtonText}>Add Loan</Text>
              </Pressable>
            </View>

            {borrower.loans.length ? (
              borrower.loans.map((loan) => {
                const canChangeStatus = canChangeLoanStatus(loan);

                return (
                  <Pressable
                    key={loan.id}
                    disabled={!canChangeStatus}
                    onPress={() => {
                      setSelectedLoan(loan);
                      setLoanStatusError('');
                    }}
                    android_ripple={{ color: '#DCE8E1' }}
                    style={[
                      styles.loanItem,
                      loan.status === 'CLOSED' && styles.closedLoanItem,
                    ]}
                  >
                    <View style={styles.loanAccent} />
                    <View style={styles.loanAmountBubble}>
                      <Text style={styles.loanAmountIcon}>₹</Text>
                    </View>

                    <View style={styles.loanInfo}>
                      <View style={[styles.recordHeader, styles.loanRecordHeader]}>
                        <Text style={styles.recordAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{formatMoney(loan.amount)}</Text>
                        <Text style={[styles.recordStatus, loan.status === 'CLOSED' && styles.closedStatus]}>
                          {loan.status === 'CLOSED' ? 'Paid' : 'Active'}
                        </Text>
                      </View>
                      <Text style={styles.recordPurpose} numberOfLines={1}>{loan.purpose}</Text>
                      <View style={styles.recordMetaRow}>
                        <Text style={[styles.recordSubtext, styles.recordDate]}>{formatDate(loan.givenDate)}</Text>
                        {loan.guarantor ? (
                          <Text style={[styles.recordSubtext, styles.recordGuarantor]} numberOfLines={1}>
                            • {loan.guarantor}
                          </Text>
                        ) : null}
                      </View>
                      {loan.status === 'CLOSED' && canChangeStatus ? (
                        <Text style={styles.undoHint}>Undo within 15 min</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.emptyStateText}>No loan records yet.</Text>
            )}
          </View>

          <View style={styles.recordCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.summaryTitle}>Payments</Text>
                <Text style={styles.sectionSubtitle}>{formatRecordCount(borrower.payments.length)}</Text>
              </View>
              {!isPaymentCleared ? (
                <Pressable onPress={openPaymentModal} style={[styles.addButton, styles.receiveButton]}>
                  <Text style={styles.addButtonText}>Receive</Text>
                </Pressable>
              ) : (
                <View style={styles.clearedBadge}>
                  <Text style={styles.clearedBadgeText}>Cleared</Text>
                </View>
              )}
            </View>
            {borrower.payments.length ? (
              borrower.payments.map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentIcon}>
                    <Text style={styles.paymentIconText}>✓</Text>
                  </View>

                  <View style={styles.paymentInfo}>
                    <View style={styles.recordHeader}>
                      <Text style={styles.recordAmount}>{formatMoney(payment.amount)}</Text>
                      <Text style={[styles.recordStatus, styles.paidStatus]}>Paid</Text>
                    </View>
                    <Text style={styles.recordSubtext}>{formatDate(payment.paymentDate)}</Text>
                    {payment.note ? <Text style={styles.recordPurpose} numberOfLines={1}>{payment.note}</Text> : null}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyStateText}>No payments received yet.</Text>
            )}
          </View>

        </ScrollView>

        <Pressable onPress={() => openCalculator('loan')} style={styles.floatingCalculatorButton}>
          <View style={styles.floatingCalculatorIcon}>
            <View style={styles.floatingCalculatorScreen} />
            <View style={styles.floatingCalculatorPad}>
              {Array.from({ length: 9 }, (_, index) => (
                <View key={index} style={styles.floatingCalculatorDot} />
              ))}
            </View>
          </View>
        </Pressable>
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
                <Text style={styles.modalTitle}>Add Loan</Text>
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
                    Loan Purpose <Text style={styles.required}>*</Text>
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
                    Loan Date <Text style={styles.required}>*</Text>
                  </Text>
                  <Pressable onPress={() => openDatePicker('loan')} style={styles.dateInput}>
                    <Text style={[styles.dateInputText, !loanForm.givenDate && styles.datePlaceholder]}>
                      {loanForm.givenDate || 'Select date'}
                    </Text>
                    <Text style={styles.dateIcon}>▾</Text>
                  </Pressable>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Guarantor Name</Text>
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
                    {isSubmittingLoan ? 'Saving...' : 'Save Loan'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      ) : null}

      {isPaymentOpen ? (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsPaymentOpen(false)} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Receive Payment</Text>
                <Pressable onPress={() => setIsPaymentOpen(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
                {paymentFormError ? <Text style={styles.formError}>{paymentFormError}</Text> : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Amount <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={paymentForm.amount}
                    onChangeText={(value) => updatePaymentField('amount', value)}
                    placeholder="Enter received amount"
                    placeholderTextColor="#7A8A85"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Payment Date <Text style={styles.required}>*</Text>
                  </Text>
                  <Pressable onPress={() => openDatePicker('payment')} style={styles.dateInput}>
                    <Text style={[styles.dateInputText, !paymentForm.paymentDate && styles.datePlaceholder]}>
                      {paymentForm.paymentDate || 'Select date'}
                    </Text>
                    <Text style={styles.dateIcon}>▾</Text>
                  </Pressable>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Payment Note</Text>
                  <TextInput
                    value={paymentForm.note}
                    onChangeText={(value) => updatePaymentField('note', value)}
                    placeholder="Optional payment note"
                    placeholderTextColor="#7A8A85"
                    style={[styles.input, styles.textArea]}
                    multiline
                  />
                </View>

                <Pressable
                  onPress={handleSavePayment}
                  disabled={isSubmittingPayment}
                  style={[styles.submitButton, styles.receiveSubmitButton, isSubmittingPayment && styles.submitButtonDisabled]}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmittingPayment ? 'Saving...' : 'Save Payment'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      ) : null}

      {datePickerTarget ? (
        <View style={styles.datePickerOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDatePickerTarget(null)} />
          <View style={styles.datePickerCard}>
            <View style={styles.datePickerHeader}>
              <Pressable onPress={() => movePickerMonth(-1)} style={styles.monthButton}>
                <Text style={styles.monthButtonText}>‹</Text>
              </Pressable>
              <Text style={styles.datePickerTitle}>
                {pickerMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable onPress={() => movePickerMonth(1)} style={styles.monthButton}>
                <Text style={styles.monthButtonText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text key={`${day}-${index}`} style={styles.weekText}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const activeDate = getActiveFormDate();
                const isSelected =
                  day !== null &&
                  activeDate.getDate() === day &&
                  activeDate.getMonth() === pickerMonth.getMonth() &&
                  activeDate.getFullYear() === pickerMonth.getFullYear();

                return (
                  <Pressable
                    key={`${day ?? 'blank'}-${index}`}
                    disabled={day === null}
                    onPress={() => day !== null && selectDate(day)}
                    style={[styles.dayCell, isSelected && styles.selectedDayCell]}
                  >
                    <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                      {day ?? ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.datePickerActions}>
              <Pressable onPress={() => setDatePickerTarget(null)} style={styles.cancelDateButton}>
                <Text style={styles.cancelDateText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={selectToday} style={styles.todayButton}>
                <Text style={styles.todayButtonText}>Today</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {calculatorTarget ? (
        <View style={styles.calculatorOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCalculatorTarget(null)} />
          <View style={styles.calculatorCard}>
            <View style={styles.calculatorHeader}>
              <Text style={styles.calculatorTitle}>Mini Calculator</Text>
              <Pressable onPress={() => setCalculatorTarget(null)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.calculatorDisplay}>
              <Text style={styles.calculatorDisplayText} numberOfLines={1}>
                {calculatorValue || '0'}
              </Text>
            </View>
            {calculatorError ? <Text style={styles.calculatorError}>{calculatorError}</Text> : null}

            <View style={styles.calculatorGrid}>
              {['C', '⌫', '%', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '00', '.', '='].map((key) => (
                <Pressable
                  key={key}
                  onPress={() => pressCalculatorKey(key)}
                  style={[
                    styles.calculatorKey,
                    ['+', '-', '*', '/', '%', '='].includes(key) && styles.operatorKey,
                    key === 'C' && styles.clearKey,
                    key === '=' && styles.equalsKey,
                  ]}
                >
                  <Text
                    style={[
                      styles.calculatorKeyText,
                      ['+', '-', '*', '/', '%', '='].includes(key) && styles.operatorKeyText,
                      key === 'C' && styles.clearKeyText,
                      key === '=' && styles.equalsKeyText,
                    ]}
                  >
                    {key}
                  </Text>
                </Pressable>
              ))}
            </View>

          </View>
        </View>
      ) : null}

      {selectedLoan ? (
        <View style={styles.statusOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedLoan(null)} />
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Change Loan Status</Text>
              <Pressable onPress={() => setSelectedLoan(null)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.statusAmount}>{formatMoney(selectedLoan.amount)}</Text>
            <Text style={styles.statusDescription} numberOfLines={2}>
              {selectedLoan.purpose} • {formatDate(selectedLoan.givenDate)}
            </Text>

            {loanStatusError ? <Text style={styles.formError}>{loanStatusError}</Text> : null}

            <Pressable
              disabled={isUpdatingLoanStatus}
              onPress={() => updateLoanStatus(selectedLoan.status === 'CLOSED' ? 'ACTIVE' : 'CLOSED')}
              style={[styles.statusActionButton, isUpdatingLoanStatus && styles.submitButtonDisabled]}
            >
              <Text style={styles.statusActionText}>
                {isUpdatingLoanStatus
                  ? 'Updating...'
                  : selectedLoan.status === 'CLOSED'
                    ? 'Change back to Active'
                    : 'Mark as Paid'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E6EEE8',
  },
  container: {
    flex: 1,
    backgroundColor: '#E6EEE8',
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B9CAC1',
    shadowColor: '#08203A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  backButtonText: {
    color: '#061B35',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 32,
  },
  headerTitle: {
    color: '#121C22',
    fontSize: 18,
    fontWeight: '900',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: '#061B35',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#123A63',
    marginBottom: 18,
    shadowColor: '#061B35',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    width: 76,
    height: 76,
  },
  avatarShadow: {
    position: 'absolute',
    left: 7,
    top: 10,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#78EC34',
    opacity: 0.62,
  },
  documentNoteBox: {
    width: '100%',
    backgroundColor: '#102D48',
    borderWidth: 1,
    borderColor: '#244662',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },
  documentNoteLabel: {
    color: '#78EC34',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
  },
  documentNoteText: {
    color: '#DCE8E1',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#D8F4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#071D36',
    fontSize: 32,
    fontWeight: '900',
  },
  profileTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: '#B9C8D8',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 5,
  },
  inlineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 5,
  },
  metaDot: {
    color: '#78EC34',
    fontSize: 12,
    fontWeight: '900',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  infoTile: {
    width: '48%',
    minHeight: 68,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#244662',
    backgroundColor: '#102D48',
    padding: 12,
    justifyContent: 'center',
  },
  infoLabel: {
    color: '#9FB1C4',
    fontSize: 11,
    fontWeight: '800',
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE7E2',
    padding: 18,
    marginBottom: 18,
    shadowColor: '#071822',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  moneyGivenCard: {
    backgroundColor: '#EEF5F0',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#B9CAC1',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#071822',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  recordCard: {
    backgroundColor: '#EEF5F0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#B9CAC1',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#071822',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryTitle: {
    color: '#111C22',
    fontSize: 18,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#6B7C76',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  addButton: {
    backgroundColor: '#0E7A61',
    minHeight: 36,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  receiveButton: {
    backgroundColor: '#061B35',
  },
  clearedBadge: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D7F4DF',
    borderWidth: 1,
    borderColor: '#B7DCC1',
  },
  clearedBadgeText: {
    color: '#0E7A61',
    fontSize: 12,
    fontWeight: '900',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F0',
  },
  summaryLastRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  summaryLabel: {
    color: '#5D6963',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryValue: {
    color: '#101C22',
    fontSize: 15,
    fontWeight: '900',
  },
  moneyStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  moneyStat: {
    flex: 1,
    minHeight: 76,
    borderRadius: 16,
    backgroundColor: '#E3ECE7',
    borderWidth: 1,
    borderColor: '#C5D5CD',
    padding: 12,
    justifyContent: 'center',
  },
  moneyStatLabel: {
    color: '#6D7C77',
    fontSize: 11,
    fontWeight: '800',
  },
  moneyStatValue: {
    color: '#101C22',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 7,
  },
  loanItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    position: 'relative',
    backgroundColor: '#F6FAF7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C5D5CD',
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  closedLoanItem: {
    opacity: 0.72,
  },
  loanAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#061B35',
  },
  loanAmountBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F6EE',
    flexShrink: 0,
  },
  loanAmountIcon: {
    color: '#0E7A61',
    fontSize: 20,
    fontWeight: '900',
  },
  loanInfo: {
    flex: 1,
    minWidth: 0,
  },
  recordItem: {
    backgroundColor: '#F6FAF7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C5D5CD',
    padding: 14,
    marginBottom: 12,
  },
  paymentItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F4FBF6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFE2C8',
    padding: 12,
    marginBottom: 12,
  },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D7F4DF',
  },
  paymentIconText: {
    color: '#0E7A61',
    fontSize: 18,
    fontWeight: '900',
  },
  paymentInfo: {
    flex: 1,
    minWidth: 0,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  recordAmount: {
    color: '#0E1A1C',
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
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
    flexShrink: 0,
  },
  loanRecordHeader: {
    flexWrap: 'nowrap',
  },
  paidStatus: {
    color: '#0E7A61',
    backgroundColor: '#D7F4DF',
  },
  closedStatus: {
    color: '#40534D',
    backgroundColor: '#DCE8E1',
  },
  recordSubtext: {
    color: '#4B5F5A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  undoHint: {
    color: '#B85B00',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 6,
  },
  recordMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordDate: {
    flexShrink: 0,
  },
  recordGuarantor: {
    flex: 1,
    minWidth: 0,
  },
  recordPurpose: {
    color: '#1F2D32',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
    lineHeight: 20,
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
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountInput: {
    flex: 1,
  },
  calculatorButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#061B35',
    shadowColor: '#061B35',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  calculatorButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  floatingCalculatorButton: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#061B35',
    borderWidth: 1,
    borderColor: '#123A63',
    shadowColor: '#061B35',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 10,
  },
  floatingCalculatorIcon: {
    width: 32,
    height: 36,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    padding: 4,
  },
  floatingCalculatorScreen: {
    height: 8,
    borderRadius: 3,
    backgroundColor: '#78EC34',
    marginBottom: 5,
  },
  floatingCalculatorPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2.5,
  },
  floatingCalculatorDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: '#FFFFFF',
  },
  dateInput: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9E6E0',
    backgroundColor: '#F8FBF9',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateInputText: {
    color: '#0F1720',
    fontSize: 15,
    fontWeight: '800',
  },
  datePlaceholder: {
    color: '#7A8A85',
  },
  dateIcon: {
    color: '#061B35',
    fontSize: 16,
    fontWeight: '900',
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
  receiveSubmitButton: {
    backgroundColor: '#0E7A61',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  textArea: {
    minHeight: 84,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  outstanding: {
    color: '#B85B00',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6EEE8',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#E6EEE8',
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
  datePickerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 18, 22, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 40,
    paddingHorizontal: 18,
  },
  datePickerCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    backgroundColor: '#EEF5F0',
    borderWidth: 1,
    borderColor: '#B9CAC1',
    padding: 16,
    shadowColor: '#061B35',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#061B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 30,
  },
  datePickerTitle: {
    color: '#061B35',
    fontSize: 18,
    fontWeight: '900',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekText: {
    width: '14.285%',
    textAlign: 'center',
    color: '#60736D',
    fontSize: 12,
    fontWeight: '900',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  selectedDayCell: {
    backgroundColor: '#061B35',
  },
  dayText: {
    color: '#10201C',
    fontSize: 14,
    fontWeight: '800',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  cancelDateButton: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCE8E1',
  },
  cancelDateText: {
    color: '#40534D',
    fontSize: 13,
    fontWeight: '900',
  },
  todayButton: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E7A61',
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  calculatorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 18, 22, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    paddingHorizontal: 18,
  },
  calculatorCard: {
    width: '100%',
    maxWidth: 272,
    borderRadius: 18,
    backgroundColor: '#EEF5F0',
    borderWidth: 1,
    borderColor: '#B9CAC1',
    padding: 10,
    shadowColor: '#061B35',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  calculatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calculatorTitle: {
    color: '#061B35',
    fontSize: 16,
    fontWeight: '900',
  },
  calculatorDisplay: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#061B35',
    paddingHorizontal: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 8,
  },
  calculatorDisplayText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
  },
  calculatorError: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  calculatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  calculatorKey: {
    width: '23%',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D3E0D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorKey: {
    backgroundColor: '#D8F4EF',
    borderColor: '#B6DDD4',
  },
  clearKey: {
    backgroundColor: '#FEE4E2',
    borderColor: '#F5B8B3',
  },
  equalsKey: {
    backgroundColor: '#061B35',
    borderColor: '#061B35',
  },
  calculatorKeyText: {
    color: '#10201C',
    fontSize: 16,
    fontWeight: '900',
  },
  operatorKeyText: {
    color: '#061B35',
  },
  clearKeyText: {
    color: '#B42318',
  },
  equalsKeyText: {
    color: '#FFFFFF',
  },
  statusOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 18, 22, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 60,
    paddingHorizontal: 18,
  },
  statusCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    backgroundColor: '#EEF5F0',
    borderWidth: 1,
    borderColor: '#B9CAC1',
    padding: 16,
    shadowColor: '#061B35',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusTitle: {
    color: '#061B35',
    fontSize: 18,
    fontWeight: '900',
  },
  statusAmount: {
    color: '#0E1A1C',
    fontSize: 28,
    fontWeight: '900',
  },
  statusDescription: {
    color: '#4B5F5A',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 14,
  },
  statusActionButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#0E7A61',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
