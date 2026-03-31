export const Theme = {
  colors: {
    background: '#F8FAFC',
    foreground: '#0F172A',
    primary: '#0EA5E9',
    card: '#FFFFFF',
    border: '#E2E8F0',
    muted: '#64748B',
    success: '#10B981',
    danger: '#EF4444',
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
};

export type AppTheme = typeof Theme;
