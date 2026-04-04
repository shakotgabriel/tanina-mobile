import { apiClient } from '@/src/lib/api/client';
import { ENDPOINTS } from '@/src/lib/api/endpoints';
import {
  ApiResponse,
  AuthResponse,
  CashoutConfirmRequest,
  CashoutDTO,
  CashoutInitiateRequest,
  ForgotPasswordRequest,
  FxRate,
  FxSwapExecuteRequest,
  FxSwapQuoteRequest,
  FxSwapQuoteResponse,
  KycDocumentDTO,
  KycSubmitRequest,
  LoginRequest,
  MerchantAuthorizeRequest,
  MerchantCaptureRequest,
  MerchantIntentDTO,
  MerchantIntentRequest,
  MobileMoneyDepositDTO,
  MobileMoneyDepositRequest,
  P2PTransfer,
  P2PTransferRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResendOtpRequest,
  ResetPasswordRequest,
  UserDTO,
  UnifiedTransactionDTO,
  UUID,
  VerifyEmailRequest,
  WalletDTO,
  WalletPocketDTO,
} from '@/src/types';
import { useAuthStore } from '@/src/lib/store/authStore';
import { Buffer } from 'buffer';

export type LoginPayload = LoginRequest;

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface AssignRolePayload {
  userId: string;
  role: string;
}

export interface CashInPayload {
  amountMinor: number;
  currency: string;
  reference?: string;
}

type AnyObject = Record<string, unknown>;

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ApiResponse<T>>;
  return (
    typeof candidate.success === 'boolean' &&
    typeof candidate.message === 'string' &&
    'data' in candidate &&
    typeof candidate.timestamp === 'string'
  );
};

const unwrapApiData = <T>(value: T | ApiResponse<T>): T => {
  return isApiResponse<T>(value) ? value.data : value;
};

const ensureArray = <T>(value: unknown): T[] => {
  return Array.isArray(value) ? value : [];
};

const canonicalTransactionStatus = (status?: string | null): string => {
  const normalized = (status ?? '').toUpperCase();

  if (normalized === 'SUCCESS' || normalized === 'CAPTURED' || normalized === 'CONFIRMED') {
    return 'COMPLETED';
  }

  return normalized || 'PENDING';
};

const canonicalTransactionType = (tx: UnifiedTransactionDTO): string => {
  const type = (tx.type ?? '').toUpperCase();
  const source = (tx.source ?? '').toUpperCase();
  const description = (tx.description ?? '').toUpperCase();
  const direction = (tx.direction ?? '').toUpperCase();

  const classify = (value: string): string | null => {
    if (!value) return null;

    if (value.includes('CASHOUT') || value.includes('WITHDRAW')) {
      return 'CASHOUT';
    }
    if (value.includes('MERCHANT')) {
      return 'MERCHANT_PAYMENT';
    }
    if (value.includes('BILL')) {
      return 'BILL_PAYMENT';
    }
    if (value.includes('P2P') || value.includes('TRANSFER') || value.includes('SEND')) {
      return 'P2P_TRANSFER';
    }
    if (value.includes('MOBILE') || value.includes('MOMO') || value.includes('DEPOSIT') || value === 'TOPUP') {
      return 'MOBILE_MONEY_DEPOSIT';
    }

    return null;
  };

  const byType = classify(type);
  const bySource = classify(source);
  const byDescription = classify(description);

  const resolved = byType ?? bySource ?? byDescription ?? (type || 'P2P_TRANSFER');

  // A debit should never appear as a "deposit" in the UI.
  if (resolved === 'MOBILE_MONEY_DEPOSIT' && direction === 'DEBIT') {
    return 'CASHOUT';
  }

  return resolved;
};

const normalizeTransaction = (tx: UnifiedTransactionDTO) => {
  const occurredAt = tx.occurredAt ?? undefined;
  return {
    ...tx,
    type: canonicalTransactionType(tx),
    status: canonicalTransactionStatus(tx.status),
    createdAt: occurredAt,
    counterparty: tx.counterpartyUserId ?? undefined,
  };
};

const decodeUserIdFromAccessToken = (): string | null => {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    const claims = JSON.parse(decoded) as { userId?: string; sub?: string };
    return claims.userId ?? claims.sub ?? null;
  } catch {
    return null;
  }
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MERCHANT_CODE_REGEX = /^\d{6}$/;

