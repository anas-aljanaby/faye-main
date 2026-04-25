import { FinancialTransaction } from '../types';

export const FINANCIAL_SYSTEM_ORPHAN_PARAM = 'orphan';

export const parseFinancialSystemOrphanId = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const buildFinancialSystemUrl = (orphanId: number) => {
  const params = new URLSearchParams({
    [FINANCIAL_SYSTEM_ORPHAN_PARAM]: String(orphanId),
  });

  return `/financial-system?${params.toString()}`;
};

export const isTransactionRelatedToOrphan = (
  transaction: Pick<FinancialTransaction, 'orphanId' | 'receipt'>,
  orphanId: number
) =>
  transaction.orphanId === orphanId ||
  transaction.receipt?.relatedOrphanIds?.includes(orphanId) === true;

export const filterTransactionsByOrphan = <
  T extends Pick<FinancialTransaction, 'orphanId' | 'receipt'>
>(
  transactions: readonly T[],
  orphanId: number | null | undefined
): T[] => {
  if (!orphanId) {
    return [...transactions];
  }

  return transactions.filter((transaction) =>
    isTransactionRelatedToOrphan(transaction, orphanId)
  );
};
