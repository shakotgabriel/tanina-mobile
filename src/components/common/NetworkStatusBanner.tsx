import { StyleSheet, Text, View } from 'react-native';

interface NetworkStatusBannerProps {
  isOnline: boolean;
}

export default function NetworkStatusBanner({ isOnline }: NetworkStatusBannerProps) {
  if (isOnline) {
    return null;
  }

  return (
    <View style={[styles.banner, styles.offline]}>
      <Text style={styles.text}>You are offline.</Text>
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
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
