import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ChangePasswordPayload, UpdateProfilePayload } from '@/src/lib/api/services';
import { P2PTransferRequest } from '@/src/types';

export const useProfileQuery = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: api.getMe,
  });
};

export const useBalancesQuery = () => {
  return useQuery({
    queryKey: ['balances'],
    queryFn: api.getBalances,
  });
};

export const useTransactionsQuery = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: api.getTransactions,
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
