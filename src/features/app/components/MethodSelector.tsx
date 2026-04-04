import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Method {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
}

interface MethodSelectorProps {
  methods: Method[];
  onSelect: (id: string) => void;
}

export default function MethodSelector({ methods, onSelect }: MethodSelectorProps) {
  return (
    <View style={styles.container}>
      {methods.map((method) => (
        <TouchableOpacity
          key={method.id}
          onPress={() => onSelect(method.id)}
          activeOpacity={0.75}
          style={styles.card}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={method.icon} size={22} color="#2F6B2F" />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{method.title}</Text>
            <Text style={styles.description}>{method.description}</Text>
          </View>
          <View style={styles.chevronWrap}>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      ))}
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
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0F7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 3 },
  description: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
