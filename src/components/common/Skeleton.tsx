import { StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  height?: number;
  width?: ViewStyle['width'];
  style?: ViewStyle;
}

export default function Skeleton({ height = 16, width = '100%', style }: SkeletonProps) {
  return <View style={[styles.base, { height, width }, style]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
});
