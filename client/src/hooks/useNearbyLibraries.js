import { useEffect, useState } from 'react';

const STORAGE_KEY = 'labflow_location_pref';

export function useNearbyLibraries() {
  const [coords, setCoords] = useState(null);
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [permissionState, setPermissionState] = useState('idle'); // idle | asked | granted | denied

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.coords) {
        setCoords(saved.coords);
        setPermissionState('granted');
      } else if (saved?.pincode) {
        setPincode(saved.pincode);
      } else if (saved?.city) {
        setCity(saved.city);
      }
    } catch {
      // ignore malformed local storage
    }
  }, []);

  function persist(pref) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
    } catch {
      // ignore write failures (private browsing, quota)
    }
  }

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
        setPincode('');
        setCity('');
        setPermissionState('granted');
        persist({ coords: next });
      },
      () => setPermissionState('denied'),
      { timeout: 8000 }
    );
  }

  function useManualPincode(value) {
    setPincode(value);
    setCoords(null);
    setCity('');
    persist(value ? { pincode: value } : {});
  }

  function useCity(value) {
    setCity(value);
    setCoords(null);
    setPincode('');
    persist(value ? { city: value } : {});
  }

  function clear() {
    setCoords(null);
    setPincode('');
    setCity('');
    setPermissionState('idle');
    persist({});
  }

  const queryParams = coords
    ? { lat: coords.lat, lng: coords.lng, radiusKm: 30 }
    : pincode
    ? { pincode }
    : city
    ? { city }
    : undefined;

  return {
    coords,
    pincode,
    city,
    permissionState,
    requestLocation,
    useManualPincode,
    useCity,
    clear,
    queryParams,
  };
}
