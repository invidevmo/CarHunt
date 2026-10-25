import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../services/socket';
import { GpsFilter } from '../utils/gpsFilter';

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [rawPosition, setRawPosition] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('ACQUIRING');
  const [accuracy, setAccuracy] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [motionLabel, setMotionLabel] = useState('Szukanie pozycji...');
  const [error, setError] = useState(null);
  const [isMock, setIsMock] = useState(false);

  const watchIdRef = useRef(null);
  const filterRef = useRef(new GpsFilter());

  const reportPosition = useCallback((coords) => {
    setPosition(coords);
    setAccuracy(coords.accuracy || null);
    setSpeed(coords.speed || 0);
    setHeading(coords.heading || 0);
    setIsMoving(coords.isMoving || false);
    setMotionLabel(coords.statusLabel || (coords.speed > 0 ? `${coords.speed} km/h` : 'Stoi w ukryciu'));

    socket.emit('update_position', {
      lat: coords.lat,
      lng: coords.lng,
      speed: coords.speed || 0,
      heading: coords.heading || 0,
      accuracy: coords.accuracy || 10,
      isMoving: coords.isMoving || false,
    });
  }, []);

  const setMockPosition = useCallback((coords) => {
    if (!isMock) return;
    const stabilized = {
      lat: Number(coords.lat.toFixed(6)),
      lng: Number(coords.lng.toFixed(6)),
      speed: coords.speed || 30,
      heading: coords.heading || 0,
      accuracy: 5,
      isMoving: (coords.speed || 30) > 4,
      statusLabel: (coords.speed || 30) > 4 ? `Symulacja (${coords.speed || 30} km/h)` : 'Symulacja (Stoi)',
    };
    reportPosition(stabilized);
  }, [isMock, reportPosition]);

  const requestGps = useCallback(() => {
    setError(null);
    setGpsStatus('ACQUIRING');
    filterRef.current.reset();

    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const msg = 'Przeglądarka mobilna wymaga bezpiecznego połączenia HTTPS do obsługi GPS.';
      setError(msg);
      setGpsStatus('INSECURE');
      return;
    }

    if (!('geolocation' in navigator)) {
      setError('Twoja przeglądarka lub urządzenie nie obsługuje geolokalizacji GPS.');
      setGpsStatus('UNSUPPORTED');
      return;
    }

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const handleSuccess = (pos) => {
      setError(null);
      setGpsStatus('LOCKED');

      const raw = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
        accuracy: pos.coords.accuracy,
      };
      setRawPosition(raw);

      const filtered = filterRef.current.filter(raw);
      reportPosition(filtered);
    };

    const handleError = (err) => {
      console.warn('[GPS Error]', err.code, err.message);
      if (err.code === 1) {
        setError('Odmówiono dostępu do GPS! Zezwól na lokalizację w ustawieniach przeglądarki.');
        setGpsStatus('DENIED');
      } else if (err.code === 2) {
        setError('Sygnał GPS niedostępny.');
        setGpsStatus('ACQUIRING');
      } else if (err.code === 3) {
        setError('Oczekiwanie na sygnał GPS z satelitów...');
        setGpsStatus('ACQUIRING');
      }
    };

    const options = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 20000,
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
  }, [reportPosition]);

  useEffect(() => {
    let timer = null;
    if (!isMock) {
      timer = setTimeout(() => {
        requestGps();
      }, 0);
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isMock, requestGps]);

  return {
    position,
    rawPosition,
    accuracy,
    speed,
    heading,
    isMoving,
    motionLabel,
    gpsStatus,
    error,
    isMock,
    setIsMock,
    setMockPosition,
    retryGps: requestGps,
  };
}
