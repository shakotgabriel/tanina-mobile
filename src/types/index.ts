// ─── Primitives ────────────────────────────────────────────────────────────────
export type UUID = string;
export type ISODateTime = string;
export type ISODate = string;

// ─── API Envelope ──────────────────────────────────────────────────────────────
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  timestamp: ISODateTime;
};

// ─── Auth ──────────────────────────────────────────────────────────────────────
export type AuthRole =
  | "CUSTOMER"
  | "MERCHANT"
  | "AGENT"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "COMPLIANCE_OFFICER"
  | "SUPPORT_AGENT";

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  userId: string;
  email: string;
  role: AuthRole;
  permissions: string[];
};

export type AuthMeResponse = {
  userId: UUID;
  email: string;
  role?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
  role?: string;
  accountType?: string;
};

export type VerifyEmailRequest = {
  email: string;
  otp: string;
};

export type ResendOtpRequest = {
  email: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

// ─── User ─────────────────────────────────────────────────────────────────────
export type AccountType = "BASIC" | "PREMIUM" | "MERCHANT" | "AGENT";
export type KycStatus = "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "REJECTED";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
export type BusinessType =
  | "SOLE_PROPRIETORSHIP"
  | "PARTNERSHIP"
  | "LIMITED_COMPANY"
  | "NON_PROFIT";

export type UserDTO = {
  userId?: UUID;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: ISODate;
  nationalId?: string;
  address?: string;
  accountType?: AccountType;
  kycStatus?: KycStatus;
  kycSubmittedAt?: ISODateTime;
  kycVerifiedAt?: ISODateTime;
  kycVerifiedBy?: string;
  transactionLimit?: string;
  lastLoginAt?: ISODateTime;
  businessName?: string;
  businessRegistrationNumber?: string;
  businessType?: BusinessType;
  merchantCode?: string;
  status?: UserStatus;
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
};

// ─── KYC ──────────────────────────────────────────────────────────────────────
export type DocumentType =
  | "NATIONAL_ID"
  | "PASSPORT"
  | "DRIVER_LICENSE"
  | "BUSINESS_REGISTRATION";

export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type KycDocumentDTO = {
  id: number;
  userId: UUID;
  documentType: DocumentType;
  documentNumber: string;
  documentUrl: string;
  status: DocumentStatus;
  submittedAt: ISODateTime;
  verifiedAt?: ISODateTime;
  verifiedBy?: string;
  rejectionReason?: string;
};

export type KycSubmitRequest = {
  documentType: DocumentType;
  documentNumber: string;
  documentUrl: string;
};

// ─── Wallet ───────────────────────────────────────────────────────────────────
export type WalletStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";
export type HoldStatus = "PLACED" | "CAPTURED" | "RELEASED" | "EXPIRED";
export type HoldReasonType =
  | "MERCHANT_INTENT"
  | "BILLPAY_INTENT"
  | "CASHOUT_REQUEST"
  | "FX_CONVERSION";

export type WalletPocketDTO = {
  id: UUID;
  walletId: UUID;
  currency: string;
  ledgerBalanceMinor: number;
  availableBalanceMinor: number;
  isPrimary: boolean;
  fallbackOrder: number;
  createdAt: ISODateTime;
};

export type WalletDTO = {
  id: UUID;
  userId: UUID;
  status: WalletStatus;
  pockets: WalletPocketDTO[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type HoldDTO = {
  id: UUID;
  walletPocketId: UUID;
  amountMinor: number;
  currency: string;
  status: HoldStatus;
  reasonType: HoldReasonType;
  referenceId?: UUID;
  fxSnapshotId?: UUID;
  expiresAt?: ISODateTime;
  capturedAt?: ISODateTime;
  releasedAt?: ISODateTime;
  createdAt: ISODateTime;
};

// ─── Transfers ────────────────────────────────────────────────────────────────
export type TransferStatus = "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";

export type P2PTransfer = {
  id: UUID;
  fromUserId: UUID;
  toUserId: UUID;
  amountMinor: number;
  currency: string;
  fromCurrency?: string;
  fxSnapshotId?: UUID;
  journalId?: UUID;
  status: TransferStatus;
  note?: string;
  createdAt: ISODateTime;
  completedAt?: ISODateTime;
};

export type P2PTransferRequest = {
  toUserId: UUID;
  amountMinor: number;
  currency: string;
  note?: string;
};

export type PaginatedResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
};

// ─── FX ───────────────────────────────────────────────────────────────────────
export type FxRate = {
  id: UUID;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  spreadPct: string;
  buyRate: string;
  sellRate: string;
  provider: string;
  validAt: ISODateTime;
  expiresAt: ISODateTime;
  createdAt: ISODateTime;
};

export type FxSwapQuoteRequest = {
  fromCurrency: string;
  toCurrency: string;
  fromAmountMinor: number;
};

export type FxSwapQuoteResponse = {
  swapRequestId: UUID;
  fxSnapshotId: UUID;
  fromCurrency: string;
  toCurrency: string;
  fromAmountMinor: number;
  toAmountMinor: number;
  rate: string;
  quoteExpiresAt: ISODateTime;
};

export type FxSwapExecuteRequest = {
  swapRequestId: UUID;
  fxSnapshotId: UUID;
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export type MobileMoneyDepositRequest = {
  amountMinor: number;
  currency: string;
  phoneNumber: string;
  provider: string;
  userId?: UUID;
};

export type MobileMoneyDepositStatus = "PENDING" | "SUBMITTED" | "SUCCESS" | "FAILED";

export type MobileMoneyDepositDTO = {
  depositId: UUID;
  userId: UUID;
  provider: string;
  providerRef?: string;
  providerTxnId?: string;
  amountMinor: number;
  currency: string;
  status: MobileMoneyDepositStatus;
  failureReason?: string;
  callbackReceivedAt?: ISODateTime;
  creditedAt?: ISODateTime;
  createdAt: ISODateTime;
  // Legacy aliases retained for compatibility with older UI code.
  id?: UUID;
  externalReference?: string;
  updatedAt?: ISODateTime;
};

export type BillPayRequest = {
  utilityProvider?: string;
  meterNumber?: string;
  accountNumber?: string;
  amountMinor: number;
  currency: string;
  userId?: UUID;
  // Backend/legacy aliases retained for compatibility.
  billerCode?: string;
  customerRef?: string;
  provider?: string;
  billType?: string;
};

export type BillPaymentStatus = "PENDING" | "SUBMITTED" | "SUCCESS" | "FAILED" | "EXPIRED";

export type BillPaymentDTO = {
  id: UUID;
  userId: UUID;
  billerCode: string;
  customerRef: string;
  amountMinor: number;
  currency: string;
  holdId?: UUID;
  providerRef?: string;
  status: BillPaymentStatus;
  callbackReceivedAt?: ISODateTime;
  expiresAt: ISODateTime;
  createdAt: ISODateTime;
  // Legacy aliases retained for compatibility with older UI code.
  accountNumber?: string;
  provider?: string;
};

export type AgentDepositRequest = {
  agentId: UUID;
  amountMinor: number;
  currency: string;
  note?: string;
};

export type CashoutInitiateRequest = {
  amountMinor: number;
  currency: string;
  userId?: UUID;
  agentId?: UUID;
  agentUserId?: UUID;
};

export type CashoutStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";

export type CashoutDTO = {
  id: UUID;
  userId: UUID;
  agentUserId: UUID;
  amountMinor: number;
  currency: string;
  holdId?: UUID;
  otpHash?: string;
  otpAttempts?: number;
  status: CashoutStatus;
  expiresAt: ISODateTime;
  createdAt: ISODateTime;
  // Legacy aliases retained for compatibility with older UI code.
  agentId?: UUID;
  confirmationCode?: string;
};

export type CashoutConfirmRequest = {
  otp: string;
  confirmationCode?: string;
};

// Withdrawal naming aliases kept for product language consistency on the frontend.
export type WithdrawalInitiateRequest = CashoutInitiateRequest;
export type WithdrawalDTO = CashoutDTO;
export type WithdrawalConfirmRequest = CashoutConfirmRequest;

export type MerchantIntentRequest = {
  merchantId?: UUID;
  amountMinor: number;
  currency: string;
  description?: string;
  payerUserId?: UUID;
  merchantUserId?: UUID;
  reference?: string;
};

export type MerchantIntentStatus = "PENDING" | "AUTHORIZED" | "CAPTURED" | "CANCELLED" | "EXPIRED";
export type MerchantCaptureRole = "MERCHANT" | "GATEWAY" | "AUTO";

export type MerchantIntentDTO = {
  id: UUID;
  payerUserId: UUID;
  merchantUserId: UUID;
  amountMinor: number;
  currency: string;
  payerCurrency: string;
  fxSnapshotId?: UUID;
  holdId?: UUID;
  status: MerchantIntentStatus;
  captureRole: MerchantCaptureRole;
  expiresAt: ISODateTime;
  createdAt: ISODateTime;
  // Legacy aliases retained for compatibility with older UI code.
  merchantId?: UUID;
  customerId?: UUID;
  description?: string;
};

export type MerchantAuthorizeRequest = {
  customerId: UUID;
};

export type MerchantCaptureRequest = {
  amountMinor?: number;
};

export type UnifiedTransactionDTO = {
  id: UUID;
  type: string;
  direction?: 'CREDIT' | 'DEBIT';
  status: string;
  amountMinor: number;
  currency: string;
  counterpartyUserId?: UUID | null;
  counterpartyDisplayName?: string | null;
  description?: string | null;
  occurredAt?: ISODateTime | null;
  source?: string;
};