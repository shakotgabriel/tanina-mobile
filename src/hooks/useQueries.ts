import { useQuery } from '@tanstack/react-query';

import { api } from '@/src/lib/api/services';

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
