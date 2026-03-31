import { StyleSheet, Text, View } from 'react-native';

interface BadgeProps {
  label: string;
  tone?: 'info' | 'success' | 'warning';
}

export default function Badge({ label, tone = 'info' }: BadgeProps) {
  return (
    <View style={[styles.badge, tone === 'success' ? styles.success : tone === 'warning' ? styles.warning : styles.info]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  info: {
    backgroundColor: '#E0F2FE',
  },
  success: {
    backgroundColor: '#DCFCE7',
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
});
