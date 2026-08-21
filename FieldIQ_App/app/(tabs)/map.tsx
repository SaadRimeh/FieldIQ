import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation, MapPin, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useLocationTracking } from '../../src/hooks/useLocationTracking';
import { useGeofence } from '../../src/hooks/useGeofence';
import { CheckInButton } from '../../src/components/CheckInButton';
import { InvoiceModal } from '../../src/components/InvoiceModal';
import { apiService } from '../../src/services/api';
import { TaskLocation, DailyRoute } from '../../src/types';

// Mock initial route for testing/demo
const DEFAULT_MOCK_TASKS: TaskLocation[] = [
  { id: 'task-101', latitude: 37.7749, longitude: -122.4194, sequenceOrder: 1, address: '742 Market St, San Francisco', isCompleted: false },
  { id: 'task-102', latitude: 37.7833, longitude: -122.4167, sequenceOrder: 2, address: '500 Howard St, San Francisco', isCompleted: false },
  { id: 'task-103', latitude: 37.7891, longitude: -122.4014, sequenceOrder: 3, address: '1 Enterprise Way, San Francisco', isCompleted: false },
];

export default function MapScreen() {
  const { currentLocation } = useLocationTracking('emp_demo_101');
  const [tasks, setTasks] = useState<TaskLocation[]>(DEFAULT_MOCK_TASKS);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const activeTask = tasks[currentTaskIndex] || null;
  const { distanceMeters, isWithinGeofence } = useGeofence(currentLocation, activeTask);

  const handleCheckIn = async () => {
    if (!activeTask || !currentLocation) return;
    setIsCheckingIn(true);
    try {
      await apiService.checkInTask(activeTask.id, currentLocation.latitude, currentLocation.longitude);
    } catch (e) {
      console.log('Checkin endpoint notice - proceeding with offline/local checkin');
    }
    setIsCheckingIn(false);
    setIsCheckedIn(true);
    setIsInvoiceModalVisible(true);
  };

  const handleInvoiceSuccess = () => {
    // Mark current task as completed and auto-navigate to next destination
    setTasks((prevTasks) =>
      prevTasks.map((t, idx) => (idx === currentTaskIndex ? { ...t, isCompleted: true } : t))
    );

    setIsCheckedIn(false);

    if (currentTaskIndex < tasks.length - 1) {
      const nextIndex = currentTaskIndex + 1;
      setCurrentTaskIndex(nextIndex);
      Alert.alert(
        'Task Completed!',
        `Auto-navigating to Destination #${nextIndex + 1}: ${tasks[nextIndex].address}`
      );
    } else {
      Alert.alert('Route Complete 🎉', 'Great job! All assigned locations for today have been completed.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map Header Overlay */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleGroup}>
          <Navigation size={22} color="#3B82F6" />
          <Text style={styles.headerTitle}>Live Shift Dispatch</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn}>
          <RefreshCw size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        {Platform.OS !== 'web' ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: activeTask?.latitude || 37.7749,
              longitude: activeTask?.longitude || -122.4194,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
          >
            {/* Live Employee GPS Marker */}
            {currentLocation && (
              <Marker
                coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
                title="Your Location"
                pinColor="#3B82F6"
              />
            )}

            {/* Task Destination Markers */}
            {tasks.map((task, idx) => (
              <Marker
                key={task.id}
                coordinate={{ latitude: task.latitude, longitude: task.longitude }}
                title={`Stop #${task.sequenceOrder}`}
                description={task.address}
                pinColor={task.isCompleted ? '#10B981' : idx === currentTaskIndex ? '#F59E0B' : '#64748B'}
              />
            ))}

            {/* Polyline Route Path */}
            <Polyline
              coordinates={tasks.map((t) => ({ latitude: t.latitude, longitude: t.longitude }))}
              strokeColor="#3B82F6"
              strokeWidth={4}
            />
          </MapView>
        ) : (
          <View style={styles.webMapFallback}>
            <MapPin size={48} color="#3B82F6" />
            <Text style={styles.webMapText}>Interactive Map Active</Text>
            <Text style={styles.webMapSub}>
              Target: {activeTask?.address || 'San Francisco Hub'}
            </Text>
          </View>
        )}
      </View>

      {/* Target Destination Card & Geofenced Check-In */}
      {activeTask && (
        <View style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <View style={styles.stopTag}>
              <Text style={styles.stopTagText}>Destination {currentTaskIndex + 1} of {tasks.length}</Text>
            </View>
            {activeTask.isCompleted && (
              <View style={styles.completedBadge}>
                <CheckCircle2 size={14} color="#10B981" />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>

          <Text style={styles.taskAddress}>{activeTask.address}</Text>

          <CheckInButton
            distanceMeters={distanceMeters}
            isWithinGeofence={isWithinGeofence}
            onCheckIn={handleCheckIn}
            isLoading={isCheckingIn}
          />
        </View>
      )}

      {/* Invoice Submission Modal */}
      {activeTask && (
        <InvoiceModal
          visible={isInvoiceModalVisible}
          taskId={activeTask.id}
          onClose={() => setIsInvoiceModalVisible(false)}
          onSuccess={handleInvoiceSuccess}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  refreshBtn: {
    padding: 6,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webMapFallback: {
    flex: 1,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webMapText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
  },
  webMapSub: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
  },
  bottomCard: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopTag: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stopTagText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '700',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  taskAddress: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 10,
  },
});
