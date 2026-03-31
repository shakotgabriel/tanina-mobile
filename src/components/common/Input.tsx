import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
}

const Input = forwardRef<TextInput, InputProps>(({ label, ...props }, ref) => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput ref={ref} style={styles.input} placeholderTextColor="#94A3B8" {...props} />
    </View>
  );
});

Input.displayName = 'Input';

export default Input;

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
});
