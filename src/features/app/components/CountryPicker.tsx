import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

export const SUPPORTED_COUNTRIES: Country[] = [
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', currency: 'UGX' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', currency: 'SSP' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', currency: 'RWF' },
];

export const MOBILE_MONEY_PROVIDERS: Record<string, { id: string; name: string }[]> = {
  UG: [
    { id: 'mtn_ug', name: 'MTN Mobile Money' },
    { id: 'airtel_ug', name: 'Airtel Money' },
  ],
  SS: [
    { id: 'mtn_ss', name: 'MTN Mobile Money' },
    { id: 'airtel_ss', name: 'Airtel Money' },
  ],
  KE: [
    { id: 'mpesa', name: 'M-Pesa' },
    { id: 'airtel_ke', name: 'Airtel Money' },
    { id: 'tkash', name: 'T-Kash' },
  ],
  RW: [
    { id: 'mtn_rw', name: 'MTN Mobile Money' },
    { id: 'airtel_rw', name: 'Airtel Money' },
  ],
};

interface CountryPickerProps {
  onSelect: (country: Country) => void;
  selected?: string;
}

export default function CountryPicker({ onSelect, selected }: CountryPickerProps) {
  return (
    <View style={styles.container}>
      {SUPPORTED_COUNTRIES.map((country) => {
        const isSelected = selected === country.code;
        return (
          <TouchableOpacity
            key={country.code}
            onPress={() => onSelect(country)}
            activeOpacity={0.75}
            style={[styles.card, isSelected && styles.cardSelected]}
          >
            <Text style={styles.flag}>{country.flag}</Text>
            <View style={styles.textWrap}>
              <Text style={styles.name}>{country.name}</Text>
              <Text style={styles.currency}>{country.currency}</Text>
            </View>
            {isSelected ? (
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={13} color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.chevronWrap}>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  cardSelected: {
    borderColor: '#2F6B2F',
    backgroundColor: '#F9FCF9',
  },
  flag: { fontSize: 30 },
  textWrap: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  currency: { fontSize: 13, color: '#6B7280' },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2F6B2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
