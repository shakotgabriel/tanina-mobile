const MINOR_UNITS_FACTOR = 100;

export const formatCurrency = (amountMinor: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amountMinor / MINOR_UNITS_FACTOR);
};

export const toMinorUnits = (amountMajor: number) => {
  return Math.round(amountMajor * MINOR_UNITS_FACTOR);
};

export const isValidTransferAmount = (amountMajor: number) => {
  return Number.isFinite(amountMajor) && amountMajor > 0;
};
