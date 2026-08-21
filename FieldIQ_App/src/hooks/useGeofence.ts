import { useMemo } from 'react';
import { getDistance } from 'geolib';
import { LocationCoordinates, TaskLocation } from '../types';

export function useGeofence(currentLocation: LocationCoordinates | null, targetTask: TaskLocation | null, maxDistanceMeters: number = 200) {
  const { distanceMeters, isWithinGeofence } = useMemo(() => {
    if (!currentLocation || !targetTask) {
      return { distanceMeters: Infinity, isWithinGeofence: false };
    }

    const distance = getDistance(
      { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
      { latitude: targetTask.latitude, longitude: targetTask.longitude }
    );

    return {
      distanceMeters: distance,
      isWithinGeofence: distance <= maxDistanceMeters,
    };
  }, [currentLocation, targetTask, maxDistanceMeters]);

  return { distanceMeters, isWithinGeofence };
}
