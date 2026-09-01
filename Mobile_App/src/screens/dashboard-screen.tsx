import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { BorrowerSummary, apiRequest, formatMoney } from '@/lib/api';

type BorrowersResponse = {
  borrowers: BorrowerSummary[];
};

export function DashboardScreen() {
  const { admin, logout, token } = useAuth();
  const [borrowers, setBorrowers] = useState<BorrowerSummary[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const totals = borrowers.reduce(
    (summary, borrower) => ({
      given: summary.given + borrower.totalGiven,
      paid: summary.paid + borrower.totalPaid,
      outstanding: summary.outstanding + borrower.outstandingPrincipal,
    }),
    { given: 0, paid: 0, outstanding: 0 }
  );

  function refresh() {
    setIsRefreshing(true);
    loadBorrowers();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.greeting}>LenDen</ThemedText>
          <ThemedText style={styles.adminName}>{admin?.name}</ThemedText>
        </View>
        <Pressable onPress={logout} style={styles.logoutButton}>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <SummaryBox label="Given" value={formatMoney(totals.given)} />
        <SummaryBox label="Paid" value={formatMoney(totals.paid)} />
        <SummaryBox label="Due" value={formatMoney(totals.outstanding)} />
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Borrowers</ThemedText>
        <ThemedText style={styles.count}>{borrowers.length}</ThemedText>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#17211A" />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <ThemedText style={styles.error}>{error}</ThemedText>
          <Pressable onPress={loadBorrowers} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={borrowers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyTitle}>No borrowers yet</ThemedText>
              <ThemedText style={styles.emptyText}>Create borrowers from the API for now.</ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={({ pressed }) => [styles.borrowerCard, pressed && styles.pressed]}>
              <View style={styles.borrowerTop}>
                <View style={styles.avatar}>
                  <ThemedText style={styles.avatarText}>{item.name.slice(0, 1)}</ThemedText>
                </View>
                <View style={styles.borrowerIdentity}>
                  <ThemedText style={styles.borrowerName}>{item.name}</ThemedText>
                  <ThemedText style={styles.borrowerMeta}>
                    {item.village} • {item.mobile}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.amountRow}>
                <ThemedText style={styles.amountLabel}>Outstanding</ThemedText>
                <ThemedText style={styles.amountValue}>
                  {formatMoney(item.outstandingPrincipal)}
                </ThemedText>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryBox}>
      <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      <ThemedText style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F3',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#17211A',
    fontSize: 32,
    fontWeight: '800',
  },
  adminName: {
    color: '#66706A',
    fontSize: 14,
    marginTop: 2,
  },
  logoutButton: {
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DADDD6',
    paddingHorizontal: 14,
  },
  logoutText: {
    color: '#17211A',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  summaryBox: {
    flex: 1,
    minHeight: 82,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEDE8',
    padding: 12,
  },
  summaryLabel: {
    color: '#66706A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryValue: {
    color: '#17211A',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#17211A',
    fontSize: 22,
    fontWeight: '800',
  },
  count: {
    color: '#66706A',
    fontSize: 14,
    fontWeight: '700',
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
  },
  retryButton: {
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#17211A',
    paddingHorizontal: 18,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
  },
  emptyTitle: {
    color: '#17211A',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    color: '#66706A',
    fontSize: 14,
    marginTop: 6,
  },
  borrowerCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECEDE8',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 16,
  },
  pressed: {
    opacity: 0.82,
  },
  borrowerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCE9D2',
  },
  avatarText: {
    color: '#17211A',
    fontSize: 18,
    fontWeight: '800',
  },
  borrowerIdentity: {
    flex: 1,
  },
  borrowerName: {
    color: '#17211A',
    fontSize: 17,
    fontWeight: '800',
  },
  borrowerMeta: {
    color: '#66706A',
    fontSize: 13,
    marginTop: 3,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    color: '#66706A',
    fontSize: 13,
    fontWeight: '700',
  },
  amountValue: {
    color: '#17211A',
    fontSize: 18,
    fontWeight: '900',
  },
});
