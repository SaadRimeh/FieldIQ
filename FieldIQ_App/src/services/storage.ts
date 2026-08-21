import AsyncStorage from '@react-native-async-storage/async-storage';
import { Invoice } from '../types';
import { apiService } from './api';

const OFFLINE_INVOICES_KEY = 'offline_invoices_queue';

export const storageService = {
  // Save an invoice locally when network is unavailable
  async saveOfflineInvoice(invoiceData: { taskId: string; amount: number; imageBase64: string; description?: string }): Promise<Invoice> {
    const existing = await this.getOfflineInvoices();
    const newInvoice: Invoice = {
      id: `offline_${Date.now()}`,
      taskId: invoiceData.taskId,
      amount: invoiceData.amount,
      imageUrl: invoiceData.imageBase64,
      description: invoiceData.description,
      status: 'PENDING',
      syncedOffline: false,
      createdAt: new Date().toISOString(),
    };

    existing.push(newInvoice);
    await AsyncStorage.setItem(OFFLINE_INVOICES_KEY, JSON.stringify(existing));
    return newInvoice;
  },

  // Get all offline queued invoices
  async getOfflineInvoices(): Promise<Invoice[]> {
    const data = await AsyncStorage.getItem(OFFLINE_INVOICES_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Sync offline invoices to backend
  async syncOfflineInvoices(): Promise<{ syncedCount: number; errors: number }> {
    const queue = await this.getOfflineInvoices();
    if (queue.length === 0) return { syncedCount: 0, errors: 0 };

    const remaining: Invoice[] = [];
    let syncedCount = 0;
    let errors = 0;

    for (const item of queue) {
      try {
        await apiService.submitInvoice(item.taskId, item.amount, item.imageUrl, item.description);
        syncedCount++;
      } catch (err) {
        console.error('Failed to sync offline invoice:', item.id, err);
        errors++;
        remaining.push(item);
      }
    }

    await AsyncStorage.setItem(OFFLINE_INVOICES_KEY, JSON.stringify(remaining));
    return { syncedCount, errors };
  },
};
