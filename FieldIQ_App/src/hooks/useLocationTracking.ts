import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { LocationCoordinates } from '../types';
import { socketService } from '../services/socket';

export function useLocationTracking(employeeId?: string) {
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    async function setupLocationPermissions() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isSubscribed) setErrorMsg('Permission to access location was denied');
          return;
        }

        // Get initial location
        const initialLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const coords: LocationCoordinates = {
          latitude: initialLoc.coords.latitude,
          longitude: initialLoc.coords.longitude,
          speed: initialLoc.coords.speed || 0,
          accuracy: initialLoc.coords.accuracy || 0,
          timestamp: initialLoc.timestamp,
        };

        if (isSubscribed) setCurrentLocation(coords);

        // Start 10-second interval tracking broadcast
        intervalRef.current = setInterval(async () => {
          try {
            const freshLoc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });

            const freshCoords: LocationCoordinates = {
              latitude: freshLoc.coords.latitude,
              longitude: freshLoc.coords.longitude,
              speed: freshLoc.coords.speed || 0,
              accuracy: freshLoc.coords.accuracy || 0,
              timestamp: freshLoc.timestamp,
            };

            if (isSubscribed) {
              setCurrentLocation(freshCoords);
              if (employeeId) {
                socketService.emitLocationUpdate(employeeId, freshCoords);
              }
            }
          } catch (err) {
            console.warn('Error fetching interval location:', err);
          }
        }, 10000); // 10 seconds interval
      } catch (err: any) {
        if (isSubscribed) setErrorMsg(err.message || 'Failed to initialize location service');
      }
    }

    setupLocationPermissions();

    return () => {
      isSubscribed = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [employeeId]);

  return { currentLocation, errorMsg };
}
