import { useMemo } from 'react';

type CounterpartyTx = {
  counterpartyUserId?: string | null;
  counterpartyDisplayName?: string | null;
  counterparty?: string | null;
  source?: string | null;
  description?: string | null;
};

type EnrichedTx<T> = T & {
  counterpartyLabel?: string;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuidLike = (value?: string | null): value is string => {
  if (!value) {
    return false;
  }
  return UUID_REGEX.test(value.trim());
};

const deriveCounterpartyLabel = (tx: CounterpartyTx): string | undefined => {
  const displayName = tx.counterpartyDisplayName?.trim();
  if (displayName) {
    return displayName;
  }

  const counterparty = tx.counterparty?.trim();
  if (counterparty && !isUuidLike(counterparty)) {
    return counterparty;
  }

  return undefined;
};

export function useEnrichedTransactions<T extends CounterpartyTx>(transactions: T[]): EnrichedTx<T>[] {
  return useMemo(
    () =>
      transactions.map((tx) => {
        return {
          ...tx,
          counterpartyLabel: deriveCounterpartyLabel(tx),
        };
      }),
    [transactions]
  );
}
