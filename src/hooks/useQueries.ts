import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ChangePasswordPayload, UpdateProfilePayload } from '@/src/lib/api/services';
import {
  AgentDepositRequest,
  FxSwapQuoteRequest,
  FxSwapExecuteRequest,
  MobileMoneyDepositRequest,
  P2PTransferRequest,
  BillPayRequest,
  CashoutInitiateRequest,
  CashoutConfirmRequest,
  MerchantIntentRequest,
  UUID,
  WithdrawalInitiateRequest,
  WithdrawalConfirmRequest,
} from '@/src/types';
import { useAuthStore } from '@/src/lib/store/authStore';

export const useProfileQuery = (enabled = true) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authCacheKey = useAuthStore((state) => state.userId ?? state.accessToken ?? 'anonymous');
  return useQuery({
    queryKey: ['profile', authCacheKey],
    queryFn: api.getMe,
    enabled: enabled && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSessionQuery = (enabled = true) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authCacheKey = useAuthStore((state) => state.userId ?? state.accessToken ?? 'anonymous');
  return useQuery({
    queryKey: ['session', authCacheKey],
    queryFn: api.getSessionUser,
    enabled: enabled && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useBalancesQuery = (enabled = true, activeScreen = false) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authCacheKey = useAuthStore((state) => state.userId ?? state.accessToken ?? 'anonymous');
  return useQuery({
    queryKey: ['balances', authCacheKey],
    queryFn: api.getBalances,
    enabled: enabled && isAuthenticated,
    staleTime: activeScreen ? 30 * 1000 : 2 * 60 * 1000,
    refetchInterval: activeScreen ? 30 * 1000 : false,
    refetchIntervalInBackground: false,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTransactionsQuery = (enabled = false) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authCacheKey = useAuthStore((state) => state.userId ?? state.accessToken ?? 'anonymous');
  return useQuery({
    queryKey: ['transactions', authCacheKey],
    queryFn: api.getTransactions,
    enabled: enabled && isAuthenticated, // Disabled by default, enable only when needed
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => api.updateProfile(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
};

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => api.changePassword(payload),
  });
};

export const useLookupUserMutation = () => {
  return useMutation({
    mutationFn: (email: string) => api.lookupUserByEmail(email),
  });
};

export const useLookupMerchantMutation = () => {
  return useMutation({
    mutationFn: (merchantIdentifier: string) => api.lookupMerchantByCodeOrId(merchantIdentifier),
  });
};

export const useSendP2PMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: P2PTransferRequest) => api.sendP2P(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useFxQuoteMutation = () => {
  return useMutation({
    mutationFn: (payload: FxSwapQuoteRequest) => api.quoteFxSwap(payload),
  });
};

export const useFxExecuteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { payload: FxSwapExecuteRequest; swapRequestId: string }) =>
      api.executeFxSwap(params.payload, params.swapRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useMobileMoneyDepositMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MobileMoneyDepositRequest) => api.initiateMobileMoneyDeposit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useAgentDepositMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AgentDepositRequest) => api.depositViaAgent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useBillPayMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BillPayRequest) => api.payBill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useMerchantPayMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MerchantIntentRequest) => api.payMerchant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useCashoutInitiateMutation = () => {
  return useWithdrawalInitiateMutation();
};

export const useCashoutConfirmMutation = () => {
  return useWithdrawalConfirmMutation();
};

export const useWithdrawalInitiateMutation = () => {
  return useMutation({
    mutationFn: (payload: WithdrawalInitiateRequest | CashoutInitiateRequest) => api.initiateWithdrawal(payload),
  });
};

export const useWithdrawalConfirmMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: UUID; payload: WithdrawalConfirmRequest | CashoutConfirmRequest }) =>
      api.confirmWithdrawal(params.id, params.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
