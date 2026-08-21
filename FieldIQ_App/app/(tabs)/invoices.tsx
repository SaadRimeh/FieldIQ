import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Receipt, RefreshCw, CheckCircle2, Clock, AlertCircle, WifiOff } from 'lucide-react-native';
import { storageService } from '../../src/services/storage';
import { Invoice } from '../../src/types';

export default function InvoicesScreen() {
  const [offlineInvoices, setOfflineInvoices] = useState<Invoice[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadOfflineQueue = async () => {
    const queue = await storageService.getOfflineInvoices();
    setOfflineInvoices(queue);
  };

  useEffect(() => {
    loadOfflineQueue();
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    const { syncedCount, errors } = await storageService.syncOfflineInvoices();
    setIsSyncing(false);
    await loadOfflineQueue();

    if (syncedCount > 0) {
      Alert.alert('Sync Complete', `Successfully uploaded ${syncedCount} queued invoice(s) to AI pipeline!`);
    } else if (errors > 0) {
      Alert.alert('Sync Error', 'Could not reach server. Items remain safely queued offline.');
    } else {
      Alert.alert('Up to Date', 'No pending offline invoices to sync.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Receipt size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Invoice Vault & Sync</Text>
        </View>
        <TouchableOpacity
          style={styles.syncBtn}
          onPress={handleSyncNow}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#3B82F6" size="small" />
          ) : (
            <>
              <RefreshCw size={16} color="#3B82F6" />
              <Text style={styles.syncBtnText}>Sync Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {offlineInvoices.length > 0 && (
        <View style={styles.queueBanner}>
          <WifiOff size={18} color="#F59E0B" />
          <Text style={styles.queueBannerText}>
            {offlineInvoices.length} invoice(s) waiting in offline sync queue
          </Text>
        </View>
      )}

      <FlatList
        data={offlineInvoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Receipt size={56} color="#334155" />
            <Text style={styles.emptyTitle}>All Invoices Synced</Text>
            <Text style={styles.emptySub}>
              New expense invoices captured during check-ins will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.invoiceCard}>
            <View style={styles.cardMain}>
              <View style={styles.cardHeader}>
                <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>
                <View style={styles.pendingBadge}>
                  <Clock size={12} color="#F59E0B" />
                  <Text style={styles.pendingBadgeText}>Queued</Text>
                </View>
              </View>
              {item.description ? (
                <Text style={styles.descText}>{item.description}</Text>
              ) : null}
              <Text style={styles.dateText}>
                Captured: {new Date(item.createdAt).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  syncBtnText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 13,
  },
  queueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#451A03',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#78350F',
  },
  queueBannerText: {
    color: '#FCD34D',
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardMain: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  amountText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#78350F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeText: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '700',
  },
  descText: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});
