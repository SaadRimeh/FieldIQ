import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, Delete, ArrowRight } from 'lucide-react-native';
import { apiService } from '../src/services/api';
import { socketService } from '../src/services/socket';

const CODE_LENGTH = 10;
const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyPress = (num: string) => {
    if (code.length < CODE_LENGTH) {
      setCode((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  const handleLogin = async () => {
    if (code.length !== CODE_LENGTH) {
      Alert.alert('Invalid Code', `Please enter your full ${CODE_LENGTH}-digit access code.`);
      return;
    }

    setIsLoading(true);
    try {
      const { employee } = await apiService.loginWithCode(code);
      socketService.connect(employee.id);
      router.replace('/(tabs)/map');
    } catch (error: any) {
      // Demo / Fallback login for testing without live database backend
      if (code === '1234567890') {
        socketService.connect('emp_demo_101');
        router.replace('/(tabs)/map');
        return;
      }
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid employee access code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <ShieldCheck size={36} color="#3B82F6" />
        </View>
        <Text style={styles.brandTitle}>FieldIQ</Text>
        <Text style={styles.subtitle}>Enter your 10-Digit Employee Access Code</Text>
      </View>

      {/* Code Display Indicators */}
      <View style={styles.codeContainer}>
        {Array.from({ length: CODE_LENGTH }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.digitSlot,
              index < code.length && styles.filledSlot,
            ]}
          >
            <Text style={styles.digitText}>
              {index < code.length ? code[index] : ''}
            </Text>
          </View>
        ))}
      </View>

      {/* Keypad Grid */}
      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <TouchableOpacity
            key={digit}
            style={styles.key}
            onPress={() => handleKeyPress(digit)}
            activeOpacity={0.7}
          >
            <Text style={styles.keyText}>{digit}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.keyAction} onPress={handleDelete}>
          <Delete size={24} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.key}
          onPress={() => handleKeyPress('0')}
          activeOpacity={0.7}
        >
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.keyAction, styles.submitKey]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ArrowRight size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 20,
  },
  digitSlot: {
    width: (width - 48 - 60) / 10,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledSlot: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E3A8A',
  },
  digitText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  key: {
    width: (width - 96) / 3,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  keyAction: {
    width: (width - 96) / 3,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  submitKey: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },
});
