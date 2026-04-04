import { Ionicons } from '@expo/vector-icons';

export type TxLike = {
  type?: string;
  direction?: 'CREDIT' | 'DEBIT';
};

type TxDisplayLike = {
  counterpartyLabel?: string;
  counterparty?: string;
  counterpartyUserId?: string;
  description?: string;
  currency?: string;
};

export function txLabel(type?: string) {
  switch (type?.toUpperCase()) {
    case 'MOBILE_MONEY_DEPOSIT': return 'Mobile Money Deposit';
    case 'P2P_TRANSFER': return 'Send Money';
    case 'MERCHANT_PAYMENT': return 'Merchant Payment';
    case 'BILL_PAYMENT': return 'Utility Bill Payment';
    case 'CASHOUT': return 'Withdrawal';
    case 'TOPUP': return 'Wallet Top Up';
    case 'SEND': return 'Send Money';
    case 'PAYMENT': return 'Payment';
    case 'REFUND': return 'Refund';
    case 'WITHDRAWAL': return 'Withdrawal';
    default:
      break;
  }

  return (type ?? '')
    .toLowerCase()
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

export function statusLabel(status?: string) {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return 'Completed';
    case 'PENDING': return 'Pending';
    case 'FAILED': return 'Failed';
    case 'CANCELLED': return 'Cancelled';
    case 'EXPIRED': return 'Expired';
    default:
      return txLabel(status);
  }
}

export function directionLabel(direction?: 'CREDIT' | 'DEBIT') {
  if (direction === 'CREDIT') return 'Received';
  if (direction === 'DEBIT') return 'Sent';
  return 'Unknown';
}

export function txSubtitle(tx: TxDisplayLike) {
  return (
    tx.counterpartyLabel ??
    tx.counterparty ??
    (tx.counterpartyUserId ? 'Contact details are loading...' : undefined) ??
    tx.description ??
    (tx.currency ? `${tx.currency} transaction` : 'Transaction')
  );
}

export function txIcon(type?: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type?.toUpperCase()) {
    case 'MOBILE_MONEY_DEPOSIT': return 'arrow-down-circle';
    case 'P2P_TRANSFER': return 'paper-plane';
    case 'MERCHANT_PAYMENT': return 'card';
    case 'BILL_PAYMENT': return 'receipt';
    case 'CASHOUT': return 'arrow-up-circle';
    case 'TOPUP': return 'arrow-down-circle';
    case 'SEND': return 'paper-plane';
    case 'PAYMENT': return 'card';
    case 'REFUND': return 'refresh-circle';
    case 'WITHDRAWAL': return 'arrow-up-circle';
    default: return 'ellipse';
  }
}

export function txIconColor(type?: string, direction?: string) {
  if (direction === 'CREDIT') return '#16A34A';
  if (direction === 'DEBIT') return '#DC2626';
  switch (type?.toUpperCase()) {
    case 'TOPUP': return '#16A34A';
    case 'REFUND': return '#2563EB';
    case 'SEND':
    case 'WITHDRAWAL':
      return '#DC2626';
    default:
      return '#6B7280';
  }
}

export function statusBg(status?: string) {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return 'bg-green-100';
    case 'PENDING': return 'bg-amber-100';
    case 'FAILED': return 'bg-red-100';
    case 'CANCELLED': return 'bg-red-100';
    case 'EXPIRED': return 'bg-red-100';
    default: return 'bg-gray-100';
  }
}

export function statusText(status?: string) {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return 'text-green-700';
    case 'PENDING': return 'text-amber-700';
    case 'FAILED': return 'text-red-700';
    case 'CANCELLED': return 'text-red-700';
    case 'EXPIRED': return 'text-red-700';
    default: return 'text-gray-600';
  }
}

export function isCredit(tx: TxLike) {
  if (tx.direction) return tx.direction === 'CREDIT';
  const t = tx.type?.toUpperCase();
  return t === 'TOPUP' || t === 'REFUND' || t === 'MOBILE_MONEY_DEPOSIT';
}
