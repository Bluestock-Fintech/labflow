import { useEffect, useState } from 'react';

const STORAGE_KEY = 'labflow_location_pref';

export function useNearbyLibraries() {
  const [coords, setCoords] = useState(null);
  const [pincode, setPincode] = useState('');
  const [permissionState, setPermissionState] = useState('idle'); // idle | asked | granted | denied

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.coords) {
        setCoords(saved.coords);
        setPermissionState('granted');
      } else if (saved?.pincode) {
        setPincode(saved.pincode);
      }
    } catch {
      // ignore malformed local storage
    }
  }, []);

  function requestLocation() {
    if (!navigator.geolocation) {
      setPermissionState('denied');
      return;
    }
    setPermissionState('asked');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(next);
        setPermissionState('granted');
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ coords: next }));
        } catch {
          // ignore write failures (private browsing, quota)
        }
      },
      () => setPermissionState('denied'),
      { timeout: 8000 }
    );
  }

  function useManualPincode(value) {
    setPincode(value);
    setCoords(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pincode: value }));
    } catch {
      // ignore
    }
  }

  const queryParams = coords
    ? { lat: coords.lat, lng: coords.lng, radiusKm: 30 }
    : pincode
    ? { pincode }
    : undefined;

  return { coords, pincode, permissionState, requestLocation, useManualPincode, queryParams };
}
