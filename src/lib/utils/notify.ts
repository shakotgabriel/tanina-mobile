import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info';

type NotifyOptions = {
  type?: ToastType;
  text1?: string;
  text2?: string;
  visibilityTime?: number;
  autoHide?: boolean;
  topOffset?: number;
};

const DEFAULT_VISIBILITY: Record<ToastType, number> = {
  success: 2200,
  info: 2600,
  error: 3400,
};

const VALIDATION_TEXT1 = new Set([
  'Enter a valid amount',
  'Invalid amount',
  'Enter a phone number',
  'Select a provider',
  'Select a mobile money provider',
  'Enter agent user ID',
  'Cashout agent ID is required',
  'Withdrawal agent ID is required',
  'Deposit agent code is required',
  'Withdrawal agent code is required',
  'Select country first',
  'Enter a valid OTP',
  'Enter meter/account number',
  'Enter merchant user ID',
  'Missing details',
  'Invalid email',
  'Weak password',
  'Invalid phone number',
  'Missing fields',
  'Password mismatch',
  'Password too short',
  'Choose different currencies',
  'Request a quote first',
  'Invalid code',
]);

function withPeriod(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/[.!?]$/.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}.`;
}

function normalize(options: NotifyOptions): NotifyOptions {
  const type = options.type ?? 'info';
  let text1 = options.text1?.trim();
  let text2 = options.text2?.trim();

  if (type === 'success' && text1?.endsWith('!')) {
    text1 = text1.replace(/!+$/, '');
  }

  if (type === 'error' && text1 && VALIDATION_TEXT1.has(text1)) {
    text1 = 'Check your input';
    text2 = text2 ?? withPeriod(options.text1 ?? 'Please review the form and try again');
  }

  if (type === 'error' && text1 === 'Failed') {
    text1 = 'Request failed';
  }

  if (type === 'error' && text1 && /failed$/i.test(text1) && !text2) {
    text2 = 'Please try again.';
  }

  if (type === 'error' && text1 === 'Update failed' && !text2) {
    text2 = 'Please try again.';
  }

  if (text2) {
    text2 = withPeriod(text2);
  }

  return {
    ...options,
    type,
    text1,
    text2,
    autoHide: options.autoHide ?? true,
    visibilityTime: options.visibilityTime ?? DEFAULT_VISIBILITY[type],
  };
}

export const notify = {
  success(text1: string, text2?: string, options?: Omit<NotifyOptions, 'type' | 'text1' | 'text2'>) {
    Toast.show(normalize({ type: 'success', text1, text2, ...options }));
  },

  error(text1: string, text2?: string, options?: Omit<NotifyOptions, 'type' | 'text1' | 'text2'>) {
    Toast.show(normalize({ type: 'error', text1, text2, ...options }));
  },

  info(text1: string, text2?: string, options?: Omit<NotifyOptions, 'type' | 'text1' | 'text2'>) {
    Toast.show(normalize({ type: 'info', text1, text2, ...options }));
  },

  validation(text: string, options?: Omit<NotifyOptions, 'type' | 'text1' | 'text2'>) {
    Toast.show(normalize({ type: 'error', text1: text, ...options }));
  },

  show(options: NotifyOptions) {
    Toast.show(normalize(options));
  },
};
