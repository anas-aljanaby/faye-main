import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useSponsorsBasic } from '../hooks/useSponsors';
import { useOrphansBasic } from '../hooks/useOrphans';
import { useFinancialTransactions, FinancialTransactionWithApproval } from '../hooks/useFinancialTransactions';
import { FinancialTransaction, TransactionStatus, TransactionType, Sponsor, Orphan, PaymentStatus, Payment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { supabase } from '../lib/supabase';
import {
    FINANCIAL_SYSTEM_ORPHAN_PARAM,
    filterTransactionsByOrphan,
    parseFinancialSystemOrphanId,
} from '../lib/orphanFinancials';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Avatar from './Avatar';
import PaymentStatusBadge from './PaymentStatusBadge';

/** Normalize date from API (may be Date or ISO string) to Date; return null if invalid. */
function ensureDate(d: Date | string | undefined | null): Date | null {
    if (d == null) return null;
    const date = d instanceof Date ? d : new Date(d);
    return isNaN(date.getTime()) ? null : date;
}

const ARABIC_MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MANUAL_PAYMENT_STATUSES = [PaymentStatus.Due, PaymentStatus.Overdue, PaymentStatus.Processing] as const;

type ManualPaymentStatus = (typeof MANUAL_PAYMENT_STATUSES)[number];
type PaymentCoverageInfo = { month?: number; year: number; isYear: boolean };

function getPaymentCoverageLabel(paymentInfo: PaymentCoverageInfo) {
    if (paymentInfo.isYear) {
        return `سنة ${paymentInfo.year} كاملة`;
    }

    if (paymentInfo.month !== undefined) {
        return `${ARABIC_MONTH_NAMES[paymentInfo.month]} ${paymentInfo.year}`;
    }

    return `${paymentInfo.year}`;
}

function getCoveredMonths(paymentInfo: PaymentCoverageInfo) {
    if (paymentInfo.isYear) {
        return Array.from({ length: 12 }, (_, month) => ({ month, year: paymentInfo.year }));
    }

    if (paymentInfo.month !== undefined) {
        return [{ month: paymentInfo.month, year: paymentInfo.year }];
    }

    return [];
}

// Approve Transaction Modal
const ApproveTransactionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApprove: () => void;
    transaction: FinancialTransactionWithApproval | null;
    orphans: Orphan[];
}> = ({ isOpen, onClose, onApprove, transaction, orphans }) => {
    if (!isOpen || !transaction) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 md:items-center md:p-4" onClick={onClose}>
            <div className="flex h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white md:rounded-t-2xl md:p-6">
                    <div className="flex items-start gap-3 md:items-center md:gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 md:h-16 md:w-16">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h2 className="mb-1 text-lg font-bold md:text-2xl">الموافقة على المعاملة المالية</h2>
                            <p className="text-green-100 text-sm">يرجى مراجعة تفاصيل المعاملة قبل الموافقة</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label="إغلاق"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-4 overflow-y-auto p-4 md:space-y-6 md:p-6">
                    {/* Transaction Details Card */}
                    <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-4 md:p-5">
                        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-800 md:text-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                            تفاصيل المعاملة
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">البيان</p>
                                <p className="text-base font-semibold text-gray-800 md:text-lg">{transaction.description}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">المبلغ</p>
                                <p className={`text-xl font-bold md:text-2xl ${transaction.type === TransactionType.Income ? 'text-green-600' : 'text-red-600'}`}>
                                    ${transaction.amount.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">النوع</p>
                                <p className="font-semibold text-gray-800">{transaction.type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">التاريخ</p>
                                <p className="font-semibold text-gray-800">{ensureDate(transaction.date)?.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">أنشئت بواسطة</p>
                                <p className="font-semibold text-gray-800">{transaction.createdBy}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">الحالة الحالية</p>
                                <StatusPill status={transaction.status} />
                            </div>
                        </div>
                    </div>

                    {/* Receipt/Orphan Information */}
                    {transaction.receipt && (
                        <div className="bg-blue-50 rounded-lg p-5 border-2 border-blue-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                                معلومات الإيصال
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">الكافل</p>
                                    <p className="font-semibold text-gray-800">{transaction.receipt.sponsorName}</p>
                                </div>
                                {transaction.receipt.orphanPaymentMonths && transaction.receipt.relatedOrphanIds && transaction.receipt.relatedOrphanIds.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">الأيتام والدفعات</p>
                                        <div className="space-y-2">
                                            {transaction.receipt.relatedOrphanIds.map(orphanId => {
                                                const orphan = orphans.find(o => o.id === orphanId);
                                                const paymentInfo = transaction.receipt?.orphanPaymentMonths?.[orphanId];
                                                if (!paymentInfo || !orphan) return null;
                                                
                                                let paymentText = '';
                                                if (paymentInfo.isYear) {
                                                    paymentText = `سنة ${paymentInfo.year} كاملة`;
                                                } else if (paymentInfo.month !== undefined) {
                                                    paymentText = `${ARABIC_MONTH_NAMES[paymentInfo.month]} ${paymentInfo.year}`;
                                                }
                                                
                                                return (
                                                    <div key={orphanId} className="bg-white rounded p-3 border border-blue-200">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar src={orphan.photoUrl} name={orphan.name} size="md" />
                                                            <div className="flex-1">
                                                                <p className="font-semibold text-gray-800">{orphan.name}</p>
                                                                <p className="text-sm text-gray-600">دفعة: {paymentText}</p>
                                                            </div>
                                                            {transaction.receipt.orphanAmounts?.[orphanId] && (
                                                                <p className="font-bold text-blue-600">${transaction.receipt.orphanAmounts[orphanId].toLocaleString()}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {transaction.orphanId && (
                        <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4 md:p-5">
                            <h3 className="mb-2 text-base font-bold text-gray-800 md:text-lg">اليتيم المرتبط</h3>
                            {(() => {
                                const orphan = orphans.find(o => o.id === transaction.orphanId);
                                return orphan ? (
                                    <div className="flex items-center gap-3">
                                        <Avatar src={orphan.photoUrl} name={orphan.name} size="lg" />
                                        <p className="font-semibold text-gray-800">{orphan.name}</p>
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    )}

                    {/* Warning/Info Box */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                        <div className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 flex-shrink-0 mt-0.5">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            <div>
                                <p className="font-semibold text-yellow-800 mb-1">تنبيه مهم</p>
                                <p className="text-sm text-yellow-700">بعد الموافقة على هذه المعاملة، سيتم اعتمادها نهائياً في النظام المالي. تأكد من صحة جميع المعلومات قبل المتابعة.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:flex-row md:justify-end md:rounded-b-2xl md:p-6">
                    <button 
                        onClick={onClose} 
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gray-200 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        إلغاء
                    </button>
                    <button 
                        onClick={onApprove} 
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 text-base font-bold text-white shadow-lg transition-all hover:from-green-600 hover:to-green-700 hover:shadow-xl md:px-8 md:text-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        الموافقة على المعاملة
                    </button>
                </div>
            </div>
        </div>
    );
};

// Reject Transaction Modal
const RejectTransactionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onReject: (reason: string) => void;
    transactionDescription: string;
}> = ({ isOpen, onClose, onReject, transactionDescription }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (reason.trim()) {
            onReject(reason.trim());
            setReason('');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4" onClick={onClose}>
            <div className="flex h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-xl md:h-auto md:max-w-md md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 md:px-6">
                    <div>
                        <h3 className="text-lg font-bold text-red-600">رفض المعاملة</h3>
                        <p className="mt-1 text-sm text-text-secondary">{transactionDescription}</p>
                    </div>
                    <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800" aria-label="إغلاق">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="سبب الرفض..."
                        className="min-h-[160px] w-full rounded-2xl border border-gray-300 bg-white px-4 py-3"
                        required
                        autoFocus
                    />
                    </div>
                    <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:flex-row md:justify-end md:px-6 md:pb-4">
                        <button type="button" onClick={onClose} className="min-h-[48px] rounded-xl bg-gray-100 px-4 py-2 font-semibold text-text-secondary hover:bg-gray-200">إلغاء</button>
                        <button type="submit" className="min-h-[48px] rounded-xl bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600">رفض</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AddSponsorQuickModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
            setName('');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4" onClick={onClose}>
            <div className="flex h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-xl md:h-auto md:max-w-sm md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 md:px-6">
                    <h3 className="text-lg font-bold text-gray-900">إضافة كافل جديد</h3>
                    <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800" aria-label="إغلاق">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="اسم الكافل الكامل"
                        className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                        required
                        autoFocus
                    />
                    </div>
                    <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:flex-row md:justify-end md:px-6 md:pb-4">
                        <button type="button" onClick={onClose} className="min-h-[48px] rounded-xl bg-gray-100 px-4 py-2 font-semibold text-text-secondary hover:bg-gray-200">إلغاء</button>
                        <button type="submit" className="min-h-[48px] rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-hover">إضافة</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AddTransactionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: Omit<FinancialTransaction, 'id' | 'date' | 'status'>) => void;
    sponsors: Sponsor[];
    orphans: Orphan[];
}> = ({ isOpen, onClose, onAdd, sponsors, orphans }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.Expense);
    const [selectedSponsorId, setSelectedSponsorId] = useState('');
    const [selectedOrphanId, setSelectedOrphanId] = useState('');
    const [donationCategory, setDonationCategory] = useState('');
    const [orphanAmounts, setOrphanAmounts] = useState<Record<number, string>>({});
    const [sponsoredOrphans, setSponsoredOrphans] = useState<Orphan[]>([]);
    const [selectedOrphans, setSelectedOrphans] = useState<number[]>([]);
    const [orphanPaymentInfo, setOrphanPaymentInfo] = useState<Record<number, { 
        amount: string; 
        paymentType: 'month' | 'year' | null;
        month?: number;
        year: number;
    }>>({});
    const [sponsorSearchQuery, setSponsorSearchQuery] = useState('');
    const [orphanSearchQuery, setOrphanSearchQuery] = useState('');

    useBodyScrollLock(isOpen);

    const paidSelectionConflicts = useMemo(() => {
        if (type !== TransactionType.Income || donationCategory !== 'كفالة يتيم') {
            return {};
        }

        return selectedOrphans.reduce<Record<number, string[]>>((acc, orphanId) => {
            const orphan = sponsoredOrphans.find((item) => item.id === orphanId);
            const paymentInfo = orphanPaymentInfo[orphanId];

            if (!orphan || !paymentInfo || paymentInfo.paymentType == null) {
                return acc;
            }

            const conflicts = getCoveredMonths({
                month: paymentInfo.paymentType === 'month' ? paymentInfo.month : undefined,
                year: paymentInfo.year,
                isYear: paymentInfo.paymentType === 'year',
            })
                .filter(({ month, year }) => orphan.payments.some((payment) =>
                    payment.status === PaymentStatus.Paid &&
                    payment.dueDate.getFullYear() === year &&
                    payment.dueDate.getMonth() === month
                ))
                .map(({ month, year }) => `${ARABIC_MONTH_NAMES[month]} ${year}`);

            if (conflicts.length > 0) {
                acc[orphanId] = conflicts;
            }

            return acc;
        }, {});
    }, [donationCategory, orphanPaymentInfo, selectedOrphans, sponsoredOrphans, type]);

    useEffect(() => {
        if (type === TransactionType.Income && selectedSponsorId) {
            const sponsorId = parseInt(selectedSponsorId, 10);
            const selectedSponsor = sponsors.find(s => s.id === sponsorId);
            // Use sponsor's sponsoredOrphanIds (orphans from useOrphansBasic have sponsorId: 0)
            const relatedOrphans = selectedSponsor
                ? orphans.filter(o => selectedSponsor.sponsoredOrphanIds.includes(o.id))
                : [];
            setSponsoredOrphans(relatedOrphans);
            setSelectedOrphans([]);
            setOrphanPaymentInfo({});
            setOrphanSearchQuery('');
        } else {
            setSponsoredOrphans([]);
            setSelectedOrphans([]);
            setOrphanPaymentInfo({});
            setOrphanSearchQuery('');
        }
    }, [selectedSponsorId, type, orphans, sponsors]);

    useEffect(() => {
        if (type === TransactionType.Income && donationCategory === 'كفالة يتيم') {
            // Calculate total from all orphan payment info
            const total = Object.values(orphanPaymentInfo).reduce<number>((sum, info) => {
                const amountAsNumber = Number(info.amount);
                return sum + (isNaN(amountAsNumber) ? 0 : amountAsNumber);
            }, 0);
            setAmount(total > 0 ? total.toString() : '');
        }
    }, [orphanPaymentInfo, type, donationCategory]);

    // Form validation
    const isFormValid = useMemo(() => {
        if (!amount || parseFloat(amount) <= 0) {
            return false;
        }
        
        if (type === TransactionType.Income) {
            if (!selectedSponsorId || !donationCategory) {
                return false;
            }
            
            if (donationCategory === 'كفالة يتيم') {
                if (Object.keys(paidSelectionConflicts).length > 0) {
                    return false;
                }

                // Check if at least one orphan has valid amount and payment type
                const hasValidOrphan = Object.values(orphanPaymentInfo).some(info => {
                    const amount = parseFloat(info.amount);
                    if (isNaN(amount) || amount <= 0) return false;
                    
                    if (info.paymentType === 'month') {
                        return info.month !== undefined;
                    } else if (info.paymentType === 'year') {
                        return true;
                    }
                    return false;
                });
                
                return hasValidOrphan;
            }
        }
        
        return true;
    }, [amount, type, selectedSponsorId, donationCategory, orphanPaymentInfo, paidSelectionConflicts]);

    const sortedSponsors = useMemo(
        () => [...sponsors].sort((a, b) => a.name.localeCompare(b.name, 'ar')),
        [sponsors]
    );

    const filteredSponsorsForPicker = useMemo(() => {
        const q = sponsorSearchQuery.trim();
        if (!q) return sortedSponsors;
        const lower = q.toLowerCase();
        return sortedSponsors.filter(
            (s) => s.name.includes(q) || s.name.toLowerCase().includes(lower)
        );
    }, [sortedSponsors, sponsorSearchQuery]);

    const sortedSponsoredOrphans = useMemo(
        () => [...sponsoredOrphans].sort((a, b) => a.name.localeCompare(b.name, 'ar')),
        [sponsoredOrphans]
    );

    const filteredOrphansForPicker = useMemo(() => {
        const available = sortedSponsoredOrphans.filter((o) => !selectedOrphans.includes(o.id));
        const q = orphanSearchQuery.trim();
        if (!q) return available;
        const lower = q.toLowerCase();
        return available.filter(
            (o) => o.name.includes(q) || o.name.toLowerCase().includes(lower)
        );
    }, [sortedSponsoredOrphans, selectedOrphans, orphanSearchQuery]);

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setType(TransactionType.Expense);
        setSelectedSponsorId('');
        setSponsorSearchQuery('');
        setOrphanSearchQuery('');
        setSelectedOrphanId('');
        setDonationCategory('');
        setOrphanAmounts({});
        setSponsoredOrphans([]);
        setSelectedOrphans([]);
        setOrphanPaymentInfo({});
        onClose();
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting) {
            console.log('Form already submitting, ignoring duplicate submit');
            return;
        }

        const amountValue = parseFloat(amount);
        const hasValidAmount = amount !== '' && !isNaN(amountValue) && amountValue > 0;

        if (type === TransactionType.Expense) {
            if (!hasValidAmount) {
                alert('الرجاء إدخال مبلغ صالح.');
                return;
            }
        } else {
            if (!selectedSponsorId) {
                alert('الرجاء اختيار الكافل.');
                return;
            }
            if (!donationCategory) {
                alert('الرجاء اختيار تصنيف التبرع.');
                return;
            }
            if (donationCategory === 'كفالة يتيم') {
                if (Object.keys(paidSelectionConflicts).length > 0) {
                    alert('بعض الأشهر المحددة مدفوعة بالفعل. احذف الحركة السابقة أولاً ثم أضف الحركة الصحيحة.');
                    return;
                }

                const hasValidOrphanInfo = Object.keys(orphanPaymentInfo).some((orphanIdStr) => {
                    const info = orphanPaymentInfo[parseInt(orphanIdStr, 10)];
                    const rowAmount = parseFloat(info.amount);
                    return !isNaN(rowAmount) && rowAmount > 0;
                });
                if (!hasValidOrphanInfo) {
                    alert('الرجاء إضافة يتيم واحد على الأقل مع المبلغ.');
                    return;
                }
                if (!hasValidAmount) {
                    alert('الرجاء إدخال مبالغ صالحة للأيتام.');
                    return;
                }
            } else if (!hasValidAmount) {
                alert('الرجاء إدخال مبلغ صالح.');
                return;
            }
        }
        
        setIsSubmitting(true);

        let transactionData: Omit<FinancialTransaction, 'id' | 'date' | 'status'>;

        try {
            if (type === TransactionType.Income) {
                const selectedSponsor = sponsors.find(s => s.id === parseInt(selectedSponsorId, 10));
                const sponsorName = selectedSponsor?.name || 'كافل غير محدد';
                const trimmedNote = description.trim();
                const finalDescription = trimmedNote
                    ? `[${donationCategory}] - ${trimmedNote}`
                    : `[${donationCategory}]`;

                const orphanAmountsMap: Record<number, number> = {};
                const orphanPaymentMonths: Record<number, { month?: number; year: number; isYear: boolean }> = {};

                Object.keys(orphanPaymentInfo).forEach((orphanIdStr) => {
                    const orphanId = parseInt(orphanIdStr, 10);
                    const info = orphanPaymentInfo[orphanId];
                    const rowAmount = parseFloat(info.amount);
                    if (!isNaN(rowAmount) && rowAmount > 0) {
                        orphanAmountsMap[orphanId] = rowAmount;
                        orphanPaymentMonths[orphanId] = {
                            month: info.paymentType === 'month' ? info.month : undefined,
                            year: info.year,
                            isYear: info.paymentType === 'year',
                        };
                    }
                });

                transactionData = {
                    description: finalDescription,
                    amount: parseFloat(amount),
                    type,
                    createdBy: 'خالد الغامدي', // Hardcoded team member name as requested
                    receipt: {
                        sponsorId: selectedSponsor?.id,
                        sponsorUuid: selectedSponsor?.uuid,
                        sponsorName,
                        donationCategory,
                        amount: parseFloat(amount),
                        date: new Date(), // Will be overwritten by parent, but good to have
                        description: trimmedNote,
                        relatedOrphanIds: Object.keys(orphanAmountsMap).map((id) => parseInt(id, 10)),
                        orphanAmounts: orphanAmountsMap,
                        transactionId: '', // Will be set in parent
                        orphanPaymentMonths,
                    } as any,
                };
            } else {
                transactionData = {
                    description: description.trim(),
                    amount: parseFloat(amount),
                    type,
                    createdBy: 'مدير النظام',
                    ...(selectedOrphanId && { orphanId: parseInt(selectedOrphanId, 10) }),
                };
            }

            await onAdd(transactionData);
            resetForm();
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            // Error is already handled in handleAddTransaction
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <>
        <div
            className="fixed inset-0 z-50 flex items-end justify-center overscroll-y-contain bg-black/50 p-0 md:items-center md:p-4"
            onClick={resetForm}
        >
            <div className="flex h-[calc(100dvh-1rem)] min-h-0 w-full flex-col overflow-hidden overscroll-y-contain rounded-t-[2rem] bg-white shadow-xl md:h-auto md:max-h-[90vh] md:max-w-md md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 md:px-6">
                    <h3 className="text-lg font-bold text-gray-900 md:text-xl">إضافة حركة مالية جديدة</h3>
                    <button type="button" onClick={resetForm} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800" aria-label="إغلاق">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden overscroll-y-contain p-4 md:p-6">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setType(TransactionType.Expense);
                                setSelectedSponsorId('');
                                setSponsorSearchQuery('');
                                setDonationCategory('');
                                setAmount('');
                            }}
                            className={`min-h-[48px] w-full rounded-xl px-4 py-2 font-semibold text-center transition-colors duration-200 ${
                                type === TransactionType.Expense ? 'bg-red-500 text-white shadow-md' : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                        >
                            مصروف
                        </button>
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.Income)}
                            className={`min-h-[48px] w-full rounded-xl px-4 py-2 font-semibold text-center transition-colors duration-200 ${
                                type === TransactionType.Income ? 'bg-green-500 text-white shadow-md' : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                        >
                            إيراد
                        </button>
                    </div>
                    
                    {type === TransactionType.Income && (
                         <>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">الكافل</label>
                                <input
                                    type="search"
                                    value={sponsorSearchQuery}
                                    onChange={(e) => setSponsorSearchQuery(e.target.value)}
                                    placeholder="بحث بالاسم..."
                                    className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                                    autoComplete="off"
                                />
                                <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                                    {filteredSponsorsForPicker.length === 0 ? (
                                        <p className="px-3 py-2 text-sm text-gray-500 text-center">لا نتائج</p>
                                    ) : (
                                        <ul className="divide-y divide-gray-100">
                                            {filteredSponsorsForPicker.map((sponsor) => {
                                                const isSelected = selectedSponsorId === String(sponsor.id);
                                                return (
                                                    <li key={sponsor.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedSponsorId(String(sponsor.id))}
                                                            className={`w-full px-3 py-3 text-right text-sm transition-colors ${
                                                                isSelected
                                                                    ? 'bg-primary-light text-primary font-semibold'
                                                                    : 'hover:bg-gray-50 text-gray-800'
                                                            }`}
                                                        >
                                                            {sponsor.name}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">تصنيف التبرع</label>
                                <select value={donationCategory} onChange={(e) => {
                                    setDonationCategory(e.target.value);
                                    if (e.target.value !== 'كفالة يتيم') {
                                        setAmount(''); 
                                    }
                                }} className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3" required>
                                    <option value="" disabled>-- اختر التصنيف --</option>
                                    <option value="كفالة يتيم">كفالة يتيم</option>
                                    <option value="تبرع عام">تبرع عام</option>
                                </select>
                            </div>
                            {donationCategory === 'كفالة يتيم' && selectedSponsorId && (
                                <div className="border-t pt-4 mt-4 space-y-4">
                                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                                        <p className="font-semibold">تسجيل دفعة الكفالة يعلّم الشهر كمدفوع تلقائياً.</p>
                                        <p className="mt-1 text-blue-700">
                                            اختر اليتيم ثم حدّد الشهر أو السنة والمبلغ. إذا كان الشهر مدفوعاً بالفعل فاحذف الحركة السابقة أولاً ثم أضف الحركة الصحيحة.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">اختر الأيتام</label>
                                        {sponsoredOrphans.length > 0 ? (
                                            <div className="space-y-1">
                                                <input
                                                    type="search"
                                                    value={orphanSearchQuery}
                                                    onChange={(e) => setOrphanSearchQuery(e.target.value)}
                                                    placeholder="بحث بالاسم..."
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
                                                    autoComplete="off"
                                                />
                                                <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                                                    {filteredOrphansForPicker.length === 0 ? (
                                                        <p className="px-3 py-2 text-sm text-gray-500 text-center">
                                                            {orphanSearchQuery.trim()
                                                                ? 'لا نتائج'
                                                                : 'تم اختيار جميع الأيتام المتاحين'}
                                                        </p>
                                                    ) : (
                                                        <ul className="divide-y divide-gray-100">
                                                            {filteredOrphansForPicker.map((orphan) => (
                                                                <li key={orphan.id}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (selectedOrphans.includes(orphan.id)) return;
                                                                            setSelectedOrphans((prev) => [...prev, orphan.id]);
                                                                            setOrphanPaymentInfo((prev) => ({
                                                                                ...prev,
                                                                                [orphan.id]: {
                                                                                    amount: '',
                                                                                    paymentType: null,
                                                                                    year: new Date().getFullYear(),
                                                                                },
                                                                            }));
                                                                        }}
                                                                        className="w-full text-right px-3 py-2 text-sm transition-colors hover:bg-gray-50 text-gray-800"
                                                                    >
                                                                        {orphan.name}
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                                                لم يتم العثور على أيتام مكفولين لهذا الكافل.
                                            </p>
                                        )}
                                    </div>

                                    {/* Selected Orphans with Amount and Payment Info */}
                                    {selectedOrphans.length > 0 && (
                                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                            {selectedOrphans.map(orphanId => {
                                                const orphan = sponsoredOrphans.find(o => o.id === orphanId);
                                                if (!orphan) return null;
                                                const paymentInfo = orphanPaymentInfo[orphanId] || {
                                                    amount: '',
                                                    paymentType: null,
                                                    year: new Date().getFullYear()
                                                };
                                                const selectedCoverageLabel = paymentInfo.paymentType
                                                    ? getPaymentCoverageLabel({
                                                        month: paymentInfo.paymentType === 'month' ? paymentInfo.month : undefined,
                                                        year: paymentInfo.year,
                                                        isYear: paymentInfo.paymentType === 'year',
                                                    })
                                                    : null;
                                                const paidConflicts = paidSelectionConflicts[orphanId] ?? [];

                                                return (
                                                    <div key={orphanId} className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h5 className="font-semibold text-gray-800">{orphan.name}</h5>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedOrphans(prev => prev.filter(id => id !== orphanId));
                                                                    setOrphanPaymentInfo(prev => {
                                                                        const newInfo = { ...prev };
                                                                        delete newInfo[orphanId];
                                                                        return newInfo;
                                                                    });
                                                                }}
                                                                className="text-red-500 hover:text-red-700 text-sm"
                                                            >
                                                                حذف
                                                            </button>
                                                        </div>

                                                        {/* Amount Section */}
                                                        <div className="mb-3">
                                                            <label className="text-xs font-medium text-gray-700 mb-1 block">المبلغ</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="المبلغ"
                                                                value={paymentInfo.amount}
                                                                onChange={(e) => {
                                                                    setOrphanPaymentInfo(prev => ({
                                                                        ...prev,
                                                                        [orphanId]: {
                                                                            ...prev[orphanId],
                                                                            amount: e.target.value
                                                                        }
                                                                    }));
                                                                }}
                                                                className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                            />
                                                        </div>

                                                        {selectedCoverageLabel && (
                                                            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                                                                <span className="font-semibold">سيتم تسجيل الدفعة على:</span> {selectedCoverageLabel}
                                                            </div>
                                                        )}

                                                        {paidConflicts.length > 0 && (
                                                            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                                                <span className="font-semibold">هذا الشهر مدفوع بالفعل:</span> {paidConflicts.join('، ')}
                                                            </div>
                                                        )}

                                                        {/* Payment Type Section */}
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-medium text-gray-700 block">نوع الدفعة</label>
                                                            <div className="mb-2 grid grid-cols-2 gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOrphanPaymentInfo(prev => ({
                                                                            ...prev,
                                                                            [orphanId]: {
                                                                                ...prev[orphanId],
                                                                                paymentType: 'month',
                                                                                amount: '50',
                                                                                month: undefined // Keep empty, user must select
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className={`min-h-[40px] rounded-lg px-3 py-1 text-xs transition-colors ${
                                                                        paymentInfo.paymentType === 'month'
                                                                            ? 'bg-primary text-white'
                                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                    }`}
                                                                >
                                                    شهر واحد
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOrphanPaymentInfo(prev => ({
                                                                            ...prev,
                                                                            [orphanId]: {
                                                                                ...prev[orphanId],
                                                                                paymentType: 'year',
                                                                                amount: '600'
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className={`min-h-[40px] rounded-lg px-3 py-1 text-xs transition-colors ${
                                                                        paymentInfo.paymentType === 'year'
                                                                            ? 'bg-primary text-white'
                                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                    }`}
                                                                >
                                                    سنة كاملة
                                                                </button>
                                                            </div>

                                                            {/* Month Selection */}
                                                            {paymentInfo.paymentType === 'month' && (
                                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                                    <select
                                                                        value={paymentInfo.month !== undefined ? paymentInfo.month : ''}
                                                                        onChange={(e) => {
                                                                            setOrphanPaymentInfo(prev => ({
                                                                                ...prev,
                                                                                [orphanId]: {
                                                                                    ...prev[orphanId],
                                                                                    month: parseInt(e.target.value)
                                                                                }
                                                                            }));
                                                                        }}
                                                                        className="min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs"
                                                                    >
                                                                        <option value="">-- اختر الشهر --</option>
                                                                        {Array.from({ length: 12 }, (_, i) => {
                                                                            const date = new Date(2000, i, 1);
                                                                            return (
                                                                                <option key={i} value={i}>
                                                                                    {date.toLocaleDateString('ar-EG', { month: 'long' })}
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                    <select
                                                                        value={paymentInfo.year}
                                                                        onChange={(e) => {
                                                                            setOrphanPaymentInfo(prev => ({
                                                                                ...prev,
                                                                                [orphanId]: {
                                                                                    ...prev[orphanId],
                                                                                    year: parseInt(e.target.value)
                                                                                }
                                                                            }));
                                                                        }}
                                                                        className="min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs"
                                                                    >
                                                                        {Array.from({ length: 5 }, (_, i) => {
                                                                            const year = new Date().getFullYear() - 2 + i;
                                                                            return (
                                                                                <option key={year} value={year}>
                                                                                    {year}
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                </div>
                                                            )}

                                                            {/* Year Selection */}
                                                            {paymentInfo.paymentType === 'year' && (
                                                                <div>
                                                                    <select
                                                                        value={paymentInfo.year}
                                                                        onChange={(e) => {
                                                                            setOrphanPaymentInfo(prev => ({
                                                                                ...prev,
                                                                                [orphanId]: {
                                                                                    ...prev[orphanId],
                                                                                    year: parseInt(e.target.value)
                                                                                }
                                                                            }));
                                                                        }}
                                                                        className="min-h-[40px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs"
                                                                    >
                                                                        {Array.from({ length: 5 }, (_, i) => {
                                                                            const year = new Date().getFullYear() - 2 + i;
                                                                            return (
                                                                                <option key={year} value={year}>
                                                                                    {year}
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                    <p className="text-xs text-gray-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                                                        <strong>ملاحظة:</strong> سيتم تقسيم المبلغ ({paymentInfo.amount ? `$${parseFloat(paymentInfo.amount).toLocaleString()}` : '$0'}) بالتساوي على 12 شهر ({paymentInfo.amount ? `$${(parseFloat(paymentInfo.amount) / 12).toFixed(2)}` : '$0'} لكل شهر) وتمييز جميع الأشهر كمدفوعة تلقائياً.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                         </>
                    )}

                    {type === TransactionType.Expense && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">ربط المصروف بيتيم (اختياري)</label>
                            <select value={selectedOrphanId} onChange={(e) => setSelectedOrphanId(e.target.value)} className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3">
                                <option value="">-- لا يوجد --</option>
                                {orphans.map(orphan => (
                                    <option key={orphan.id} value={orphan.id}>{orphan.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="البيان (اختياري)" className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3" autoFocus/>
                    {!(type === TransactionType.Income && donationCategory === 'كفالة يتيم') && (
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="المبلغ"
                            dir="ltr"
                            className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                            required
                        />
                    )}
                    </div>
                    <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 bg-white px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:flex-row md:justify-end md:px-6 md:pb-4">
                        <button type="button" onClick={resetForm} className="min-h-[48px] rounded-xl bg-gray-100 px-5 py-2 font-semibold text-text-secondary hover:bg-gray-200">إلغاء</button>
                        <button 
                            type="submit" 
                            disabled={!isFormValid || isSubmitting}
                            className={`min-h-[48px] rounded-xl px-5 py-2 font-semibold transition-colors ${
                                isFormValid && !isSubmitting
                                    ? 'bg-primary text-white hover:bg-primary-hover cursor-pointer' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {isSubmitting ? 'جاري الحفظ...' : (type === TransactionType.Income ? 'تسجيل الدفعة وإصدار إيصال' : 'حفظ')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
};

type EditingPaymentState = {
    orphanId: string;
    orphanName: string;
    month: number;
    year: number;
    amount: number;
    selectedStatus: ManualPaymentStatus;
    currentStatus?: PaymentStatus;
    hasExistingPayment: boolean;
    isPaidLocked: boolean;
};

const PaymentMonthEditorModal: React.FC<{
    editingPayment: EditingPaymentState | null;
    onClose: () => void;
    onChange: (next: EditingPaymentState) => void;
    onSave: () => void;
}> = ({ editingPayment, onClose, onChange, onSave }) => {
    const isOpen = !!editingPayment;
    useBodyScrollLock(isOpen);

    if (!editingPayment) return null;

    const canEditAmount =
        editingPayment.selectedStatus === PaymentStatus.Due ||
        editingPayment.selectedStatus === PaymentStatus.Overdue;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4" onClick={onClose}>
            <div className="flex h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-xl md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="border-b border-gray-100 px-4 py-4 md:px-6">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-primary">{editingPayment.orphanName}</p>
                            <h3 className="mt-1 text-lg font-bold text-gray-900 md:text-xl">
                                تعديل حالة {ARABIC_MONTH_NAMES[editingPayment.month]} {editingPayment.year}
                            </h3>
                        </div>
                        <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800" aria-label="إغلاق">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
                    {editingPayment.currentStatus && (
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-sm text-gray-600">الحالة الحالية</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                                <PaymentStatusBadge status={editingPayment.currentStatus} />
                                <span className="text-sm font-semibold text-gray-700">
                                    {editingPayment.amount > 0 ? `$${editingPayment.amount.toLocaleString()}` : 'بدون مبلغ محدد'}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                        <p className="font-semibold">تنبيه للفريق</p>
                        <p className="mt-1">
                            تغيير الحالة هنا ينعكس عند الكافل وقد يرسل له إشعاراً. حالة <span className="font-semibold">مدفوع</span> لا تُضبط من هنا، بل من خلال إضافة حركة مالية فقط.
                        </p>
                    </div>

                    {editingPayment.isPaidLocked ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            <p className="font-semibold">هذا الشهر مدفوع بالفعل.</p>
                            <p className="mt-1">
                                لتعديل المبلغ أو تصحيح هذا الشهر، احذف الحركة المالية التي سجلته ثم أضف الحركة الصحيحة بدلاً منها.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">الحالة</label>
                                <select
                                    value={editingPayment.selectedStatus}
                                    onChange={(e) => onChange({
                                        ...editingPayment,
                                        selectedStatus: e.target.value as ManualPaymentStatus,
                                    })}
                                    className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
                                >
                                    {MANUAL_PAYMENT_STATUSES.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-sm font-medium text-gray-700">المبلغ</label>
                                    <span className="text-xs text-gray-500">قابل للتعديل فقط في مستحق أو متأخر</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editingPayment.amount}
                                    disabled={!canEditAmount}
                                    onChange={(e) => {
                                        const nextAmount = parseFloat(e.target.value);
                                        onChange({
                                            ...editingPayment,
                                            amount: Number.isNaN(nextAmount) ? 0 : nextAmount,
                                        });
                                    }}
                                    className={`min-h-[48px] w-full rounded-xl border px-4 py-3 text-sm ${canEditAmount ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-100 text-gray-500'}`}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-white px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:flex-row md:justify-end md:px-6 md:pb-4">
                    <button type="button" onClick={onClose} className="min-h-[48px] rounded-xl bg-gray-100 px-5 py-2 font-semibold text-text-secondary hover:bg-gray-200">
                        {editingPayment.isPaidLocked ? 'إغلاق' : 'إلغاء'}
                    </button>
                    {!editingPayment.isPaidLocked && (
                        <button type="button" onClick={onSave} className="min-h-[48px] rounded-xl bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-hover">
                            حفظ التغييرات
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


const ReceiptModal: React.FC<{ transaction: FinancialTransaction | null; onClose: () => void; }> = ({ transaction, onClose }) => {
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!transaction || !transaction.receipt) return null;
    
    const { receipt } = transaction;

    const handleExportPDF = () => {
        const input = receiptRef.current;
        if(input) {
            html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`ايصال-${receipt.transactionId}.pdf`);
            });
        }
    };
    
    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4" onClick={onClose}>
            <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-xl md:h-auto md:max-h-[95vh] md:max-w-lg md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 md:hidden">
                    <h3 className="text-lg font-bold text-gray-900">إيصال التبرع</h3>
                    <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800" aria-label="إغلاق">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <div id="printable-receipt" ref={receiptRef} className="flex-1 overflow-y-auto bg-white p-4 text-text-primary md:p-8">
                    <div className="border-b-2 border-primary pb-4 mb-6 text-center">
                        <h2 className="text-3xl font-bold text-primary">إيصال تبرع</h2>
                        <p className="text-sm text-text-secondary">منصة يتيم لرعاية الأيتام</p>
                    </div>
                    <div className="flex justify-between mb-6 text-sm">
                        <div>
                            <p><strong>رقم الإيصال:</strong> {receipt.transactionId}</p>
                            <p><strong>التاريخ:</strong> {ensureDate(receipt.date)?.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) ?? '-'}</p>
                        </div>
                        <div className="text-left">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-primary inline-block">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                            </svg>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                        <p><strong>استلمنا من السيد/السيدة:</strong> <span className="font-semibold text-lg">{receipt.sponsorName}</span></p>
                        <p><strong>مبلغ وقدره:</strong> <span className="font-semibold text-lg">${receipt.amount.toLocaleString()}</span></p>
                        <p><strong>وذلك عن:</strong> <span className="font-semibold">[{receipt.donationCategory}] - {receipt.description}</span></p>
                    </div>
                    <div className="flex justify-between items-end text-sm">
                        <div>
                            <p>المستلم: خالد الغامدي</p>
                            <p className="mt-4 border-t-2 border-dashed w-32 pt-1">توقيع المستلم</p>
                        </div>
                        <div className="text-center">
                            <p className="font-bold">شكراً لمساهمتكم</p>
                        </div>
                    </div>
                </div>
                 <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-100 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:flex-row md:justify-end md:rounded-b-2xl md:pb-4">
                    <button onClick={onClose} className="min-h-[48px] rounded-xl bg-gray-200 px-5 py-2 font-semibold text-text-secondary hover:bg-gray-300">إغلاق</button>
                    <button onClick={() => window.print()} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary-light px-5 py-2 font-semibold text-primary transition-colors hover:bg-primary hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        طباعة
                    </button>
                    <button onClick={handleExportPDF} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-hover">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        PDF
                    </button>
                </div>
            </div>
        </div>
    );
};


const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="flex items-center gap-3 rounded-2xl bg-bg-card p-3 shadow-sm md:gap-4 md:p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl md:h-12 md:w-12 ${color}`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-xs text-text-secondary md:text-sm">{title}</p>
            <p className="text-lg font-bold md:text-2xl">{value}</p>
        </div>
    </div>
);

const TrendsChart: React.FC = () => {
    const data = {
        labels: ['يناير', 'مارس', 'مايو', 'يوليو', 'سبتمبر', 'نوفمبر'],
        datasets: [
            {
                label: 'إيرادات',
                data: [1200, 1900, 3000, 5000, 2000, 3000].map(v => v * 1.5), // Example data
                backgroundColor: '#10B981',
                borderRadius: 6,
            },
            {
                label: 'مصروفات',
                data: [800, 1200, 2500, 4000, 1500, 2200].map(v => v * 1.2), // Example data
                backgroundColor: '#EF4444',
                borderRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'end' as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 20,
                    font: { family: 'Tajawal' }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        return `${context.dataset.label}: $${context.formattedValue}`;
                    }
                }
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: { 
                beginAtZero: true, 
                grid: { color: '#e5e7eb' },
                ticks: {
                    callback: function(value: any) {
                        return '$' + value;
                    }
                }
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    return (
        <div className="h-[290px] rounded-2xl bg-bg-card p-4 shadow-sm md:h-[350px] md:p-6">
            <h3 className="mb-4 text-base font-bold md:text-lg">توجهات الإيرادات والمصروفات</h3>
            <Bar data={data} options={options} />
        </div>
    );
};

const IncomeSourceChart: React.FC = () => {
    const data = {
        labels: ['تبرعات الكفلاء', 'منظمات خارجية'],
        datasets: [{
            data: [1600, 1000],
            backgroundColor: ['#8c1c3e', '#fbe9ef'],
            borderColor: '#fff',
            borderWidth: 2,
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    font: { family: 'Tajawal' }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        return `${context.label}: $${context.formattedValue}`;
                    }
                }
            }
        }
    };

    return (
        <div className="h-[290px] rounded-2xl bg-bg-card p-4 shadow-sm md:h-[350px] md:p-6">
            <h3 className="mb-4 text-base font-bold md:text-lg">مصادر الإيرادات</h3>
            <Pie data={data} options={options} />
        </div>
    );
}

const StatusPill: React.FC<{ status: TransactionStatus }> = ({ status }) => {
    const styles = {
        [TransactionStatus.Completed]: 'bg-green-100 text-green-800',
        [TransactionStatus.Pending]: 'bg-yellow-100 text-yellow-800',
        [TransactionStatus.Rejected]: 'bg-red-100 text-red-800',
    };
    return (
        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${styles[status]}`}>
            {status}
        </span>
    );
};


const FinancialSystem: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const fromDateRef = useRef<HTMLInputElement>(null);
    const toDateRef = useRef<HTMLInputElement>(null);
    const transactionsSectionRef = useRef<HTMLDivElement>(null);
    const orphanPaymentsSectionRef = useRef<HTMLDivElement>(null);
    const { canCreateExpense, canViewFinancials, userProfile } = useAuth();
    const { sponsors: sponsorsData, refetch: refetchSponsors } = useSponsorsBasic();
    const { orphans: orphansData, refetch: refetchOrphans } = useOrphansBasic();
    const { 
        transactions, 
        loading: transactionsLoading, 
        addTransaction: addTransactionToDB, 
        addSponsor: addSponsorToDB, 
        refetch: refetchTransactions,
        approveTransaction,
        rejectTransaction,
        deleteTransaction,
        canApproveExpense,
        canEditTransactions,
        canCreateExpenseDirectly,
    } = useFinancialTransactions();
    const [sponsorsList, setSponsorsList] = useState(sponsorsData);
    
    // Filter states
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('كل الأنواع');
    const [statusFilter, setStatusFilter] = useState<string>('كل الحالات');
    const [activeMonthFilter, setActiveMonthFilter] = useState<string>('هذا العام');
    
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [receiptToShow, setReceiptToShow] = useState<FinancialTransaction | null>(null);
    const [transactionToReject, setTransactionToReject] = useState<FinancialTransactionWithApproval | null>(null);
    const [transactionToApprove, setTransactionToApprove] = useState<FinancialTransactionWithApproval | null>(null);
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
    
    // Orphan payments states
    const [expandedOrphans, setExpandedOrphans] = useState<Set<string>>(new Set());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [editingPayment, setEditingPayment] = useState<EditingPaymentState | null>(null);
    
    // Navigation state
    const [activeSection, setActiveSection] = useState<'transactions' | 'orphan-payments'>('transactions');
    const [isScrolling, setIsScrolling] = useState(false);
    
    // Pagination state
    const [showMoreClicked, setShowMoreClicked] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const initialItemsToShow = 3;
    const selectedOrphanId = useMemo(
        () => parseFinancialSystemOrphanId(searchParams.get(FINANCIAL_SYSTEM_ORPHAN_PARAM)),
        [searchParams]
    );
    const selectedOrphan = useMemo(
        () => orphansData.find((orphan) => orphan.id === selectedOrphanId) ?? null,
        [orphansData, selectedOrphanId]
    );

    const updateOrphanFilter = (nextOrphanId: number | null) => {
        const nextParams = new URLSearchParams(searchParams);

        if (nextOrphanId) {
            nextParams.set(FINANCIAL_SYSTEM_ORPHAN_PARAM, String(nextOrphanId));
        } else {
            nextParams.delete(FINANCIAL_SYSTEM_ORPHAN_PARAM);
        }

        setSearchParams(nextParams);
    };
    
    useEffect(() => {
        if (sponsorsData) {
            setSponsorsList(sponsorsData);
        }
    }, [sponsorsData]);

    useEffect(() => {
        if (!selectedOrphan) {
            return;
        }

        setExpandedOrphans(new Set([selectedOrphan.uuid || selectedOrphan.id.toString()]));
    }, [selectedOrphan]);

    // Initialize default month filter on mount
    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const from = new Date(year, 0, 1);
        from.setHours(0, 0, 0, 0);
        const to = new Date(today);
        to.setHours(23, 59, 59, 999);
        
        setFromDate(from.toISOString().split('T')[0]);
        setToDate(to.toISOString().split('T')[0]);
    }, []);

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActionMenuOpen(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Intersection Observer for scroll detection
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-100px 0px -60% 0px', // Account for sticky nav height
            threshold: [0, 0.1, 0.5, 1]
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            if (isScrolling) return; // Don't update during programmatic scrolling
            
            // Find the most visible section
            const visibleSections = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

            if (visibleSections.length > 0) {
                const mostVisible = visibleSections[0];
                if (mostVisible.target === transactionsSectionRef.current) {
                    setActiveSection('transactions');
                } else if (mostVisible.target === orphanPaymentsSectionRef.current) {
                    setActiveSection('orphan-payments');
                }
            }
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Small delay to ensure refs are set
        const timeoutId = setTimeout(() => {
            if (transactionsSectionRef.current) {
                observer.observe(transactionsSectionRef.current);
            }
            if (orphanPaymentsSectionRef.current) {
                observer.observe(orphanPaymentsSectionRef.current);
            }
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            observer.disconnect();
        };
    }, [isScrolling]);

    const handleApprove = async () => {
        if (!transactionToApprove) return;
        const result = await approveTransaction(transactionToApprove.id);
        if (!result.success) {
            alert(result.error || 'حدث خطأ أثناء الموافقة');
        } else {
            setTransactionToApprove(null);
        }
    };

    const handleReject = async (reason: string) => {
        if (!transactionToReject) return;
        const result = await rejectTransaction(transactionToReject.id, reason);
        if (!result.success) {
            alert(result.error || 'حدث خطأ أثناء الرفض');
        }
        setTransactionToReject(null);
        setActionMenuOpen(null);
    };

    const handleDelete = async (transactionId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
        
        // Find the transaction to check if it has payment info
        const transaction = transactions.find(tx => tx.id === transactionId);
        let paymentsToRestore: Array<{
            id: string;
            amount: number | string;
            paid_transaction_id?: string | null;
            created_by_transaction_id?: string | null;
            previous_status_before_paid?: PaymentStatus | null;
            previous_amount_before_paid?: number | string | null;
        }> = [];

        if (transaction?.type === TransactionType.Income) {
            const { data: linkedPayments, error: linkedPaymentsError } = await supabase
                .from('payments')
                .select('id, amount, paid_transaction_id, created_by_transaction_id, previous_status_before_paid, previous_amount_before_paid')
                .or(`paid_transaction_id.eq.${transactionId},created_by_transaction_id.eq.${transactionId}`);

            if (linkedPaymentsError) {
                console.error('Error loading linked payments before delete:', linkedPaymentsError);
                alert('تعذر تجهيز حذف الحركة لأن حالة الأشهر المرتبطة لم تُحمّل بشكل صحيح.');
                return;
            }

            paymentsToRestore = linkedPayments || [];

            if (paymentsToRestore.length === 0 && transaction.receipt?.relatedOrphanIds?.length) {
                const transactionDate = ensureDate(transaction.date)?.toISOString().split('T')[0] ?? '';
                const legacyOrphanUuids = transaction.receipt.relatedOrphanIds
                    .map((orphanId) => orphansData.find((orphan) => orphan.id === orphanId)?.uuid)
                    .filter((uuid): uuid is string => !!uuid);

                if (transactionDate && legacyOrphanUuids.length > 0) {
                    const { data: legacyPayments, error: legacyPaymentsError } = await supabase
                        .from('payments')
                        .select('id, amount, paid_transaction_id, created_by_transaction_id, previous_status_before_paid, previous_amount_before_paid')
                        .in('orphan_id', legacyOrphanUuids)
                        .eq('paid_date', transactionDate)
                        .eq('status', PaymentStatus.Paid);

                    if (legacyPaymentsError) {
                        console.error('Error loading legacy linked payments before delete:', legacyPaymentsError);
                        alert('تعذر تجهيز حذف الحركة لأن حالة الأشهر القديمة المرتبطة لم تُحمّل بشكل صحيح.');
                        return;
                    }

                    paymentsToRestore = legacyPayments || [];
                }
            }
        }
        
        const result = await deleteTransaction(transactionId);
        if (!result.success) {
            alert(result.error || 'حدث خطأ أثناء الحذف');
            setActionMenuOpen(null);
            return;
        }
        
        // Refresh transactions to update the UI
        await refetchTransactions(false);
        
        // If this income transaction marked orphan months as paid, restore them to
        // their previous manual state or remove rows that were created from blank.
        if (transaction?.type === TransactionType.Income && paymentsToRestore.length > 0) {
            for (const payment of paymentsToRestore) {
                try {
                    if (payment.created_by_transaction_id === transactionId) {
                        const { error } = await supabase
                            .from('payments')
                            .delete()
                            .eq('id', payment.id);

                        if (error) {
                            console.error(`Error deleting payment row ${payment.id}:`, error);
                        }

                        continue;
                    }

                    const restoredAmount = payment.previous_amount_before_paid !== null && payment.previous_amount_before_paid !== undefined
                        ? parseFloat(payment.previous_amount_before_paid.toString())
                        : parseFloat(payment.amount.toString());

                    const { error } = await supabase
                        .from('payments')
                        .update({
                            status: payment.previous_status_before_paid || PaymentStatus.Due,
                            amount: restoredAmount,
                            paid_date: null,
                            paid_transaction_id: null,
                            created_by_transaction_id: null,
                            previous_status_before_paid: null,
                            previous_amount_before_paid: null,
                        })
                        .eq('id', payment.id);

                    if (error) {
                        console.error(`Error restoring payment row ${payment.id}:`, error);
                    }
                } catch (error) {
                    console.error(`Error restoring payment row ${payment.id}:`, error);
                }
            }

            await refetchOrphans();
        }
        
        setActionMenuOpen(null);
    };

    // Month filter handlers
    const handleMonthFilter = (filter: string) => {
        setActiveMonthFilter(filter);
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        
        let from: Date;
        let to: Date = new Date(today);
        to.setHours(23, 59, 59, 999);
        
        switch (filter) {
            case 'هذا الشهر':
                from = new Date(year, month, 1);
                from.setHours(0, 0, 0, 0);
                break;
            case 'آخر 3 أشهر':
                from = new Date(year, month - 2, 1);
                from.setHours(0, 0, 0, 0);
                break;
            case 'هذا العام':
            default:
                from = new Date(year, 0, 1);
                from.setHours(0, 0, 0, 0);
                break;
        }
        
        setFromDate(from.toISOString().split('T')[0]);
        setToDate(to.toISOString().split('T')[0]);
    };

    const scopedTransactions = useMemo(
        () => filterTransactionsByOrphan(transactions, selectedOrphanId),
        [transactions, selectedOrphanId]
    );

    // Filter transactions based on filter criteria
    const filteredTransactions = useMemo(() => {
        return scopedTransactions.filter(tx => {
            // Date filter
            if (fromDate) {
                const txDate = new Date(tx.date);
                const from = new Date(fromDate);
                from.setHours(0, 0, 0, 0);
                if (txDate < from) return false;
            }
            if (toDate) {
                const txDate = new Date(tx.date);
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                if (txDate > to) return false;
            }
            
            // Type filter
            if (typeFilter !== 'كل الأنواع') {
                if (typeFilter === 'إيرادات' && tx.type !== TransactionType.Income) return false;
                if (typeFilter === 'مصروفات' && tx.type !== TransactionType.Expense) return false;
            }
            
            // Status filter
            if (statusFilter !== 'كل الحالات') {
                const statusMap: Record<string, TransactionStatus> = {
                    'مكتملة': TransactionStatus.Completed,
                    'قيد المراجعة': TransactionStatus.Pending,
                    'مرفوضة': TransactionStatus.Rejected,
                };
                if (tx.status !== statusMap[statusFilter]) return false;
            }
            
            return true;
        });
    }, [scopedTransactions, fromDate, toDate, typeFilter, statusFilter]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
        setShowMoreClicked(false);
    }, [fromDate, toDate, typeFilter, statusFilter, activeMonthFilter, selectedOrphanId]);

    // Calculate paginated transactions
    const paginatedTransactions = useMemo(() => {
        if (!showMoreClicked) {
            // Show only first 3 transactions initially
            return filteredTransactions.slice(0, initialItemsToShow);
        } else {
            // Show 10 per page
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            return filteredTransactions.slice(startIndex, endIndex);
        }
    }, [filteredTransactions, showMoreClicked, currentPage]);

    // Calculate total pages
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    const { totalIncome, totalExpenses, balance, pendingCount } = useMemo(() => {
        const income = scopedTransactions
            .filter(tx => tx.type === TransactionType.Income && tx.status === TransactionStatus.Completed)
            .reduce((sum, tx) => sum + tx.amount, 0);
        
        const expenses = scopedTransactions
            .filter(tx => tx.type === TransactionType.Expense && tx.status === TransactionStatus.Completed)
            .reduce((sum, tx) => sum + tx.amount, 0);
            
        const pending = scopedTransactions.filter(tx => tx.status === TransactionStatus.Pending).length;

        return {
            totalIncome: income,
            totalExpenses: expenses,
            balance: income - expenses,
            pendingCount: pending,
        };
    }, [scopedTransactions]);

    const handleAddSponsor = async (name: string): Promise<Sponsor> => {
        try {
            const newSponsor = await addSponsorToDB(name);
            // Refresh sponsors list
            await refetchSponsors();
            return newSponsor;
        } catch (error) {
            console.error('Error adding sponsor:', error);
            // Fallback to local state if DB operation fails
            const fallbackSponsor: Sponsor = {
                id: Date.now(),
                name,
                avatarUrl: '',
                sponsoredOrphanIds: [],
            };
            setSponsorsList(prev => [fallbackSponsor, ...prev]);
            return fallbackSponsor;
        }
    };

    const handleAddTransaction = async (data: Omit<FinancialTransaction, 'id' | 'date' | 'status'>) => {
        try {
            console.log('Adding transaction:', data);
            console.log('Receipt data:', data.receipt);
            console.log('Orphan payment months:', data.receipt?.orphanPaymentMonths);
            console.log('Related orphan IDs:', data.receipt?.relatedOrphanIds);
            
            let transactionId: string | undefined;
            try {
                transactionId = await addTransactionToDB(data);
                console.log('Transaction created with ID:', transactionId);
            } catch (dbError) {
                console.error('Database error in addTransactionToDB:', dbError);
                throw dbError;
            }
            
            if (!transactionId) {
                throw new Error('Transaction was not created - no ID returned');
            }
            
            setIsAddModalOpen(false);
            
            // Refresh transactions after closing modal to show the new transaction
            // Use false to bypass cache and force fresh fetch
            console.log('Refreshing transactions to show new transaction...');
            await refetchTransactions(false);
            console.log('Transactions refreshed');

            // If payment info is selected, mark payments as paid for related orphans
            if (data.type === TransactionType.Income && 
                data.receipt?.orphanPaymentMonths && 
                data.receipt?.relatedOrphanIds && 
                data.receipt.relatedOrphanIds.length > 0) {
                
                const paidDate = ensureDate(data.receipt.date)?.toISOString().split('T')[0] ?? '';
                const sponsorUuid = data.receipt.sponsorUuid;
                let paymentMutationErrors = false;
                
                // Update payment status for each related orphan
                for (const orphanId of data.receipt.relatedOrphanIds) {
                    const orphan = orphansData.find(o => o.id === orphanId);
                    if (!orphan || !orphan.uuid) {
                        console.warn(`Orphan ${orphanId} not found or missing UUID`);
                        continue;
                    }

                    const paymentInfo = data.receipt.orphanPaymentMonths[orphanId];
                    if (!paymentInfo) {
                        console.warn(`No payment info for orphan ${orphanId}`);
                        continue;
                    }

                    const orphanAmount = data.receipt.orphanAmounts?.[orphanId] || 50.00;

                    const coveredMonths = getCoveredMonths(paymentInfo);
                    const monthAmount = paymentInfo.isYear && coveredMonths.length > 0
                        ? orphanAmount / coveredMonths.length
                        : orphanAmount;

                    if (coveredMonths.length === 0) {
                        console.warn(`No payment info for orphan ${orphanId} - paymentType not set`);
                        continue;
                    }

                    for (const coveredMonth of coveredMonths) {
                        const dueDate = new Date(coveredMonth.year, coveredMonth.month, 1);
                        const dueDateStr = dueDate.toISOString().split('T')[0];
                        const existingPayment = orphan.payments.find(p =>
                            p.dueDate.getFullYear() === coveredMonth.year &&
                            p.dueDate.getMonth() === coveredMonth.month
                        );

                        if (existingPayment?.status === PaymentStatus.Paid) {
                            paymentMutationErrors = true;
                            console.error(`Refusing to overwrite paid month for orphan ${orphanId}, month ${coveredMonth.month}, year ${coveredMonth.year}`);
                            continue;
                        }

                        if (existingPayment) {
                            const { error } = await supabase
                                .from('payments')
                                .update({
                                    status: PaymentStatus.Paid,
                                    amount: monthAmount,
                                    paid_date: paidDate,
                                    sponsor_id: existingPayment.sponsorId ?? sponsorUuid ?? null,
                                    paid_transaction_id: transactionId,
                                    created_by_transaction_id: null,
                                    previous_status_before_paid: existingPayment.status,
                                    previous_amount_before_paid: existingPayment.amount,
                                })
                                .eq('id', existingPayment.id);

                            if (error) {
                                paymentMutationErrors = true;
                                console.error(`Error updating payment for orphan ${orphanId}, month ${coveredMonth.month}:`, error);
                            }
                        } else {
                            const { error } = await supabase
                                .from('payments')
                                .insert({
                                    orphan_id: orphan.uuid,
                                    sponsor_id: sponsorUuid ?? null,
                                    amount: monthAmount,
                                    due_date: dueDateStr,
                                    paid_date: paidDate,
                                    status: PaymentStatus.Paid,
                                    month: coveredMonth.month + 1,
                                    year: coveredMonth.year,
                                    paid_transaction_id: transactionId,
                                    created_by_transaction_id: transactionId,
                                });

                            if (error) {
                                paymentMutationErrors = true;
                                console.error(`Error creating payment for orphan ${orphanId}, month ${coveredMonth.month}:`, error);
                            }
                        }
                    }
                }
                
                // Refresh orphans to get updated payments
                await refetchOrphans();

                if (paymentMutationErrors) {
                    alert('تم تسجيل الحركة، لكن بعض الأشهر لم يتم تحديثها كما هو متوقع. راجع الأشهر المرتبطة قبل المتابعة.');
                }
            }

            // Refresh transactions to get the new one with receipt
            // Use false to bypass cache and force fresh fetch
            await refetchTransactions(false);
            
            // Find the newly added transaction to show receipt if it's income
            if (data.type === TransactionType.Income && transactionId) {
                // Use a small delay to ensure state is updated after refetch
                setTimeout(() => {
                    // Find the transaction by ID
                    const newTransaction = transactions.find(tx => tx.id === transactionId);
                    if (newTransaction && newTransaction.receipt) {
                        setReceiptToShow(newTransaction);
                    } else {
                        // Fallback: find the most recent income transaction with receipt
                        const latestIncome = transactions
                            .filter(tx => tx.type === TransactionType.Income && tx.receipt)
                            .sort((a, b) => (ensureDate(b.date)?.getTime() ?? 0) - (ensureDate(a.date)?.getTime() ?? 0))[0];
                        if (latestIncome) {
                            setReceiptToShow(latestIncome);
                        }
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            console.error('Error details:', {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                data: data
            });
            const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
            alert(`حدث خطأ أثناء إضافة الحركة المالية: ${errorMessage}. الرجاء المحاولة مرة أخرى.`);
            setIsAddModalOpen(false); // Close modal even on error
        }
    };

    const handleExport = () => {
        const headers = ['id', 'date', 'description', 'createdBy', 'amount', 'status', 'type'];
        const csvRows = [
            headers.join(','),
            ...filteredTransactions.map(tx => [
                tx.id,
                ensureDate(tx.date)?.toISOString().split('T')[0] ?? '',
                `"${tx.description.replace(/"/g, '""')}"`,
                `"${tx.createdBy}"`,
                tx.amount,
                tx.status,
                tx.type
            ].join(','))
        ];
        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute(
            'download',
            selectedOrphanId ? `faye-financials-orphan-${selectedOrphanId}.csv` : 'fay-financials.csv'
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const visibleOrphans = useMemo(() => {
        if (selectedOrphanId == null) {
            return orphansData;
        }

        return orphansData.filter((orphan) => orphan.id === selectedOrphanId);
    }, [orphansData, selectedOrphanId]);

    const transactionsEmptyStateMessage = selectedOrphanId
        ? 'لا توجد حركات مالية مرتبطة بهذا اليتيم ضمن الفلاتر الحالية'
        : transactions.length === 0
            ? 'لا توجد حركات مالية'
            : 'لا توجد نتائج تطابق الفلاتر المحددة';

    const toggleOrphanExpansion = (orphanId: string) => {
        setExpandedOrphans(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orphanId)) {
                newSet.delete(orphanId);
            } else {
                newSet.add(orphanId);
            }
            return newSet;
        });
    };

    const openPaymentEditor = (orphan: Orphan, month: number, year: number, paymentForMonth?: Payment) => {
        const currentStatus = paymentForMonth?.status;
        const selectedStatus = currentStatus === PaymentStatus.Overdue
            ? PaymentStatus.Overdue
            : currentStatus === PaymentStatus.Processing
                ? PaymentStatus.Processing
                : PaymentStatus.Due;

        setEditingPayment({
            orphanId: orphan.uuid || orphan.id.toString(),
            orphanName: orphan.name,
            month,
            year,
            amount: paymentForMonth?.amount || 50.00,
            selectedStatus,
            currentStatus,
            hasExistingPayment: !!paymentForMonth,
            isPaidLocked: currentStatus === PaymentStatus.Paid,
        });
    };

    const handleSaveEditingPayment = async () => {
        if (!editingPayment) return;

        await updatePaymentStatus(
            editingPayment.orphanId,
            editingPayment.month,
            editingPayment.year,
            editingPayment.selectedStatus,
            editingPayment.amount
        );
    };

    const updatePaymentStatus = async (orphanId: string, month: number, year: number, newStatus: ManualPaymentStatus, newAmount?: number) => {
        if (!userProfile || !canViewFinancials()) {
            alert('ليس لديك صلاحية لتعديل حالة الدفعات');
            return;
        }

        if (!MANUAL_PAYMENT_STATUSES.includes(newStatus)) {
            alert('لا يمكن تعيين الحالة إلى مدفوع من هنا. استخدم إضافة حركة مالية.');
            return;
        }

        try {
            const dueDate = new Date(year, month, 1);
            const dueDateStr = dueDate.toISOString().split('T')[0];

            // Find existing payment for this month
            const orphan = orphansData.find(o => (o.uuid || o.id.toString()) === orphanId);
            if (!orphan || !orphan.uuid) {
                alert('خطأ: لم يتم العثور على اليتيم');
                return;
            }

            const existingPayment = orphan.payments.find(p => 
                p.dueDate.getFullYear() === year &&
                p.dueDate.getMonth() === month
            );

            if (existingPayment?.status === PaymentStatus.Paid) {
                alert('هذا الشهر مدفوع بالفعل. احذف الحركة المالية ثم أضف الحركة الصحيحة إذا أردت التعديل.');
                return;
            }

            const canUpdateAmount = newStatus === PaymentStatus.Due || newStatus === PaymentStatus.Overdue;
            const amountToUse = newAmount !== undefined ? newAmount : (existingPayment?.amount || 50.00);
            const { data: sponsorLink, error: sponsorLinkError } = await supabase
                .from('sponsor_orphans')
                .select('sponsor_id')
                .eq('orphan_id', orphan.uuid)
                .limit(1)
                .maybeSingle();

            if (sponsorLinkError) {
                throw sponsorLinkError;
            }

            if (existingPayment) {
                // Update existing payment
                const updateData: any = {
                    status: newStatus,
                    paid_date: null,
                    sponsor_id: existingPayment.sponsorId ?? sponsorLink?.sponsor_id ?? null,
                    paid_transaction_id: null,
                    created_by_transaction_id: null,
                    previous_status_before_paid: null,
                    previous_amount_before_paid: null,
                };
                
                // Only due/overdue amounts are manually editable.
                if (canUpdateAmount && newAmount !== undefined) {
                    updateData.amount = amountToUse;
                }

                const { error } = await supabase
                    .from('payments')
                    .update(updateData)
                    .eq('id', existingPayment.id);

                if (error) throw error;
            } else {
                // Create new payment
                const { error } = await supabase
                    .from('payments')
                    .insert({
                        orphan_id: orphan.uuid,
                        amount: amountToUse,
                        due_date: dueDateStr,
                        sponsor_id: sponsorLink?.sponsor_id ?? null,
                        status: newStatus,
                        paid_date: null,
                        month: month + 1,
                        year,
                    });

                if (error) throw error;
            }

            // Refresh orphans to get updated payments
            await refetchOrphans();
            setEditingPayment(null);
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('حدث خطأ أثناء تحديث حالة الدفعة');
        }
    };

    const scrollToTransactions = () => {
        setIsScrolling(true);
        setActiveSection('transactions');
        transactionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => setIsScrolling(false), 1000);
    };

    const scrollToOrphanPayments = () => {
        setIsScrolling(true);
        setActiveSection('orphan-payments');
        orphanPaymentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => setIsScrolling(false), 1000);
    };

    const financialSections = [
        {
            id: 'transactions' as const,
            title: 'سجل الحركات المالية',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
        },
        {
            id: 'orphan-payments' as const,
            title: 'دفعات الأيتام',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        }
    ];

    return (
        <>
        <div className="space-y-4 pb-24 md:space-y-6 md:pb-0">
            <div>
                <h1 className="text-2xl font-bold md:text-3xl">النظام المالي</h1>
                <p className="text-sm text-text-secondary md:text-base">عرض وإدارة جميع الحركات المالية.</p>
            </div>

            {selectedOrphanId && (
                <div className={`rounded-2xl border p-4 shadow-sm ${selectedOrphan ? 'border-primary/20 bg-primary-light/40' : 'border-yellow-200 bg-yellow-50'}`}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-text-secondary">عرض مرتبط من ملف اليتيم</p>
                            {selectedOrphan ? (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-base font-bold text-gray-900 md:text-lg">{selectedOrphan.name}</span>
                                    <Link
                                        to={`/orphan/${selectedOrphan.id}`}
                                        className="text-sm font-semibold text-primary hover:text-primary-hover"
                                    >
                                        فتح ملف اليتيم
                                    </Link>
                                </div>
                            ) : (
                                <p className="text-sm font-semibold text-yellow-800">
                                    تعذر العثور على اليتيم المطلوب. يمكنك إزالة الربط والمتابعة.
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => updateOrphanFilter(null)}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            إزالة الربط
                        </button>
                    </div>
                </div>
            )}

            {/* Sticky Navigation Bar */}
            <div className="sticky top-16 z-30 -mx-4 border-b border-gray-200 bg-white px-4 shadow-sm md:mx-0 md:px-0">
                <div className="overflow-x-auto border-b border-gray-200">
                    <nav className="flex min-w-max gap-2 pb-1" role="tablist">
                        {financialSections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => {
                                    if (section.id === 'transactions') {
                                        scrollToTransactions();
                                    } else {
                                        scrollToOrphanPayments();
                                    }
                                }}
                                role="tab"
                                aria-selected={activeSection === section.id}
                                className={`flex min-h-[48px] items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap md:text-base ${
                                    activeSection === section.id
                                        ? 'border-primary text-primary bg-primary/5'
                                        : 'border-transparent text-text-secondary hover:text-primary hover:border-gray-300'
                                }`}
                            >
                                <span className="flex-shrink-0">{section.icon}</span>
                                <span>{section.title}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="space-y-3 md:space-y-4">
                <h2 className="text-lg font-bold md:text-xl">لوحة التحكم المالية</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                     <StatCard title="الرصيد" value={`$${balance.toLocaleString()}`} color="bg-blue-100" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z"/></svg>} />
                    <StatCard title="إجمالي الإيرادات" value={`$${totalIncome.toLocaleString()}`} color="bg-green-100" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>} />
                    <StatCard title="إجمالي المصروفات" value={`$${totalExpenses.toLocaleString()}`} color="bg-red-100" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>} />
                    <StatCard title="قيد المراجعة" value={pendingCount.toString()} color="bg-yellow-100" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                <div className="lg:col-span-2">
                    <TrendsChart />
                </div>
                <div>
                    <IncomeSourceChart />
                </div>
            </div>
            
            <div ref={transactionsSectionRef} className="rounded-2xl bg-bg-card p-4 shadow-sm md:p-6">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-lg font-bold md:text-xl">سجل الحركات المالية</h2>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                        <button onClick={() => setIsAddModalOpen(true)} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-bold text-white hover:bg-primary-hover">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            إضافة حركة
                        </button>
                        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:px-0 sm:pb-0">
                            <button 
                                onClick={() => handleMonthFilter('هذا العام')}
                                className={`min-h-[44px] shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                                    activeMonthFilter === 'هذا العام' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                                }`}
                            >
                                هذا العام
                            </button>
                            <button 
                                onClick={() => handleMonthFilter('آخر 3 أشهر')}
                                className={`min-h-[44px] shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                                    activeMonthFilter === 'آخر 3 أشهر' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                                }`}
                            >
                                آخر 3 أشهر
                            </button>
                            <button 
                                onClick={() => handleMonthFilter('هذا الشهر')}
                                className={`min-h-[44px] shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                                    activeMonthFilter === 'هذا الشهر' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                                }`}
                            >
                                هذا الشهر
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-3 border-b pb-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr),minmax(0,1fr),minmax(0,1fr),180px,180px,auto]">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="orphan-filter" className="text-sm font-medium text-gray-700">اليتيم</label>
                        <select
                            id="orphan-filter"
                            value={selectedOrphanId?.toString() ?? ''}
                            onChange={(e) => updateOrphanFilter(e.target.value ? parseInt(e.target.value, 10) : null)}
                            className="min-h-[48px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-primary focus:ring-primary"
                        >
                            <option value="">كل الأيتام</option>
                            {orphansData.map((orphan) => (
                                <option key={orphan.id} value={orphan.id}>
                                    {orphan.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="from-date" className="text-sm font-medium text-gray-700">من</label>
                        <input 
                            type="date" 
                            id="from-date" 
                            ref={fromDateRef}
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                setActiveMonthFilter('');
                            }}
                            className="min-h-[48px] rounded-xl border border-gray-300 bg-white px-4 py-3"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="to-date" className="text-sm font-medium text-gray-700">إلى</label>
                        <input 
                            type="date" 
                            id="to-date" 
                            ref={toDateRef}
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                setActiveMonthFilter('');
                            }}
                            className="min-h-[48px] rounded-xl border border-gray-300 bg-white px-4 py-3"
                        />
                    </div>
                    <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="min-h-[48px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-primary focus:ring-primary"
                    >
                        <option>كل الأنواع</option>
                        <option>إيرادات</option>
                        <option>مصروفات</option>
                    </select>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="min-h-[48px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-primary focus:ring-primary"
                    >
                        <option>كل الحالات</option>
                        <option>مكتملة</option>
                        <option>قيد المراجعة</option>
                        <option>مرفوضة</option>
                    </select>
                    <button className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600" onClick={handleExport}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        تصدير
                    </button>
                </div>

                <div className="space-y-3 md:hidden">
                    {transactionsLoading ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-text-secondary">
                            جاري التحميل...
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-text-secondary">
                            {transactionsEmptyStateMessage}
                        </div>
                    ) : (
                        paginatedTransactions.map(tx => {
                            const txWithApproval = tx as FinancialTransactionWithApproval;
                            const isPending = tx.status === TransactionStatus.Pending;
                            const isRejected = tx.status === TransactionStatus.Rejected;

                            return (
                                <div key={tx.id} className="rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start gap-2">
                                                <h3 className="text-sm font-bold leading-6 text-gray-800">{tx.description}</h3>
                                                {tx.receipt && (
                                                    <button onClick={() => setReceiptToShow(tx)} title="عرض الإيصال" className="mt-0.5 shrink-0 text-primary hover:text-primary-hover">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                                    </button>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-text-secondary">{ensureDate(tx.date)?.toLocaleDateString('en-CA') ?? '-'}</p>
                                        </div>
                                        <StatusPill status={tx.status} />
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-[11px] text-gray-500">أنشئت بواسطة</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-800">{tx.createdBy}</p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-[11px] text-gray-500">المبلغ</p>
                                            <p className={`mt-1 text-sm font-bold ${tx.type === TransactionType.Income ? 'text-green-600' : 'text-red-600'}`}>${tx.amount.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {tx.receipt && tx.receipt.orphanPaymentMonths && tx.receipt.relatedOrphanIds && tx.receipt.relatedOrphanIds.length > 0 && (
                                        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
                                            <div className="font-semibold">الكافل: {tx.receipt.sponsorName}</div>
                                            <div className="mt-2 space-y-1 text-gray-600">
                                                {tx.receipt.relatedOrphanIds.map(orphanId => {
                                                    const orphan = orphansData.find(o => o.id === orphanId);
                                                    const paymentInfo = tx.receipt?.orphanPaymentMonths?.[orphanId];
                                                    if (!paymentInfo || !orphan) return null;

                                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                                    const paymentText = paymentInfo.isYear
                                                        ? `سنة ${paymentInfo.year} كاملة`
                                                        : paymentInfo.month !== undefined
                                                            ? `${monthNames[paymentInfo.month]} ${paymentInfo.year}`
                                                            : '';

                                                    return (
                                                        <div key={orphanId}>
                                                            <span className="font-medium">{orphan.name}</span>: {paymentText}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {(txWithApproval.approvedBy || txWithApproval.rejectedBy || (isRejected && txWithApproval.rejectionReason)) && (
                                        <div className="mt-3 space-y-1 text-xs">
                                            {txWithApproval.approvedBy && <p className="text-green-600">وافق عليها: {txWithApproval.approvedBy}</p>}
                                            {txWithApproval.rejectedBy && <p className="text-red-600">رفضها: {txWithApproval.rejectedBy}</p>}
                                            {isRejected && txWithApproval.rejectionReason && <p className="text-red-500">سبب الرفض: {txWithApproval.rejectionReason}</p>}
                                        </div>
                                    )}

                                    <div className="mt-4 flex flex-col gap-2">
                                        {isPending && canApproveExpense && tx.type === TransactionType.Expense && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setTransactionToApprove(txWithApproval)}
                                                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                    موافقة
                                                </button>
                                                <button
                                                    onClick={() => setTransactionToReject(txWithApproval)}
                                                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                    رفض
                                                </button>
                                            </div>
                                        )}
                                        {canEditTransactions && (
                                            <button
                                                onClick={() => handleDelete(tx.id)}
                                                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                حذف المعاملة
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-sm text-right">
                        <thead className="text-text-secondary">
                            <tr>
                                <th className="p-3">التاريخ</th>
                                <th className="p-3">البيان</th>
                                <th className="p-3">أنشئت بواسطة</th>
                                <th className="p-3">المبلغ</th>
                                <th className="p-3">الحالة</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactionsLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-secondary">
                                        جاري التحميل...
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-secondary">
                                        {transactionsEmptyStateMessage}
                                    </td>
                                </tr>
                            ) : (
                                paginatedTransactions.map(tx => {
                                    const txWithApproval = tx as FinancialTransactionWithApproval;
                                    const isPending = tx.status === TransactionStatus.Pending;
                                    const isRejected = tx.status === TransactionStatus.Rejected;
                                    
                                    return (
                                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{ensureDate(tx.date)?.toLocaleDateString('en-CA') ?? '-'}</td>
                                        <td className="p-3 font-semibold">
                                            <div className="flex items-center gap-2">
                                                <span>{tx.description}</span>
                                                {tx.receipt && (
                                                    <button onClick={() => setReceiptToShow(tx)} title="عرض الإيصال" className="text-primary hover:text-primary-hover">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                                    </button>
                                                )}
                                                    {isRejected && txWithApproval.rejectionReason && (
                                                        <span title={`سبب الرفض: ${txWithApproval.rejectionReason}`} className="text-red-500 cursor-help">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                                        </span>
                                                    )}
                                            </div>
                                            {/* Display payment info for orphan sponsorship payments */}
                                            {tx.receipt && tx.receipt.orphanPaymentMonths && tx.receipt.relatedOrphanIds && tx.receipt.relatedOrphanIds.length > 0 && (
                                                <div className="text-xs text-blue-600 mt-1 space-y-1">
                                                    <div className="font-semibold">الكافل: {tx.receipt.sponsorName}</div>
                                                    {tx.receipt.relatedOrphanIds.map(orphanId => {
                                                        const orphan = orphansData.find(o => o.id === orphanId);
                                                        const paymentInfo = tx.receipt?.orphanPaymentMonths?.[orphanId];
                                                        if (!paymentInfo || !orphan) return null;
                                                        
                                                        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                                        
                                                        let paymentText = '';
                                                        if (paymentInfo.isYear) {
                                                            paymentText = `سنة ${paymentInfo.year} كاملة`;
                                                        } else if (paymentInfo.month !== undefined) {
                                                            paymentText = `${monthNames[paymentInfo.month]} ${paymentInfo.year}`;
                                                        }
                                                        
                                                        return (
                                                            <div key={orphanId} className="text-gray-600">
                                                                <span className="font-medium">{orphan.name}</span>: {paymentText}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                                {txWithApproval.approvedBy && (
                                                    <div className="text-xs text-green-600 mt-1">وافق عليها: {txWithApproval.approvedBy}</div>
                                                )}
                                                {txWithApproval.rejectedBy && (
                                                    <div className="text-xs text-red-600 mt-1">رفضها: {txWithApproval.rejectedBy}</div>
                                                )}
                                        </td>
                                        <td className="p-3 text-text-secondary">{tx.createdBy}</td>
                                        <td className={`p-3 font-bold ${tx.type === TransactionType.Income ? 'text-green-600' : 'text-red-600'}`}>${tx.amount.toLocaleString()}</td>
                                        <td className="p-3"><StatusPill status={tx.status} /></td>
                                            <td className="p-3 relative">
                                                {/* Action buttons based on permissions */}
                                                {isPending && canApproveExpense && tx.type === TransactionType.Expense && (
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => setTransactionToApprove(txWithApproval)}
                                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                                                            title="موافقة"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                            موافقة
                                                        </button>
                                                        <button 
                                                            onClick={() => setTransactionToReject(txWithApproval)}
                                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                                                            title="رفض"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                            رفض
                                                        </button>
                                                    </div>
                                                )}
                                                {/* Action menu for edit/delete */}
                                                {canEditTransactions && (
                                                    <div className="relative inline-block">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActionMenuOpen(actionMenuOpen === tx.id ? null : tx.id);
                                                            }}
                                                            className="text-text-secondary hover:text-primary p-1"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                                        </button>
                                                        {actionMenuOpen === tx.id && (
                                                            <div className="absolute end-0 top-full z-10 mt-1 min-w-[120px] rounded-lg border border-gray-200 bg-white shadow-lg">
                                                                <button 
                                                                    onClick={() => handleDelete(tx.id)}
                                                                    className="w-full px-4 py-2 text-right text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                                    حذف
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Show More Button or Pagination Controls */}
                {filteredTransactions.length > initialItemsToShow && (
                    <div className="mt-4 flex flex-col items-center gap-4">
                        {!showMoreClicked ? (
                            <button
                                onClick={() => {
                                    setShowMoreClicked(true);
                                    setCurrentPage(1);
                                }}
                                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold transition-colors"
                            >
                                عرض المزيد
                            </button>
                        ) : (
                            <div className="flex flex-col items-center gap-4 w-full">
                                {/* Pagination Info */}
                                <div className="text-sm text-text-secondary">
                                    عرض {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} من {filteredTransactions.length}
                                </div>
                                
                                {/* Pagination Controls */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                            currentPage === 1
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-primary text-white hover:bg-primary-hover'
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                    </button>
                                    
                                    {/* Page Numbers */}
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum: number;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                                                        currentPage === pageNum
                                                            ? 'bg-primary text-white'
                                                            : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                            currentPage === totalPages
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-primary text-white hover:bg-primary-hover'
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Orphan Payments Section */}
            <div ref={orphanPaymentsSectionRef} className="rounded-2xl bg-bg-card p-4 shadow-sm md:p-6">
                <h2 className="mb-4 text-lg font-bold md:text-xl">دفعات الأيتام</h2>
                <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                    <p className="font-semibold">قاعدة العمل على الدفعات الشهرية</p>
                    <p className="mt-1">
                        من هنا يمكن تعديل الحالات التشغيلية فقط: مستحق، متأخر، قيد المعالجة. حالة مدفوع تُسجل فقط من نافذة إضافة حركة مالية، وأي تعديل هنا ينعكس عند الكافل وقد يرسل له إشعاراً.
                    </p>
                </div>
                
                {visibleOrphans.length === 0 ? (
                    <div className="py-8 text-center text-text-secondary">
                        {selectedOrphanId ? 'لا يوجد يتيم مطابق لهذا الربط' : 'لا توجد أيتام مسجلة'}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {visibleOrphans.map(orphan => {
                            const isExpanded = expandedOrphans.has(orphan.uuid || orphan.id.toString());
                            const orphanPayments = orphan.payments;
                            const paidCount = orphanPayments.filter(p => p.status === PaymentStatus.Paid).length;
                            const dueCount = orphanPayments.filter(p => p.status === PaymentStatus.Due).length;
                            const overdueCount = orphanPayments.filter(p => p.status === PaymentStatus.Overdue).length;
                            const processingCount = orphanPayments.filter(p => p.status === PaymentStatus.Processing).length;
                            const totalAmount = orphanPayments.reduce((sum, p) => sum + p.amount, 0);

                            return (
                                <div key={orphan.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                    {/* Orphan Header */}
                                    <div
                                        className="cursor-pointer p-4 transition-colors hover:bg-gray-50"
                                        onClick={() => toggleOrphanExpansion(orphan.uuid || orphan.id.toString())}
                                    >
                                        <div className="flex items-start gap-3 md:items-center md:justify-between">
                                            <div className="flex min-w-0 flex-1 items-start gap-3 md:items-center md:gap-4">
                                                <Avatar src={orphan.photoUrl} name={orphan.name} size="lg" className="h-14 w-14 border-2 border-gray-200 md:h-16 md:w-16" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                                                        <h3 className="truncate text-base font-bold text-gray-800 md:text-xl">{orphan.name}</h3>
                                                        <Link
                                                            to={`/orphan/${orphan.id}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-sm font-semibold text-primary hover:text-primary-hover"
                                                        >
                                                            عرض الملف الشخصي →
                                                        </Link>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <span className="inline-flex min-h-8 items-center rounded-full bg-gray-100 px-3 text-xs font-semibold text-gray-700 md:text-sm">
                                                            إجمالي الدفعات: <strong>{orphanPayments.length}</strong>
                                                        </span>
                                                        <span className="inline-flex min-h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700 md:text-sm">
                                                            المبلغ الإجمالي: <strong>${totalAmount.toLocaleString()}</strong>
                                                        </span>
                                                        {paidCount > 0 && (
                                                            <span className="inline-flex min-h-8 items-center rounded-full bg-green-50 px-3 text-xs font-semibold text-green-700 md:text-sm">
                                                                مدفوع: <strong>{paidCount}</strong>
                                                            </span>
                                                        )}
                                                        {dueCount > 0 && (
                                                            <span className="inline-flex min-h-8 items-center rounded-full bg-yellow-50 px-3 text-xs font-semibold text-yellow-700 md:text-sm">
                                                                مستحق: <strong>{dueCount}</strong>
                                                            </span>
                                                        )}
                                                        {overdueCount > 0 && (
                                                            <span className="inline-flex min-h-8 items-center rounded-full bg-red-50 px-3 text-xs font-semibold text-red-700 md:text-sm">
                                                                متأخر: <strong>{overdueCount}</strong>
                                                            </span>
                                                        )}
                                                        {processingCount > 0 && (
                                                            <span className="inline-flex min-h-8 items-center rounded-full bg-blue-50 px-3 text-xs font-semibold text-blue-700 md:text-sm">
                                                                قيد المعالجة: <strong>{processingCount}</strong>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                >
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 12-Month Calendar View */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-200 bg-gray-50 p-3 md:p-4">
                                            <div className="max-w-4xl mx-auto">
                                                {orphanPayments.length === 0 && (
                                                    <div className="mb-4 rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                                                        لا توجد دفعات مسجلة بعد لهذا اليتيم. ابدأ من أحد الأشهر أدناه لتحديد الحالة الأولية قبل إضافة أي حركة مالية.
                                                    </div>
                                                )}
                                                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                    <h4 className="text-base font-bold text-gray-800 md:text-lg">
                                                        تقويم الدفعات
                                                    </h4>
                                                    <select
                                                        value={selectedYear}
                                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                        className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary md:w-auto md:min-w-[180px]"
                                                    >
                                                        {Array.from({ length: 10 }, (_, i) => {
                                                            const year = 2020 + i;
                                                            return (
                                                                <option key={year} value={year}>
                                                                    {year}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
                                                <div className="-mx-1 overflow-x-auto px-1 pb-2 md:mx-0 md:px-0 md:pb-0">
                                                <div className="flex gap-3 md:grid md:grid-cols-4">
                                                    {Array.from({ length: 12 }, (_, i) => {
                                                        const month = new Date(selectedYear, i, 1);
                                                        const paymentForMonth = orphanPayments.find(p => 
                                                            p.dueDate.getFullYear() === month.getFullYear() &&
                                                            p.dueDate.getMonth() === month.getMonth()
                                                        );

                                                        const getStatusForMonth = () => {
                                                            if (!paymentForMonth) {
                                                                return { 
                                                                    status: 'فارغ', 
                                                                    textColor: 'text-gray-500',
                                                                    bgColor: 'bg-white',
                                                                    amount: null
                                                                };
                                                            }

                                                            switch (paymentForMonth.status) {
                                                                case PaymentStatus.Paid:
                                                                    return { 
                                                                        status: 'مدفوع', 
                                                                        textColor: 'text-green-700',
                                                                        bgColor: 'bg-green-100',
                                                                        amount: paymentForMonth.amount
                                                                    };
                                                                case PaymentStatus.Due:
                                                                    return { 
                                                                        status: 'مستحق', 
                                                                        textColor: 'text-yellow-700',
                                                                        bgColor: 'bg-yellow-100',
                                                                        amount: paymentForMonth.amount
                                                                    };
                                                                case PaymentStatus.Overdue:
                                                                    return { 
                                                                        status: 'متأخر', 
                                                                        textColor: 'text-red-700',
                                                                        bgColor: 'bg-red-100',
                                                                        amount: paymentForMonth.amount
                                                                    };
                                                                case PaymentStatus.Processing:
                                                                    return { 
                                                                        status: 'قيد المعالجة', 
                                                                        textColor: 'text-blue-700',
                                                                        bgColor: 'bg-blue-100',
                                                                        amount: paymentForMonth.amount
                                                                    };
                                                                default:
                                                                    return { 
                                                                        status: 'غير معروف', 
                                                                        textColor: 'text-gray-500',
                                                                        bgColor: 'bg-white',
                                                                        amount: null
                                                                    };
                                                            }
                                                        };

                                                        const { status, textColor, bgColor, amount } = getStatusForMonth();

                                                        return (
                                                            <div 
                                                                key={month.getMonth()} 
                                                                className={`relative min-w-[140px] rounded-2xl border p-3 text-center shadow-sm transition-all duration-200 md:min-w-0 ${
                                                                    paymentForMonth ? 'border-transparent' : 'border-dashed border-gray-300'
                                                                } ${
                                                                    bgColor
                                                                } ${
                                                                    canViewFinancials() ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''
                                                                }`}
                                                                onClick={() => {
                                                                    if (canViewFinancials()) {
                                                                        openPaymentEditor(orphan, month.getMonth(), selectedYear, paymentForMonth);
                                                                    }
                                                                }}
                                                            >
                                                                <p className="font-semibold text-gray-800 mb-1 text-sm">
                                                                    {month.toLocaleDateString('ar-EG', { month: 'long' })}
                                                                </p>
                                                                <p className={`text-sm font-medium ${textColor} mb-1`}>
                                                                    {status}
                                                                </p>
                                                                {amount !== null && (
                                                                    <p className={`text-xs font-semibold ${textColor}`}>
                                                                        ${amount.toLocaleString()}
                                                                    </p>
                                                                )}
                                                                {canViewFinancials() && (
                                                                    <p className="text-xs text-gray-400 mt-1">
                                                                        {paymentForMonth?.status === PaymentStatus.Paid ? 'انقر لعرض التفاصيل' : paymentForMonth ? 'انقر للتعديل' : 'انقر للبدء'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
        <div className="hidden sm:hidden fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] items-center justify-around bg-white/80 p-2 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] backdrop-blur-sm z-30">
            <button onClick={() => navigate(-1)} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                <span className="text-xs">رجوع</span>
            </button>
            <button onClick={() => fromDateRef.current?.focus()} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                <span className="text-xs">تصفية</span>
            </button>
            <button onClick={handleExport} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                <span className="text-xs">تصدير</span>
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                <span className="text-xs">إضافة</span>
            </button>
        </div>
        <PaymentMonthEditorModal
            editingPayment={editingPayment}
            onClose={() => setEditingPayment(null)}
            onChange={setEditingPayment}
            onSave={handleSaveEditingPayment}
        />
        <AddTransactionModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddTransaction}
            sponsors={sponsorsList}
            orphans={orphansData}
        />
        <ReceiptModal
            transaction={receiptToShow}
            onClose={() => setReceiptToShow(null)}
        />
        <ApproveTransactionModal
            isOpen={!!transactionToApprove}
            onClose={() => setTransactionToApprove(null)}
            onApprove={handleApprove}
            transaction={transactionToApprove}
            orphans={orphansData}
        />
        <RejectTransactionModal
            isOpen={!!transactionToReject}
            onClose={() => setTransactionToReject(null)}
            onReject={handleReject}
            transactionDescription={transactionToReject?.description || ''}
        />
        </>
    );
};

export default FinancialSystem;
