export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    verifyEmail: '/auth/verify-email',
    forgotPassword: '/auth/forgot-password',
    me: '/auth/me',
  },
  wallet: {
    balances: '/wallet/balances',
    transactions: '/wallet/transactions',
    send: '/wallet/send',
    deposit: '/wallet/deposit',
    convert: '/wallet/convert',
  },
} as const;