const resolveMerchantUserId = async (merchantIdentifier: string): Promise<string> => {
  const normalized = merchantIdentifier.trim();
  if (!normalized) {
    throw new Error('Merchant code or ID is required');
  }

  if (UUID_REGEX.test(normalized)) {
    return normalized;
  }

  if (MERCHANT_CODE_REGEX.test(normalized)) {
    const response = await apiClient.get<UserDTO | ApiResponse<UserDTO>>(ENDPOINTS.users.byMerchantCode(normalized));
    const merchantUser = unwrapApiData(response.data);
    if (!merchantUser?.userId) {
      throw new Error('Merchant not found for provided code');
    }
    return merchantUser.userId;
  }

  throw new Error('Merchant ID must be a UUID or 6-digit merchant code');
};

const getCurrentUserId = async (): Promise<string> => {
  const tokenUserId = decodeUserIdFromAccessToken();
  if (tokenUserId) {
    return tokenUserId;
  }

  const meResponse = await apiClient.get<UserDTO | ApiResponse<UserDTO>>(ENDPOINTS.auth.me);
  const me = unwrapApiData(meResponse.data);
  if (!me?.userId) {
    throw new Error('Unable to resolve current user ID');
  }
  return me.userId;
};

export const api = {
  login: async (payload: LoginPayload) => {
    const response = await apiClient.post<AuthResponse | ApiResponse<AuthResponse>>(ENDPOINTS.auth.login, payload);
    return unwrapApiData(response.data);
  },
  register: async (payload: RegisterRequest) => {
    const response = await apiClient.post<UserDTO | ApiResponse<UserDTO>>(ENDPOINTS.auth.register, payload);
    return unwrapApiData(response.data);
  },
  refresh: async (payload: RefreshTokenRequest) => {
    const response = await apiClient.post<AuthResponse | ApiResponse<AuthResponse>>(ENDPOINTS.auth.refresh, payload);
    return unwrapApiData(response.data);
  },
  logout: async () => {
    const response = await apiClient.post(ENDPOINTS.auth.logout);
    return response.data;
  },
  resetPassword: async (payload: ResetPasswordRequest) => {
    const response = await apiClient.post(ENDPOINTS.auth.resetPassword, payload);
    return response.data;
  },
  verifyEmail: async (payload: VerifyEmailRequest) => {
    const response = await apiClient.post(ENDPOINTS.auth.verifyEmail, payload);
    return response.data;
  },
  resendOtp: async (payload: ResendOtpRequest) => {
    const response = await apiClient.post(ENDPOINTS.auth.resendOtp, payload);
    return response.data;
  },
  forgotPassword: async (payload: ForgotPasswordRequest) => {
    const response = await apiClient.post(ENDPOINTS.auth.forgotPassword, payload);
    return response.data;
  },
  assignRole: async (payload: AssignRolePayload) => {
    const response = await apiClient.post(ENDPOINTS.auth.assignRole, payload);
    return response.data;
  },
  validateToken: async () => {
    const response = await apiClient.get(ENDPOINTS.auth.validateToken);
    return response.data;
  },
  authHealth: async () => {
    const response = await apiClient.get(ENDPOINTS.auth.health);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get<UserDTO | ApiResponse<UserDTO>>(ENDPOINTS.auth.me);
    const authMe = unwrapApiData(response.data);

    if (!authMe?.userId) {
      return authMe;
    }

    try {
      const profileResponse = await apiClient.get<UserDTO | ApiResponse<UserDTO>>(ENDPOINTS.users.byId(authMe.userId));
      const profile = unwrapApiData(profileResponse.data);
      return {
        ...authMe,
        ...profile,
      };
    } catch {
      return authMe;
    }
  },

  getUserById: async (userId: UUID) => {
    const response = await apiClient.get<UserDTO | ApiResponse<UserDTO>>(ENDPOINTS.users.byId(userId));
    return unwrapApiData(response.data);
  },
  getUserByEmail: async (email: string) => {
    const response = await apiClient.get<UserDTO | ApiResponse<UserDTO>>(ENDPOINTS.users.byEmail(email));
    return unwrapApiData(response.data);
  },
  createUser: async (payload: RegisterRequest) => {
    const response = await apiClient.post<UserDTO | ApiResponse<UserDTO>>(ENDPOINTS.users.create, payload);
    return unwrapApiData(response.data);
  },
  updateUser: async (userId: string, payload: Partial<UserDTO>) => {
    const response = await apiClient.put<UserDTO | ApiResponse<UserDTO>>(ENDPOINTS.users.byId(userId), payload);
    return unwrapApiData(response.data);
  },
  deleteUser: async (userId: string) => {
    const response = await apiClient.delete(ENDPOINTS.users.byId(userId));
    return response.data;
  },
  submitKyc: async (userId: string, payload: KycSubmitRequest) => {
    const response = await apiClient.post<KycDocumentDTO>(ENDPOINTS.users.submitKyc(userId), payload);
    return response.data;
  },
  verifyKyc: async (userId: string, payload: AnyObject) => {
    const response = await apiClient.post(ENDPOINTS.users.verifyKyc(userId), payload);
    return response.data;
  },
  getKyc: async (userId: string) => {
    const response = await apiClient.get<KycDocumentDTO[]>(ENDPOINTS.users.getKyc(userId));
    return response.data;
  },
  getKycStatus: async (userId: string) => {
    const response = await apiClient.get(ENDPOINTS.users.getKycStatus(userId));
    return response.data;
  },
  usersHealth: async () => {
    const response = await apiClient.get(ENDPOINTS.users.health);
    return response.data;
  },

  getWalletMe: async () => {
    const response = await apiClient.get<WalletDTO | ApiResponse<WalletDTO>>(ENDPOINTS.wallets.me);
    return unwrapApiData(response.data);
  },
  createWalletMe: async () => {
    const response = await apiClient.post<WalletDTO>(ENDPOINTS.wallets.createMe);
    return response.data;
  },
  getWalletPockets: async () => {
    const response = await apiClient.get<WalletPocketDTO[] | ApiResponse<WalletPocketDTO[]>>(ENDPOINTS.wallets.pockets);
    return ensureArray<WalletPocketDTO>(unwrapApiData(response.data));
  },
  getWalletPocketByCurrency: async (currency: string) => {
    const response = await apiClient.get<WalletPocketDTO>(ENDPOINTS.wallets.pocketByCurrency(currency));
    return response.data;
  },
  getWalletHolds: async () => {
    const response = await apiClient.get(ENDPOINTS.wallets.holds);
    return response.data;
  },

  getAgentFloat: async () => {
    const response = await apiClient.get(ENDPOINTS.agent.float);
    return response.data;
  },
  agentCashIn: async (payload: CashInPayload) => {
    const response = await apiClient.post(ENDPOINTS.agent.cashIn, payload);
    return response.data;
  },

  internalCreditMobileMoneyDeposit: async (payload: AnyObject) => {
    const response = await apiClient.post(ENDPOINTS.internal.creditMobileMoneyDeposit, payload);
    return response.data;
  },
  internalP2PTransfer: async (payload: AnyObject) => {
    const response = await apiClient.post(ENDPOINTS.internal.p2pTransfer, payload);
    return response.data;
  },
  internalFxSwap: async (payload: AnyObject) => {
    const response = await apiClient.post(ENDPOINTS.internal.fxSwap, payload);
    return response.data;
  },
  internalPlaceHold: async (payload: AnyObject) => {
    const response = await apiClient.post(ENDPOINTS.internal.placeHold, payload);
    return response.data;
  },
  internalCaptureHold: async (holdId: UUID, payload?: AnyObject) => {
    const response = await apiClient.post(ENDPOINTS.internal.captureHold(holdId), payload);
    return response.data;
  },
  internalReleaseHold: async (holdId: UUID, payload?: AnyObject) => {
    const response = await apiClient.post(ENDPOINTS.internal.releaseHold(holdId), payload);
    return response.data;
  },

  p2pTransfer: async (payload: P2PTransferRequest) => {
    const response = await apiClient.post<P2PTransfer | ApiResponse<P2PTransfer>>(ENDPOINTS.p2p.transfer, payload);
    return unwrapApiData(response.data);
  },
  getP2PTransferById: async (id: UUID) => {
    const response = await apiClient.get<P2PTransfer>(ENDPOINTS.p2p.byId(id));
    return response.data;
  },
  listP2PTransfers: async (params?: AnyObject) => {
    const response = await apiClient.get<P2PTransfer[]>(ENDPOINTS.p2p.list, { params });
    return response.data;
  },

  getFxRates: async () => {
    const response = await apiClient.get<FxRate[] | ApiResponse<FxRate[]>>(ENDPOINTS.fx.rates);
    return ensureArray<FxRate>(unwrapApiData(response.data));
  },
  getFxRateByPair: async (from: string, to: string) => {
    const response = await apiClient.get<FxRate | ApiResponse<FxRate>>(ENDPOINTS.fx.ratePair(from, to));
    return unwrapApiData(response.data);
  },
  quoteFxSwap: async (payload: FxSwapQuoteRequest) => {
    const response = await apiClient.post<FxSwapQuoteResponse | ApiResponse<FxSwapQuoteResponse>>(ENDPOINTS.fx.quote, payload);
    return unwrapApiData(response.data);
  },
  executeFxSwap: async (_payload: FxSwapExecuteRequest, swapRequestId: UUID) => {
    const response = await apiClient.post<string | ApiResponse<string>>(ENDPOINTS.fx.swaps, null, { params: { swapRequestId } });
    return unwrapApiData(response.data);
  },
  getFxSwapById: async (id: UUID) => {
    const response = await apiClient.get(ENDPOINTS.fx.swapById(id));
    return response.data;
  },

  initiateMobileMoneyDeposit: async (payload: MobileMoneyDepositRequest) => {
    const userId = await getCurrentUserId();
    const response = await apiClient.post<MobileMoneyDepositDTO>(ENDPOINTS.mobileMoneyDeposits.initiate, {
      userId,
      phoneNumber: payload.phoneNumber,
      provider: payload.provider,
      amountMinor: payload.amountMinor,
      currency: payload.currency,
    });
    return response.data;
  },
  mobileMoneyDepositCallback: async (provider: string, payload: AnyObject) => {
    const response = await apiClient.post(ENDPOINTS.mobileMoneyDeposits.callback(provider), payload);
    return response.data;
  },
  getMobileMoneyDepositById: async (id: UUID) => {
    const response = await apiClient.get<MobileMoneyDepositDTO>(ENDPOINTS.mobileMoneyDeposits.byId(id));
    return response.data;
  },
  getMobileMoneyDepositsByUserId: async (userId: UUID) => {
    const response = await apiClient.get<MobileMoneyDepositDTO[]>(ENDPOINTS.mobileMoneyDeposits.byUserId(userId));
    return response.data;
  },

  payBill: async (payload: AnyObject) => {
    const userId = await getCurrentUserId();
    const request = payload as {
      billerCode?: string;
      provider?: string;
      customerRef?: string;
      accountNumber?: string;
      amountMinor: number;
      currency: string;
    };

    const response = await apiClient.post(ENDPOINTS.bills.pay, {
      userId,
      billerCode: request.billerCode ?? request.provider,
      customerRef: request.customerRef ?? request.accountNumber,
      amountMinor: request.amountMinor,
      currency: request.currency,
    });
    return response.data;
  },
  billCallback: async (payload: AnyObject) => {
    const response = await apiClient.post(ENDPOINTS.bills.callback, payload);
    return response.data;
  },
  getBillById: async (id: UUID) => {
    const response = await apiClient.get(ENDPOINTS.bills.byId(id));
    return response.data;
  },
  getBillsByUserId: async (userId: UUID) => {
    const response = await apiClient.get(ENDPOINTS.bills.byUserId(userId));
    return response.data;
  },

  initiateCashout: async (payload: CashoutInitiateRequest) => {
    const userId = await getCurrentUserId();
    const response = await apiClient.post<CashoutDTO>(ENDPOINTS.cashout.initiate, {
      userId,
      agentUserId: (payload as any).agentUserId ?? (payload as any).agentId,
      amountMinor: payload.amountMinor,
      currency: payload.currency,
    });
    return response.data;
  },
  confirmCashout: async (id: UUID, payload: CashoutConfirmRequest) => {
    const response = await apiClient.post<CashoutDTO>(ENDPOINTS.cashout.confirm(id), payload);
    return response.data;
  },
  cancelCashout: async (id: UUID) => {
    const response = await apiClient.post<CashoutDTO>(ENDPOINTS.cashout.cancel(id));
    return response.data;
  },
  getCashoutById: async (id: UUID) => {
    const response = await apiClient.get<CashoutDTO>(ENDPOINTS.cashout.byId(id));
    return response.data;
  },
  getCashoutsByUserId: async (userId: UUID) => {
    const response = await apiClient.get<CashoutDTO[]>(ENDPOINTS.cashout.byUserId(userId));
    return response.data;
  },
  getCashoutsByAgentUserId: async (agentUserId: UUID) => {
    const response = await apiClient.get<CashoutDTO[]>(ENDPOINTS.cashout.byAgentUserId(agentUserId));
    return response.data;
  },

  createMerchantIntent: async (payload: MerchantIntentRequest) => {
    const userId = await getCurrentUserId();
    const merchantIdentifier = String((payload as any).merchantUserId ?? (payload as any).merchantId ?? '').trim();
    const merchantUserId = await resolveMerchantUserId(merchantIdentifier);
    const response = await apiClient.post<MerchantIntentDTO | ApiResponse<MerchantIntentDTO>>(ENDPOINTS.merchant.createIntent, {
      payerUserId: (payload as any).payerUserId ?? userId,
      merchantUserId,
      amountMinor: payload.amountMinor,
      currency: payload.currency,
    });
    return unwrapApiData(response.data);
  },
  authorizeMerchantIntent: async (id: UUID, payload: MerchantAuthorizeRequest) => {
    const response = await apiClient.post<MerchantIntentDTO | ApiResponse<MerchantIntentDTO>>(
      ENDPOINTS.merchant.authorizeIntent(id),
      payload
    );
    return unwrapApiData(response.data);
  },
  captureMerchantIntent: async (id: UUID, payload: MerchantCaptureRequest) => {
    const response = await apiClient.post<MerchantIntentDTO | ApiResponse<MerchantIntentDTO>>(
      ENDPOINTS.merchant.captureIntent(id),
      payload
    );
    return unwrapApiData(response.data);
  },
  cancelMerchantIntent: async (id: UUID) => {
    const response = await apiClient.post<MerchantIntentDTO | ApiResponse<MerchantIntentDTO>>(ENDPOINTS.merchant.cancelIntent(id));
    return unwrapApiData(response.data);
  },
  getMerchantIntentById: async (id: UUID) => {
    const response = await apiClient.get<MerchantIntentDTO | ApiResponse<MerchantIntentDTO>>(ENDPOINTS.merchant.intentById(id));
    return unwrapApiData(response.data);
  },

  payMerchant: async (payload: MerchantIntentRequest) => {
    const created = await api.createMerchantIntent(payload);
    const intentId = (created as any)?.id;
    if (!intentId) {
      throw new Error('Failed to create merchant payment intent');
    }

    await api.authorizeMerchantIntent(intentId, {} as MerchantAuthorizeRequest);
    await api.captureMerchantIntent(intentId, {} as MerchantCaptureRequest);
    return api.getMerchantIntentById(intentId);
  },

  // Existing API consumed by current screens/hooks.
  getBalances: async () => {
    const response = await apiClient.get<WalletPocketDTO[] | ApiResponse<WalletPocketDTO[]>>(ENDPOINTS.wallets.pockets);
    return ensureArray<WalletPocketDTO>(unwrapApiData(response.data));
  },
  getTransactions: async () => {
    const user = await api.getMe();
    if (!user?.userId) {
      return [];
    }

    const response = await apiClient.get<UnifiedTransactionDTO[] | ApiResponse<UnifiedTransactionDTO[]>>(
      ENDPOINTS.users.transactionHistory(user.userId)
    );

    return ensureArray<UnifiedTransactionDTO>(unwrapApiData(response.data)).map(normalizeTransaction);
  },
  updateProfile: async (payload: UpdateProfilePayload) => {
    // First get the current user to obtain their userId
    const user = await api.getMe();
    const response = await apiClient.put<UserDTO>(ENDPOINTS.users.byId(user.userId!), payload);
    return response.data;
  },
  changePassword: async (payload: ChangePasswordPayload) => {
    const response = await apiClient.post(ENDPOINTS.auth.changePassword, payload);
    return response.data;
  },
  lookupUserByEmail: async (email: string) => {
    const response = await apiClient.get<UserDTO | ApiResponse<UserDTO>>(ENDPOINTS.users.byEmail(email));
    return unwrapApiData(response.data);
  },
  sendP2P: async (payload: P2PTransferRequest) => {
    const response = await apiClient.post<P2PTransfer | ApiResponse<P2PTransfer>>(ENDPOINTS.p2p.transfer, payload);
    return unwrapApiData(response.data);
  },
};
