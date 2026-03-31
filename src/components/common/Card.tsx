import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

type CardProps = PropsWithChildren<ViewProps>;

export default function Card({ children, style, ...props }: CardProps) {
  return (
    <View {...props} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
