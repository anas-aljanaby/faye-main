import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { FinancialTransaction, TransactionType, TransactionStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { uuidToNumber } from '../utils/idMapper';

// Extended transaction type with approval info
export interface FinancialTransactionWithApproval extends FinancialTransaction {
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

// Helper function to convert numeric ID to UUID (for lookups)
// This is a simplified approach - in production you'd want a proper mapping
const numberToUuid = (num: number, uuidMap: Map<number, string>): string | undefined => {
  return uuidMap.get(num);
};

export const useFinancialTransactions = (mode: 'full' | 'dashboard' = 'full') => {
  const { userProfile, canCreateExpense, canApproveExpense, canEditTransactions } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: transactions = EMPTY_TRANSACTIONS,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['financial-transactions', mode, userProfile?.organization_id],
    queryFn: () => fetchFinancialTransactionsData(userProfile!.organization_id, mode),
    enabled: !!userProfile,
  });

  const fetchTransactions = useCallback(async (_useCache = true, _silent = false) => {
    await refetch();
  }, [refetch]);

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
      console.log('Inserting transaction with data:', {
        organization_id: userProfile.organization_id,
        description: transactionData.description,
        created_by_id: userProfile.id,
        amount: transactionData.amount,
        status: status,
        type: transactionData.type,
        orphan_id: orphanUuid,
      });
      
      // Use current timestamp for date
      const now = new Date();
      const insertData = {
        organization_id: userProfile.organization_id,
        description: transactionData.description,
        created_by_id: userProfile.id,
        amount: transactionData.amount,
        status: status,
        type: transactionData.type,
        orphan_id: orphanUuid || null,
        // Don't set date - let database use DEFAULT NOW()
        // date: now.toISOString(),
      };
      
      console.log('Insert data prepared (date will use DB default):', insertData);
      
      console.log('About to insert transaction with:', insertData);
      console.log('Supabase client check:', !!supabase);
      console.log('User profile check:', !!userProfile);
      
      let newTransaction;
      let txError;
      
      try {
        console.log('Creating insert promise...');
        // Direct insert without timeout - let Supabase handle it
        const { data: newTransactionData, error: txErrorData } = await supabase
          .from('financial_transactions')
          .insert(insertData)
          .select()
          .single();
        
        newTransaction = newTransactionData;
        txError = txErrorData;
        
        console.log('Insert result received:', { 
          hasData: !!newTransaction, 
          hasError: !!txError,
          transactionId: newTransaction?.id,
          errorMessage: txError?.message 
        });
      } catch (insertErr) {
        console.error('Exception during insert:', insertErr);
        console.error('Exception type:', insertErr instanceof Error ? insertErr.constructor.name : typeof insertErr);
        console.error('Exception message:', insertErr instanceof Error ? insertErr.message : String(insertErr));
        throw insertErr;
      }

      if (txError) {
        console.error('Error inserting transaction:', txError);
        console.error('Error details:', {
          message: txError.message,
          details: txError.details,
          hint: txError.hint,
          code: txError.code
        });
        throw txError;
      }
      
      if (!newTransaction) {
        console.error('Transaction insert returned no data');
        throw new Error('Transaction insert returned no data');
      }
      
      console.log('Transaction inserted successfully:', newTransaction.id);
      console.log('New transaction data:', newTransaction);

      // If it's an income transaction with a receipt, create the receipt
      if (transactionData.type === TransactionType.Income && transactionData.receipt) {
        console.log('Creating receipt for transaction:', newTransaction.id);
        console.log('Receipt data:', transactionData.receipt);
        
        // Find sponsor UUID by name or ID
        let sponsorUuid: string | undefined = undefined;
        
        // Try to find sponsor by name first (excluding system admin)
        const { data: sponsors, error: sponsorError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('organization_id', userProfile.organization_id)
          .eq('role', 'sponsor')
          .eq('is_system_admin', false)
          .ilike('name', `%${transactionData.receipt.sponsorName}%`)
          .limit(1);

        if (sponsorError) {
          console.error('Error finding sponsor:', sponsorError);
          throw sponsorError;
        }

        if (sponsors && sponsors.length > 0) {
          sponsorUuid = sponsors[0].id;
          console.log('Found sponsor UUID:', sponsorUuid);
        }

        if (!sponsorUuid) {
          console.error('Sponsor not found for name:', transactionData.receipt.sponsorName);
          throw new Error(`Sponsor not found: ${transactionData.receipt.sponsorName}`);
        }

        // Create receipt (use transaction date for consistency)
        const transactionDate = new Date(newTransaction.date);
        console.log('Inserting receipt with data:', {
          transaction_id: newTransaction.id,
          sponsor_id: sponsorUuid,
          donation_category: transactionData.receipt.donationCategory,
          amount: transactionData.receipt.amount,
          date: transactionDate.toISOString().split('T')[0],
          description: transactionData.receipt.description,
        });
        
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

        if (receiptError) {
          console.error('Error creating receipt:', receiptError);
          throw receiptError;
        }
        
        console.log('Receipt created successfully:', receipt.id);

        // Create receipt_orphans entries if there are related orphans
        if (transactionData.receipt.relatedOrphanIds && transactionData.receipt.relatedOrphanIds.length > 0) {
          // Find orphan UUIDs
          const { data: allOrphans } = await supabase
            .from('orphans')
            .select('id')
            .eq('organization_id', userProfile.organization_id);

          if (allOrphans) {
            const receiptOrphans = transactionData.receipt.relatedOrphanIds
              .map(numId => {
                const orphan = allOrphans.find(o => uuidToNumber(o.id) === numId);
                if (!orphan) return null;
                
                return {
                  receipt_id: receipt.id,
                  orphan_id: orphan.id,
                  amount: transactionData.receipt.orphanAmounts?.[numId] || null,
                };
              })
              .filter((item): item is NonNullable<typeof item> => item !== null);

            if (receiptOrphans.length > 0) {
              const { error: receiptOrphansError } = await supabase
                .from('receipt_orphans')
                .insert(receiptOrphans);

              if (receiptOrphansError) throw receiptOrphansError;
            }
          }
        }
      }

      // Don't refresh here - let the component handle it to avoid double refresh
      // This also prevents hanging if fetchTransactions has issues
      console.log('Transaction creation complete, returning ID:', newTransaction.id);
      return newTransaction.id;
    } catch (err) {
      console.error('Error adding transaction:', err);
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack');
      throw err;
    }
  };

  const addSponsor = async (name: string) => {
    if (!userProfile) throw new Error('User not authenticated');

    try {
      // Check if sponsor already exists (search by exact or similar name, excluding system admin)
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id, name, avatar_url')
        .eq('organization_id', userProfile.organization_id)
        .eq('role', 'sponsor')
        .eq('is_system_admin', false)
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

      await queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
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

      await queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
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

      await queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      return { success: true };
    } catch (err) {
      console.error('Error deleting transaction:', err);
      return { success: false, error: 'حدث خطأ أثناء حذف المعاملة' };
    }
  };

  return { 
    transactions, 
    loading, 
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch financial transactions') : null, 
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

const EMPTY_TRANSACTIONS: FinancialTransactionWithApproval[] = [];

async function fetchFinancialTransactionsData(
  organizationId: string,
  mode: 'full' | 'dashboard'
): Promise<FinancialTransactionWithApproval[]> {
  // For dashboard widgets we only need basic transaction data (no receipts/payments joins)
  if (mode === 'dashboard') {
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false });

    if (transactionsError) throw transactionsError;
    if (!transactionsData) return [];

    return transactionsData.map((tx) => ({
      id: tx.id,
      date: new Date(tx.date),
      description: tx.description,
      // We don't join created_by for dashboard mode; it's not used there
      createdBy: 'مدير النظام',
      amount: parseFloat(tx.amount),
      status: tx.status as TransactionStatus,
      type: tx.type as TransactionType,
      ...(tx.orphan_id && { orphanId: uuidToNumber(tx.orphan_id) }),
    }));
  }

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
    .eq('organization_id', organizationId)
    .order('date', { ascending: false });

  if (transactionsError) throw transactionsError;
  if (!transactionsData) return [];

  // Fetch receipts for income transactions
  const incomeTransactionIds = transactionsData
    .filter(tx => tx.type === 'إيرادات')
    .map(tx => tx.id);

  let receiptsData: any[] = [];
  let receiptOrphansData: any[] = [];
  let paymentsData: any[] = [];

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

      const transactionDates = transactionsData
        .filter(tx => incomeTransactionIds.includes(tx.id))
        .map(tx => new Date(tx.date).toISOString().split('T')[0]);

      const orphanIdsFromReceipts = receiptOrphansData.map(ro => ro.orphan_id);

      if (orphanIdsFromReceipts.length > 0 && transactionDates.length > 0) {
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .in('orphan_id', orphanIdsFromReceipts)
          .in('paid_date', transactionDates)
          .eq('status', 'مدفوع');

        paymentsData = payments || [];
      }
    }
  }

  const orphansByReceipt = new Map<string, any[]>();
  receiptOrphansData.forEach(ro => {
    if (!orphansByReceipt.has(ro.receipt_id)) {
      orphansByReceipt.set(ro.receipt_id, []);
    }
    orphansByReceipt.get(ro.receipt_id)!.push(ro);
  });

  const orphanUuidMap = new Map<string, number>();
  transactionsData.forEach(tx => {
    if (tx.orphan_id && !orphanUuidMap.has(tx.orphan_id)) {
      orphanUuidMap.set(tx.orphan_id, uuidToNumber(tx.orphan_id));
    }
  });
  receiptOrphansData.forEach(ro => {
    if (!orphanUuidMap.has(ro.orphan_id)) {
      orphanUuidMap.set(ro.orphan_id, uuidToNumber(ro.orphan_id));
    }
  });

  return transactionsData.map((tx) => {
    const receipt = receiptsData.find(r => r.transaction_id === tx.id);

    let receiptData = undefined;
    if (receipt) {
      const receiptOrphans = orphansByReceipt.get(receipt.id) || [];
      const relatedOrphanIds = receiptOrphans
        .map(ro => {
          const numId = orphanUuidMap.get(ro.orphan_id);
          return numId !== undefined ? numId : uuidToNumber(ro.orphan_id);
        });

      const transactionDateStr = new Date(tx.date).toISOString().split('T')[0];
      const orphanPaymentMonths: Record<number, { month?: number; year: number; isYear: boolean }> = {};
      const orphanAmounts: Record<number, number> = {};

      receiptOrphans.forEach(ro => {
        const numId = orphanUuidMap.get(ro.orphan_id);
        const orphanId = numId !== undefined ? numId : uuidToNumber(ro.orphan_id);
        const relatedPayments = paymentsData.filter(p =>
          p.orphan_id === ro.orphan_id &&
          p.paid_date === transactionDateStr
        );

        if (relatedPayments.length > 0) {
          const paymentsByYear = new Map<number, any[]>();
          relatedPayments.forEach(p => {
            const dueDate = new Date(p.due_date);
            const year = dueDate.getFullYear();
            if (!paymentsByYear.has(year)) {
              paymentsByYear.set(year, []);
            }
            paymentsByYear.get(year)!.push(p);
          });

          paymentsByYear.forEach((payments, year) => {
            if (payments.length === 12) {
              orphanPaymentMonths[orphanId] = {
                year,
                isYear: true,
              };
            } else if (payments.length === 1) {
              const dueDate = new Date(payments[0].due_date);
              orphanPaymentMonths[orphanId] = {
                month: dueDate.getMonth(),
                year,
                isYear: false,
              };
            } else {
              const dueDate = new Date(payments[0].due_date);
              orphanPaymentMonths[orphanId] = {
                month: dueDate.getMonth(),
                year,
                isYear: false,
              };
            }
          });
        }

        if (ro.amount !== null && ro.amount !== undefined) {
          orphanAmounts[orphanId] = parseFloat(ro.amount.toString());
        }
      });

      receiptData = {
        sponsorName: receipt.sponsor?.name || '',
        donationCategory: receipt.donation_category,
        amount: parseFloat(receipt.amount),
        date: new Date(receipt.date),
        description: receipt.description || '',
        transactionId: tx.id,
        relatedOrphanIds,
        orphanPaymentMonths: Object.keys(orphanPaymentMonths).length > 0 ? orphanPaymentMonths : undefined,
        orphanAmounts: Object.keys(orphanAmounts).length > 0 ? orphanAmounts : undefined,
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
      ...(tx.approved_by && { approvedBy: (tx.approved_by as any)?.name }),
      ...(tx.rejected_by && { rejectedBy: (tx.rejected_by as any)?.name }),
      ...(tx.rejection_reason && { rejectionReason: tx.rejection_reason }),
    } as FinancialTransactionWithApproval;
  });
}

