import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ChangePasswordPayload, UpdateProfilePayload } from '@/src/lib/api/services';

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
