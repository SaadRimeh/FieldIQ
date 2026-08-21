import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Employee, DailyRoute, Invoice } from '../types';

// Default API Gateway Base URL for FieldIQ Microservices
export const API_BASE_URL = 'http://10.0.2.2:3000/api'; // Use 10.0.2.2 for Android Emulator, localhost for iOS simulator/web

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Attach JWT Bearer Token if available
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // POST /api/auth/login — Authenticate Employee with 10-digit login code
  async loginWithCode(loginCode: string): Promise<{ employee: Employee; token: string }> {
    const response = await apiClient.post('/auth/login', { loginCode });
    const payload = response.data.data; // { token, employee }
    if (payload.token) {
      await AsyncStorage.setItem('auth_token', payload.token);
      await AsyncStorage.setItem('employee_info', JSON.stringify(payload.employee));
    }
    return payload;
  },

  // GET /api/dispatch/employee/:employeeId/today — Fetch employee's assigned route for today
  async getDailyRoute(employeeId: string): Promise<DailyRoute | null> {
    try {
      const response = await apiClient.get(`/dispatch/employee/${employeeId}/today`);
      const routeData = response.data.data;
      if (routeData) {
        await AsyncStorage.setItem('cached_route', JSON.stringify(routeData));
      }
      return routeData;
    } catch (error) {
      console.warn('API connection failed, attempting cached route...');
      const cached = await AsyncStorage.getItem('cached_route');
      return cached ? JSON.parse(cached) : null;
    }
  },

  // POST /api/tasks/:taskId/checkin — Check in at task location
  async checkInTask(taskId: string, latitude: number, longitude: number): Promise<any> {
    const response = await apiClient.post(`/tasks/${taskId}/checkin`, {
      latitude,
      longitude,
    });
    return response.data.data;
  },

  // POST /api/invoices — Submit expense invoice image to backend / AI queue
  async submitInvoice(taskId: string, amount: number, imageUri: string, description?: string): Promise<Invoice> {
    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('amount', amount.toString());
    if (description) formData.append('description', description);

    // Append image as multipart file object for React Native
    const filename = imageUri.split('/').pop() || 'invoice.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post('/invoices', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },
};
