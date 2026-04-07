import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { subscribeToSyncQueue } from '@/src/lib/queue/syncQueue';

interface NetworkStatusBannerProps {
  isOnline: boolean;
}

export default function NetworkStatusBanner({ isOnline }: NetworkStatusBannerProps) {
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    return subscribeToSyncQueue((state) => {
      setQueuedCount(state.queuedCount);
      setIsSyncing(state.isSyncing);
    });
  }, []);

  if (isOnline && queuedCount === 0 && !isSyncing) {
    return null;
  }

  const isOffline = !isOnline;
  const message = isOffline
    ? queuedCount > 0
      ? `You are offline. ${queuedCount} payment action${queuedCount === 1 ? '' : 's'} queued.`
      : 'You are offline. New payment actions will queue automatically.'
    : isSyncing
      ? 'Back online. Syncing queued payment actions...'
      : queuedCount > 0
        ? `${queuedCount} payment action${queuedCount === 1 ? '' : 's'} still queued. Retrying shortly.`
        : null;

  if (!message) {
    return null;
  }

  return (
    <View style={[styles.banner, isOffline ? styles.offline : styles.online]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  offline: {
    backgroundColor: '#7F1D1D',
  },
  online: {
    backgroundColor: '#166534',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
