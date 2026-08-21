import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { MapPin, CheckCircle2, Lock } from 'lucide-react-native';

interface CheckInButtonProps {
  distanceMeters: number;
  isWithinGeofence: boolean;
  onCheckIn: () => void;
  isLoading?: boolean;
}

export const CheckInButton: React.FC<CheckInButtonProps> = ({
  distanceMeters,
  isWithinGeofence,
  onCheckIn,
  isLoading = false,
}) => {
  const formattedDistance =
    distanceMeters === Infinity
      ? 'Calculating location...'
      : distanceMeters >= 1000
      ? `${(distanceMeters / 1000).toFixed(1)} km away`
      : `${distanceMeters} meters away`;

  return (
    <View style={styles.container}>
      <View style={styles.distanceBadge}>
        <MapPin size={16} color={isWithinGeofence ? '#10B981' : '#F59E0B'} />
        <Text style={[styles.distanceText, { color: isWithinGeofence ? '#10B981' : '#F59E0B' }]}>
          {formattedDistance}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          isWithinGeofence ? styles.activeButton : styles.disabledButton,
        ]}
        disabled={!isWithinGeofence || isLoading}
        onPress={onCheckIn}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : isWithinGeofence ? (
          <>
            <CheckCircle2 size={22} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.buttonText}>Check In Now</Text>
          </>
        ) : (
          <>
            <Lock size={20} color="#94A3B8" style={styles.icon} />
            <Text style={styles.disabledText}>Approach Target (Within 200m)</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
    alignItems: 'center',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  activeButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    backgroundColor: '#334155',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  disabledText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
  },
});
