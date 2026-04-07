import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const getInitialOnlineState = () => {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }

  return true;
};

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(getInitialOnlineState);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const updateOnlineStatus = () => {
        setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      };

      updateOnlineStatus();
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      setIsOnline(Boolean(connected) && state.isInternetReachable !== false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isOnline;
}
