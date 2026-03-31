import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface ButtonProps extends PropsWithChildren {
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
}

export default function Button({ children, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, variant === 'secondary' ? styles.secondaryButton : styles.primaryButton]}>
      <Text style={[styles.label, variant === 'secondary' ? styles.secondaryLabel : styles.primaryLabel]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#0EA5E9',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
  secondaryLabel: {
    color: '#0F172A',
  },
});
