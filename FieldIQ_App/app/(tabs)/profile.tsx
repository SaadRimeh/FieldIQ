import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Award, ShieldCheck, LogOut, CheckCircle, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socketService } from '../../src/services/socket';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          socketService.disconnect();
          await AsyncStorage.multiRemove(['auth_token', 'employee_info']);
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <User size={36} color="#3B82F6" />
        </View>
        <Text style={styles.userName}>Field Agent #101</Text>
        <Text style={styles.userRole}>Senior Route Technician</Text>

        <View style={styles.codeBadge}>
          <ShieldCheck size={14} color="#10B981" />
          <Text style={styles.codeText}>Code: 1234567890</Text>
        </View>
      </View>

      {/* Gamified Points Card */}
      <View style={styles.pointsCard}>
        <View style={styles.pointsHeader}>
          <Award size={28} color="#F59E0B" />
          <View>
            <Text style={styles.pointsTitle}>Employee Rewards</Text>
            <Text style={styles.pointsSub}>Gamified Shift Performance</Text>
          </View>
        </View>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreNumber}>450</Text>
          <Text style={styles.scoreUnit}>PTS</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.statVal}>12</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <MapPin size={16} color="#3B82F6" />
            <Text style={styles.statVal}>98%</Text>
            <Text style={styles.statLabel}>On-Time Rate</Text>
          </View>
        </View>
      </View>

      {/* Logout Action */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Log Out of Shift</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  userRole: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#064E3B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  codeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  pointsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  pointsSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginVertical: 8,
  },
  scoreNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: '#F59E0B',
  },
  scoreUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D97706',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#334155',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#451A03',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#78350F',
    marginTop: 'auto',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
