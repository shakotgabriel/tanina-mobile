import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ChangePasswordPayload, UpdateProfilePayload } from '@/src/lib/api/services';
import { FxSwapQuoteRequest, FxSwapExecuteRequest, MobileMoneyDepositRequest, P2PTransferRequest, BillPayRequest, CashoutInitiateRequest, CashoutConfirmRequest, MerchantIntentRequest, UUID } from '@/src/types';
import { useAuthStore } from '@/src/lib/store/authStore';

export const useProfileQuery = (enabled = true) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ['profile'],
    queryFn: api.getMe,
    enabled: enabled && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useBalancesQuery = (enabled = true) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ['balances'],
    queryFn: api.getBalances,
    enabled: enabled && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for financial data)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTransactionsQuery = (enabled = false) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ['transactions'],
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
  return useMutation({
    mutationFn: (payload: CashoutInitiateRequest) => api.initiateCashout(payload),
  });
};

export const useCashoutConfirmMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: UUID; payload: CashoutConfirmRequest }) =>
      api.confirmCashout(params.id, params.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
