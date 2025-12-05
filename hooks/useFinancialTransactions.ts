import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FinancialTransaction, TransactionType, TransactionStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cache, getCacheKey } from '../utils/cache';

// Extended transaction type with approval info
export interface FinancialTransactionWithApproval extends FinancialTransaction {
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

// Helper function to convert UUID to numeric ID for compatibility
const uuidToNumber = (uuid: string): number => {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 1000000;
};

// Helper function to convert numeric ID to UUID (for lookups)
// This is a simplified approach - in production you'd want a proper mapping
const numberToUuid = (num: number, uuidMap: Map<number, string>): string | undefined => {
  return uuidMap.get(num);
};

export const useFinancialTransactions = () => {
  const [transactions, setTransactions] = useState<FinancialTransactionWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile, canCreateExpense, canApproveExpense, canEditTransactions } = useAuth();

  useEffect(() => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    fetchTransactions();
  }, [userProfile]);

  const fetchTransactions = async (useCache = true) => {
    if (!userProfile) return;

    const cacheKey = getCacheKey.financialTransactions(userProfile.organization_id);
    
    // Check cache first
    if (useCache) {
      const cachedData = cache.get<FinancialTransaction[]>(cacheKey);
      if (cachedData) {
        setTransactions(cachedData);
        setLoading(false);
        // Still fetch in background to update cache (stale-while-revalidate)
        fetchTransactions(false).catch(() => {});
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch transactions with related data including approval info
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          created_by:user_profiles!financial_transactions_created_by_id_fkey(name),
          approved_by:user_profiles!financial_transactions_approved_by_id_fkey(name),
          rejected_by:user_profiles!financial_transactions_rejected_by_id_fkey(name),
          orphan:orphans(id)
        `)
        .eq('organization_id', userProfile.organization_id)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;
      if (!transactionsData) {
        setTransactions([]);
        setLoading(false);
        cache.set(cacheKey, [], 2 * 60 * 1000);
        return;
      }

      // Fetch receipts for income transactions
      const incomeTransactionIds = transactionsData
        .filter(tx => tx.type === 'إيرادات')
        .map(tx => tx.id);

      let receiptsData: any[] = [];
      let receiptOrphansData: any[] = [];

      if (incomeTransactionIds.length > 0) {
        const { data: receipts } = await supabase
          .from('receipts')
          .select(`
            *,
            sponsor:user_profiles!receipts_sponsor_id_fkey(name)
          `)
          .in('transaction_id', incomeTransactionIds);

        receiptsData = receipts || [];

        const receiptIds = receiptsData.map(r => r.id);
        if (receiptIds.length > 0) {
          const { data: receiptOrphans } = await supabase
            .from('receipt_orphans')
            .select('*')
            .in('receipt_id', receiptIds);

          receiptOrphansData = receiptOrphans || [];
        }
      }

      // Group receipt orphans by receipt_id
      const orphansByReceipt = new Map<string, any[]>();
      receiptOrphansData.forEach(ro => {
        if (!orphansByReceipt.has(ro.receipt_id)) {
          orphansByReceipt.set(ro.receipt_id, []);
        }
        orphansByReceipt.get(ro.receipt_id)!.push(ro);
      });

      // Build UUID to number mapping for orphans
      const orphanUuidMap = new Map<string, number>();
      transactionsData.forEach(tx => {
        if (tx.orphan_id && !orphanUuidMap.has(tx.orphan_id)) {
          orphanUuidMap.set(tx.orphan_id, uuidToNumber(tx.orphan_id));
        }
      });

      // Build transactions with receipts
      const transactionsWithReceipts = transactionsData.map((tx) => {
        const receipt = receiptsData.find(r => r.transaction_id === tx.id);
        
        let receiptData = undefined;
        if (receipt) {
          const receiptOrphans = orphansByReceipt.get(receipt.id) || [];
          const relatedOrphanIds = receiptOrphans
            .map(ro => {
              const numId = orphanUuidMap.get(ro.orphan_id);
              return numId !== undefined ? numId : uuidToNumber(ro.orphan_id);
            });

          receiptData = {
            sponsorName: receipt.sponsor?.name || '',
            donationCategory: receipt.donation_category,
            amount: parseFloat(receipt.amount),
            date: new Date(receipt.date),
            description: receipt.description || '',
            transactionId: tx.id,
            relatedOrphanIds,
          };
        }

        return {
          id: tx.id,
          date: new Date(tx.date),
          description: tx.description,
          createdBy: (tx.created_by as any)?.name || 'مدير النظام',
          amount: parseFloat(tx.amount),
          status: tx.status as TransactionStatus,
          type: tx.type as TransactionType,
          ...(tx.orphan_id && { orphanId: uuidToNumber(tx.orphan_id) }),
          ...(receiptData && { receipt: receiptData }),
          // Approval info
          ...(tx.approved_by && { approvedBy: (tx.approved_by as any)?.name }),
          ...(tx.rejected_by && { rejectedBy: (tx.rejected_by as any)?.name }),
          ...(tx.rejection_reason && { rejectionReason: tx.rejection_reason }),
        } as FinancialTransactionWithApproval;
      });

      setTransactions(transactionsWithReceipts);
      // Cache the result for 2 minutes
      cache.set(cacheKey, transactionsWithReceipts, 2 * 60 * 1000);
    } catch (err) {
      console.error('Error fetching financial transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch financial transactions');
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transactionData: Omit<FinancialTransaction, 'id' | 'date' | 'status'>) => {
    if (!userProfile) throw new Error('User not authenticated');

    try {
      // Convert orphanId from number to UUID if needed
      let orphanUuid: string | undefined = undefined;
      if (transactionData.orphanId) {
        // We need to find the orphan UUID by looking it up
        const { data: orphans } = await supabase
          .from('orphans')
          .select('id')
          .eq('organization_id', userProfile.organization_id);
        
        if (orphans) {
          // Find orphan by matching numeric ID
          const orphan = orphans.find(o => uuidToNumber(o.id) === transactionData.orphanId);
          if (orphan) {
            orphanUuid = orphan.id;
          }
        }
      }

      // Determine status based on transaction type and permissions
      let status: string;
      if (transactionData.type === TransactionType.Income) {
        // Income transactions are always completed
        status = 'مكتملة';
      } else {
        // Expense transactions: check if user can create expense directly
        status = canCreateExpense() ? 'مكتملة' : 'قيد المراجعة';
      }

      // Insert transaction
      const { data: newTransaction, error: txError } = await supabase
        .from('financial_transactions')
        .insert({
          organization_id: userProfile.organization_id,
          description: transactionData.description,
          created_by_id: userProfile.id,
          amount: transactionData.amount,
          status: status,
          type: transactionData.type,
          orphan_id: orphanUuid,
          date: new Date(),
        })
        .select()
        .single();

      if (txError) throw txError;

      // If it's an income transaction with a receipt, create the receipt
      if (transactionData.type === TransactionType.Income && transactionData.receipt) {
        // Find sponsor UUID by name or ID
        let sponsorUuid: string | undefined = undefined;
        
        // Try to find sponsor by name first
        const { data: sponsors } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('organization_id', userProfile.organization_id)
          .eq('role', 'sponsor')
          .ilike('name', `%${transactionData.receipt.sponsorName}%`)
          .limit(1);

        if (sponsors && sponsors.length > 0) {
          sponsorUuid = sponsors[0].id;
        }

        if (!sponsorUuid) {
          throw new Error('Sponsor not found');
        }

        // Create receipt (use transaction date for consistency)
        const transactionDate = new Date(newTransaction.date);
        const { data: receipt, error: receiptError } = await supabase
          .from('receipts')
          .insert({
            transaction_id: newTransaction.id,
            sponsor_id: sponsorUuid,
            donation_category: transactionData.receipt.donationCategory,
            amount: transactionData.receipt.amount,
            date: transactionDate.toISOString().split('T')[0],
            description: transactionData.receipt.description,
          })
          .select()
          .single();

        if (receiptError) throw receiptError;

        // Create receipt_orphans entries if there are related orphans
        if (transactionData.receipt.relatedOrphanIds && transactionData.receipt.relatedOrphanIds.length > 0) {
          // Find orphan UUIDs
          const { data: allOrphans } = await supabase
            .from('orphans')
            .select('id')
            .eq('organization_id', userProfile.organization_id);

          if (allOrphans) {
            const orphanUuids = transactionData.receipt.relatedOrphanIds
              .map(numId => {
                const orphan = allOrphans.find(o => uuidToNumber(o.id) === numId);
                return orphan?.id;
              })
              .filter((id): id is string => id !== undefined);

            if (orphanUuids.length > 0) {
              const receiptOrphans = orphanUuids.map(orphanId => ({
                receipt_id: receipt.id,
                orphan_id: orphanId,
              }));

              const { error: receiptOrphansError } = await supabase
                .from('receipt_orphans')
                .insert(receiptOrphans);

              if (receiptOrphansError) throw receiptOrphansError;
            }
          }
        }
      }

      // Refresh transactions to get the full transaction with receipt
      await fetchTransactions(false);
      
      // Return the transaction ID so the component can find it after refetch
      return newTransaction.id;
    } catch (err) {
      console.error('Error adding transaction:', err);
      throw err;
    }
  };

  const addSponsor = async (name: string) => {
    if (!userProfile) throw new Error('User not authenticated');

    try {
      // Check if sponsor already exists (search by exact or similar name)
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id, name, avatar_url')
        .eq('organization_id', userProfile.organization_id)
        .eq('role', 'sponsor')
        .ilike('name', `%${name}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        // Get sponsored orphan IDs
        const { data: sponsorOrphans } = await supabase
          .from('sponsor_orphans')
          .select('orphan_id')
          .eq('sponsor_id', existing[0].id);

        const sponsoredOrphanIds = (sponsorOrphans || []).map(so => uuidToNumber(so.orphan_id));

        // Return existing sponsor
        return {
          id: uuidToNumber(existing[0].id),
          uuid: existing[0].id,
          name: existing[0].name,
          avatarUrl: existing[0].avatar_url || '',
          sponsoredOrphanIds,
        };
      }

      // For new sponsors, we need to create an auth user first
      // Since we can't create auth users from the client, we'll throw an error
      // with a helpful message. In production, you'd have an admin API endpoint
      // to create sponsors with auth users.
      throw new Error('لا يمكن إنشاء كافل جديد من هنا. يرجى إنشاء حساب الكافل من لوحة التحكم أولاً.');
    } catch (err) {
      console.error('Error adding sponsor:', err);
      throw err;
    }
  };

  const approveTransaction = async (transactionId: string): Promise<{ success: boolean; error?: string }> => {
    if (!userProfile) return { success: false, error: 'المستخدم غير مسجل الدخول' };
    if (!canApproveExpense()) return { success: false, error: 'ليس لديك صلاحية للموافقة على المصروفات' };

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({
          status: 'مكتملة',
          approved_by_id: userProfile.id,
          rejected_by_id: null,
          rejection_reason: null,
        })
        .eq('id', transactionId);

      if (error) throw error;

      await fetchTransactions(false);
      return { success: true };
    } catch (err) {
      console.error('Error approving transaction:', err);
      return { success: false, error: 'حدث خطأ أثناء الموافقة على المعاملة' };
    }
  };

  const rejectTransaction = async (transactionId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    if (!userProfile) return { success: false, error: 'المستخدم غير مسجل الدخول' };
    if (!canApproveExpense()) return { success: false, error: 'ليس لديك صلاحية لرفض المصروفات' };

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({
          status: 'مرفوضة',
          rejected_by_id: userProfile.id,
          rejection_reason: reason,
          approved_by_id: null,
        })
        .eq('id', transactionId);

      if (error) throw error;

      await fetchTransactions(false);
      return { success: true };
    } catch (err) {
      console.error('Error rejecting transaction:', err);
      return { success: false, error: 'حدث خطأ أثناء رفض المعاملة' };
    }
  };

  const deleteTransaction = async (transactionId: string): Promise<{ success: boolean; error?: string }> => {
    if (!userProfile) return { success: false, error: 'المستخدم غير مسجل الدخول' };
    if (!canEditTransactions()) return { success: false, error: 'ليس لديك صلاحية لحذف المعاملات' };

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      await fetchTransactions(false);
      return { success: true };
    } catch (err) {
      console.error('Error deleting transaction:', err);
      return { success: false, error: 'حدث خطأ أثناء حذف المعاملة' };
    }
  };

  return { 
    transactions, 
    loading, 
    error, 
    refetch: fetchTransactions,
    addTransaction,
    addSponsor,
    approveTransaction,
    rejectTransaction,
    deleteTransaction,
    // Expose permission checks for UI
    canApproveExpense: canApproveExpense(),
    canEditTransactions: canEditTransactions(),
    canCreateExpenseDirectly: canCreateExpense(),
  };
};

