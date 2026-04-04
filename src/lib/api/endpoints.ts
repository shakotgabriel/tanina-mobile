const API_V1 = '/api/v1';

export const ENDPOINTS = {
  auth: {
    register: `${API_V1}/auth/register`,
    login: `${API_V1}/auth/login`,
    refresh: `${API_V1}/auth/refresh`,
    logout: `${API_V1}/auth/logout`,
    forgotPassword: `${API_V1}/auth/forgot-password`,
    resetPassword: `${API_V1}/auth/reset-password`,
    changePassword: `${API_V1}/auth/change-password`,
    verifyEmail: `${API_V1}/auth/verify-email`,
    resendOtp: `${API_V1}/auth/resend-otp`,
    assignRole: `${API_V1}/auth/assign-role`,
    validateToken: `${API_V1}/auth/validate-token`,
    health: `${API_V1}/auth/health`,
    // Compatibility endpoint kept while the backend me-profile route is finalized.
    me: `${API_V1}/auth/me`,
  },
  users: {
    create: `${API_V1}/users`,
    byId: (userId: string) => `${API_V1}/users/${userId}`,
    transactionHistory: (userId: string) => `${API_V1}/users/${userId}/transactions/history`,
    byEmail: (email: string) => `${API_V1}/users/email/${encodeURIComponent(email)}`,
    submitKyc: (userId: string) => `${API_V1}/users/${userId}/kyc`,
    verifyKyc: (userId: string) => `${API_V1}/users/${userId}/kyc/verify`,
    getKyc: (userId: string) => `${API_V1}/users/${userId}/kyc`,
    getKycStatus: (userId: string) => `${API_V1}/users/${userId}/kyc/status`,
    health: `${API_V1}/users/health`,
  },
  wallets: {
    me: `${API_V1}/wallets/me`,
    createMe: `${API_V1}/wallets/me`,
    pockets: `${API_V1}/wallets/me/pockets`,
    pocketByCurrency: (currency: string) => `${API_V1}/wallets/me/pockets/${currency}`,
    holds: `${API_V1}/wallets/me/holds`,
  },
  agent: {
    float: `${API_V1}/agent/float`,
    cashIn: `${API_V1}/agent/cash-in`,
  },
  internal: {
    creditMobileMoneyDeposit: `${API_V1}/internal/mobile-money/deposits/credit`,
    p2pTransfer: `${API_V1}/internal/p2p-transfer`,
    fxSwap: `${API_V1}/internal/fx-swap`,
    placeHold: `${API_V1}/internal/holds`,
    captureHold: (holdId: string) => `${API_V1}/internal/holds/${holdId}/capture`,
    releaseHold: (holdId: string) => `${API_V1}/internal/holds/${holdId}/release`,
  },
  p2p: {
    transfer: `${API_V1}/p2p/transfer`,
    byId: (id: string) => `${API_V1}/p2p/transfers/${id}`,
    list: `${API_V1}/p2p/transfers`,
  },
  fx: {
    rates: `${API_V1}/fx/rates`,
    ratePair: (from: string, to: string) => `${API_V1}/fx/rates/${from}/${to}`,
    quote: `${API_V1}/fx/quote`,
    swaps: `${API_V1}/fx/swaps`,
    swapById: (id: string) => `${API_V1}/fx/swaps/${id}`,
  },
  mobileMoneyDeposits: {
    initiate: `${API_V1}/mobile-money/deposits/initiate`,
    callback: (provider: string) => `${API_V1}/mobile-money/deposits/callback/${provider}`,
    byId: (id: string) => `${API_V1}/mobile-money/deposits/${id}`,
    byUserId: (userId: string) => `${API_V1}/mobile-money/deposits/user/${userId}`,
  },
  bills: {
    pay: `${API_V1}/bills/pay`,
    callback: `${API_V1}/bills/callback`,
    byId: (id: string) => `${API_V1}/bills/${id}`,
    byUserId: (userId: string) => `${API_V1}/bills/user/${userId}`,
  },
  cashout: {
    initiate: `${API_V1}/cashout/initiate`,
    confirm: (id: string) => `${API_V1}/cashout/${id}/confirm`,
    cancel: (id: string) => `${API_V1}/cashout/${id}/cancel`,
    byId: (id: string) => `${API_V1}/cashout/${id}`,
    byUserId: (userId: string) => `${API_V1}/cashout/user/${userId}`,
    byAgentUserId: (agentUserId: string) => `${API_V1}/cashout/agent/${agentUserId}`,
  },
  merchant: {
    createIntent: `${API_V1}/merchant/intents`,
    authorizeIntent: (id: string) => `${API_V1}/merchant/intents/${id}/authorize`,
    captureIntent: (id: string) => `${API_V1}/merchant/intents/${id}/capture`,
    cancelIntent: (id: string) => `${API_V1}/merchant/intents/${id}/cancel`,
    intentById: (id: string) => `${API_V1}/merchant/intents/${id}`,
  },
  // Temporary backward compatibility for currently shipped screens/hooks.
  legacy: {
    updateProfile: '/user/profile',
    lookupUserByEmail: '/user/lookup',
  },
} as const;
