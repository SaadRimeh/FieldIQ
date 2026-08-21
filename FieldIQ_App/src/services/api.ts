import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Employee, DailyRoute, Invoice } from '../types';

// Default host pointing to local Node.js API Gateway (adjust host for physical Android/iOS devices or emulator)
const API_BASE_URL = 'http://10.0.2.2:3000/api'; // Android Emulator default, use 'http://localhost:3000/api' for iOS simulator

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to attach Auth Token if available
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Employee Login with 10-digit Code
  async loginWithCode(code: string): Promise<{ employee: Employee; token: string }> {
    const response = await apiClient.post('/auth/login', { code });
    const { employee, token } = response.data;
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('employee_info', JSON.stringify(employee));
    return { employee, token };
  },

  // Fetch Current Daily Route
  async getDailyRoute(employeeId: string): Promise<DailyRoute | null> {
    try {
      const response = await apiClient.get(`/dispatch/route/${employeeId}`);
      return response.data;
    } catch (error) {
      console.warn('API Offline/Error, loading cached route...');
      const cached = await AsyncStorage.getItem('cached_route');
      return cached ? JSON.parse(cached) : null;
    }
  },

  // Check-In at Task Location (Must be within 200m)
  async checkInTask(taskId: string, latitude: number, longitude: number): Promise<{ success: boolean; task: any }> {
    const response = await apiClient.post('/dispatch/check-in', {
      taskId,
      latitude,
      longitude,
    });
    return response.data;
  },

  // Submit Invoice
  async submitInvoice(taskId: string, amount: number, imageBase64: string, description?: string): Promise<Invoice> {
    const response = await apiClient.post('/invoices/submit', {
      taskId,
      amount,
      image: imageBase64,
      description,
    });
    return response.data;
  },
};
