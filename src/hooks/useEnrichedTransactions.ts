import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';

import { api } from '@/src/lib/api/services';

type CounterpartyTx = {
  counterpartyUserId?: string | null;
};

type EnrichedTx<T> = T & {
  counterpartyLabel?: string;
};

export function useEnrichedTransactions<T extends CounterpartyTx>(transactions: T[]): EnrichedTx<T>[] {
  const uniqueCounterpartyIds = useMemo(
    () =>
      Array.from(
        new Set(
          transactions
            .map((tx) => tx.counterpartyUserId)
            .filter((value): value is string => !!value)
        )
      ),
    [transactions]
  );

  const counterpartyQueries = useQueries({
    queries: uniqueCounterpartyIds.map((userId) => ({
      queryKey: ['transaction-counterparty', userId],
      queryFn: () => api.getUserById(userId),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    })),
  });

  const counterpartyLabels = useMemo(() => {
    const labels = new Map<string, string>();

    counterpartyQueries.forEach((query, index) => {
      const userId = uniqueCounterpartyIds[index];
      const user = query.data;
      if (!userId || !user) {
        return;
      }

      const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      labels.set(userId, name || user.email || userId);
    });

    return labels;
  }, [counterpartyQueries, uniqueCounterpartyIds]);

  return useMemo(
    () =>
      transactions.map((tx) => ({
        ...tx,
        counterpartyLabel: tx.counterpartyUserId
          ? counterpartyLabels.get(tx.counterpartyUserId)
          : undefined,
      })),
    [transactions, counterpartyLabels]
  );
}
