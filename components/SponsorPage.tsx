import React, { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSponsorDetail } from '../hooks/useSponsors';
import { useOrphansBasic } from '../hooks/useOrphans';
import { useAuth } from '../contexts/AuthContext';
import { useFinancialTransactions } from '../hooks/useFinancialTransactions';
import { Orphan, PaymentStatus, Sponsor, TransactionType, TransactionStatus, FinancialTransaction } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AvatarUpload } from './AvatarUpload';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import { AccountAccessSection } from './account/AccountAccessSection';
import ResponsiveState from './ResponsiveState';
import { findOrCreateConversation } from '../utils/messaging';

type SponsorTab = 'overview' | 'orphans' | 'financial' | 'support';

const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

const SendMessageModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string) => Promise<void>;
    title: string;
}> = ({ isOpen, onClose, onSend, title }) => {
    const [message, setMessage] = useState('');

    const handleClose = () => {
        setMessage('');
        onClose();
    };

    const handleSend = async () => {
        if (message.trim()) {
            await onSend(message.trim());
            setMessage('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4" onClick={handleClose}>
            <div className="max-h-[92svh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white p-4 shadow-xl md:max-h-[90vh] md:max-w-lg md:rounded-xl md:p-6" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button onClick={handleClose} className="flex h-11 w-11 items-center justify-center rounded-full text-2xl font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800">
                        &times;
                    </button>
                </div>

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="min-h-[48svh] w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:min-h-32"
                    autoFocus
                />

                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                    <button type="button" onClick={handleClose} className="min-h-[44px] rounded-lg bg-gray-100 px-5 py-2 font-semibold text-text-secondary hover:bg-gray-200">
                        إلغاء
                    </button>
                    <button onClick={handleSend} disabled={!message.trim()} className="min-h-[44px] rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-400">
                        إرسال
                    </button>
                </div>
            </div>
        </div>
    );
};

const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; tone: string }> = ({ title, value, icon, tone }) => (
    <div className={`rounded-xl p-4 shadow-sm ${tone}`}>
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/70 text-current">
            {icon}
        </div>
        <p className="text-sm font-semibold opacity-80">{title}</p>
        <p className="mt-1 text-xl font-bold md:text-2xl">{value}</p>
    </div>
);

const SponsorTabButton: React.FC<{
    active: boolean;
    label: string;
    onClick: () => void;
    icon: React.ReactNode;
}> = ({ active, label, onClick, icon }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex min-h-[44px] shrink-0 snap-start items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            active
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-primary'
        }`}
    >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-current">{icon}</span>
        <span>{label}</span>
    </button>
);

const SponsorFinancialRecord: React.FC<{
    sponsor: Sponsor;
    sponsoredOrphans: Orphan[];
    sponsorTransactions: ReadonlyArray<FinancialTransaction>;
    totalDonations: number;
    paymentStats: { overdue: number; due: number };
    loading?: boolean;
    isViewingOwnPage?: boolean;
}> = ({ sponsor, sponsoredOrphans, sponsorTransactions, totalDonations, paymentStats, loading = false, isViewingOwnPage = false }) => {
    const paymentLink = isViewingOwnPage ? '/payments' : '/financial-system';
    const paymentLinkLabel = isViewingOwnPage ? 'عرض جميع الدفعات' : 'تسديد دفعة جديدة';

    return (
        <div className="rounded-xl bg-bg-card p-4 shadow-md md:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 md:mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary md:h-12 md:w-12">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z"/></svg>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800 md:text-2xl">السجل المالي الذكي</h2>
                    <p className="text-sm text-text-secondary md:text-base">نظرة شاملة على مساهمات {sponsor.name} وتأثيرها</p>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
                <SummaryCard
                    title="إجمالي التبرعات"
                    value={loading ? '—' : formatCurrency(totalDonations)}
                    icon={<span className="text-xl">💰</span>}
                    tone="bg-green-100 text-green-800"
                />
                <SummaryCard
                    title="دفعات متأخرة"
                    value={paymentStats.overdue}
                    icon={<span className="text-xl">⏳</span>}
                    tone="bg-red-100 text-red-800"
                />
                <SummaryCard
                    title="دفعات مستحقة"
                    value={paymentStats.due}
                    icon={<span className="text-xl">🔔</span>}
                    tone="bg-yellow-100 text-yellow-800"
                />
            </div>

            <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-gray-800">حالة دفعات الأيتام</h3>
                    <span className="text-xs text-text-secondary md:text-sm">يمكن التمرير أفقيًا عند الحاجة</span>
                </div>

                {sponsoredOrphans.length > 0 ? (
                    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                        <table className="min-w-[34rem] w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-right text-text-secondary">
                                    <th className="px-3 py-3 font-semibold">اليتيم</th>
                                    <th className="px-3 py-3 font-semibold">دفعات متأخرة</th>
                                    <th className="px-3 py-3 font-semibold">دفعات مستحقة</th>
                                    <th className="px-3 py-3 font-semibold">الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sponsoredOrphans.map(orphan => {
                                    const overdueCount = orphan.payments.filter(p => p.status === PaymentStatus.Overdue).length;
                                    const dueCount = orphan.payments.filter(p => p.status === PaymentStatus.Due).length;
                                    let statusText = 'جميع الدفعات مسددة';
                                    let statusColor = 'text-green-600';

                                    if (overdueCount > 0) {
                                        statusText = `لديه ${overdueCount} دفعة متأخرة`;
                                        statusColor = 'text-red-600';
                                    } else if (dueCount > 0) {
                                        statusText = `لديه ${dueCount} دفعة مستحقة`;
                                        statusColor = 'text-yellow-600';
                                    }

                                    return (
                                        <tr key={orphan.id} className="border-b border-gray-100 last:border-b-0">
                                            <td className="px-3 py-3">
                                                <Link to={isViewingOwnPage ? '/payments' : `/orphan/${orphan.id}`} className="flex items-center gap-3 font-semibold text-gray-800 transition-colors hover:text-primary">
                                                    <Avatar src={orphan.photoUrl} name={orphan.name} size="md" />
                                                    <span>{orphan.name}</span>
                                                </Link>
                                            </td>
                                            <td className="px-3 py-3 text-gray-700">{overdueCount}</td>
                                            <td className="px-3 py-3 text-gray-700">{dueCount}</td>
                                            <td className={`px-3 py-3 font-semibold ${statusColor}`}>{statusText}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-text-secondary">لا يوجد أيتام معينون لهذا الكافل بعد.</p>
                )}
            </div>

            <div className="border-t border-gray-200 pt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-bold text-gray-800">أحدث التبرعات</h3>
                    <span className="text-xs text-text-secondary md:text-sm">يمكن التمرير أفقيًا عند الحاجة</span>
                </div>

                {loading ? (
                    <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-text-secondary">جاري تحميل التبرعات المسجلة...</p>
                ) : sponsorTransactions.length > 0 ? (
                    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                        <table className="min-w-[30rem] w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-right text-text-secondary">
                                    <th className="px-3 py-3 font-semibold">الوصف</th>
                                    <th className="px-3 py-3 font-semibold">التاريخ</th>
                                    <th className="px-3 py-3 font-semibold">القيمة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sponsorTransactions.slice(0, 5).map(tx => (
                                    <tr key={tx.id} className="border-b border-gray-100 last:border-b-0">
                                        <td className="px-3 py-3 font-semibold text-gray-700">{tx.description}</td>
                                        <td className="px-3 py-3 text-gray-500">{tx.date.toLocaleDateString('ar-EG')}</td>
                                        <td className="px-3 py-3 text-base font-bold text-green-600">{formatCurrency(tx.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-text-secondary">لا توجد تبرعات مسجلة مؤخراً.</p>
                )}

                <div className="mt-4 text-center">
                    <Link to={paymentLink} className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-[1.01] hover:bg-primary-hover hover:shadow-primary/40 sm:w-auto">
                        <span>{paymentLinkLabel}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5H9a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3Z"/><path d="M6 12h12"/></svg>
                    </Link>
                </div>
            </div>
        </div>
    );
};

const SponsorPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { sponsor, assignedOrphanIds, setAssignedOrphanIds, loading: sponsorsLoading, refetch: refetchSponsors } = useSponsorDetail(id);
    const { orphans: orphansData } = useOrphansBasic();
    const { canEditOrphans, canEditSponsors, isManager, userProfile, isSystemAdmin } = useAuth();
    const { transactions: financialTransactions, loading: financialLoading } = useFinancialTransactions();
    const navigate = useNavigate();
    const receiptRef = useRef<HTMLDivElement>(null);

    const [showAssignOrphansModal, setShowAssignOrphansModal] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<SponsorTab>('overview');

    const isViewingOwnPage = useMemo(() => {
        return userProfile?.role === 'sponsor' && userProfile?.id === sponsor?.uuid;
    }, [userProfile, sponsor]);

    const showAdminAccountUi = isSystemAdmin() && !isViewingOwnPage && Boolean(sponsor?.uuid);

    const sponsoredOrphans = useMemo(() => {
        if (!sponsor || assignedOrphanIds.length === 0) return [];
        return orphansData.filter(o => o.uuid && assignedOrphanIds.includes(o.uuid));
    }, [sponsor, orphansData, assignedOrphanIds]);

    const sponsorTransactions = useMemo(() => {
        if (!sponsor) return [];
        return financialTransactions.filter(
            (tx) =>
                tx.type === TransactionType.Income &&
                tx.status === TransactionStatus.Completed &&
                tx.receipt?.sponsorName === sponsor.name
        );
    }, [financialTransactions, sponsor]);

    const totalDonations = useMemo(() => {
        return sponsorTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    }, [sponsorTransactions]);

    const paymentStats = useMemo(() => {
        let overdue = 0;
        let due = 0;

        sponsoredOrphans.forEach(orphan => {
            orphan.payments.forEach(payment => {
                if (payment.status === PaymentStatus.Overdue) overdue++;
                if (payment.status === PaymentStatus.Due) due++;
            });
        });

        return { overdue, due };
    }, [sponsoredOrphans]);

    const canAssignOrphansToSponsors = useMemo(() => {
        return isManager() || (canEditOrphans() && canEditSponsors());
    }, [isManager, canEditOrphans, canEditSponsors]);

    if (sponsorsLoading) {
        return (
            <ResponsiveState
                variant="loading"
                title="جاري تحميل ملف الكافل"
                description="نجهز البيانات المالية والملف الشخصي بتخطيط يلائم الشاشات الصغيرة."
            />
        );
    }

    if (!sponsor) {
        return (
            <ResponsiveState
                variant="error"
                title="تعذر العثور على الكافل"
                description="تأكد من صحة الرابط أو حاول العودة إلى قائمة الكفلاء."
            />
        );
    }

    const handleSendMessage = async (message: string) => {
        if (!userProfile || !sponsor.uuid) {
            alert('تعذر بدء المحادثة حالياً.');
            return;
        }

        const { conversation, error } = await findOrCreateConversation(
            userProfile.id,
            sponsor.uuid,
            userProfile.organization_id
        );

        if (error || !conversation) {
            alert('تعذر فتح المحادثة الآن. حاول مرة أخرى.');
            return;
        }

        const { error: messageError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversation.id,
                sender_id: userProfile.id,
                content: message,
            });

        if (messageError) {
            alert('تعذر إرسال الرسالة الآن. حاول مرة أخرى.');
            return;
        }

        setIsMessageModalOpen(false);
        navigate(`/messages?conversation=${conversation.id}`);
    };

    const handleExportPDF = () => {
        const input = receiptRef.current;
        if (!input) return;

        html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`ملف-الكافل-${sponsor.name}.pdf`);
        });
    };

    const overviewSection = (
        <div className="space-y-4">
            {showAdminAccountUi && sponsor.uuid && (
                <AccountAccessSection profileId={sponsor.uuid} displayName={sponsor.name} />
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SummaryCard
                    title="الأيتام المكفولون"
                    value={sponsoredOrphans.length}
                    tone="bg-primary-light text-primary"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                />
                <SummaryCard
                    title="إجمالي التبرعات"
                    value={financialLoading ? '—' : formatCurrency(totalDonations)}
                    tone="bg-green-100 text-green-800"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                />
                <SummaryCard
                    title="تنبيهات الدفعات"
                    value={paymentStats.overdue + paymentStats.due}
                    tone="bg-yellow-100 text-yellow-800"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>}
                />
            </div>

            <div className="rounded-xl bg-bg-card p-4 shadow-sm md:p-6">
                <h2 className="mb-2 text-lg font-bold text-gray-800">ملخص الكافل</h2>
                <p className="text-sm leading-7 text-text-secondary">
                    يعرض هذا الملف الأيتام المرتبطين بالكافل، وأحدث التبرعات، وروابط المتابعة السريعة في مكان واحد مهيأ للشاشات الصغيرة.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('orphans')}
                        className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-light px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        الانتقال إلى الأيتام المكفولين
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('financial')}
                        className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z"/></svg>
                        مراجعة السجل المالي
                    </button>
                </div>
            </div>
        </div>
    );

    const orphansSection = (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 md:text-2xl">الأيتام المكفولون ({sponsoredOrphans.length})</h2>
                    <p className="mt-1 text-sm text-text-secondary">بطاقات مهيأة للمس وتبقى بعمود واحد على الجوال.</p>
                </div>

                {canAssignOrphansToSponsors && (
                    <button
                        onClick={() => setShowAssignOrphansModal(true)}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        تعيين أيتام
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                {sponsoredOrphans.length > 0 ? (
                    sponsoredOrphans.map(orphan => (
                        <Link
                            key={orphan.id}
                            to={isViewingOwnPage ? '/payments' : `/orphan/${orphan.id}`}
                            className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <Avatar src={orphan.photoUrl} name={orphan.name} size="xl" />
                            <div className="min-w-0">
                                <h3 className="truncate text-base font-semibold text-gray-800 md:text-lg">{orphan.name}</h3>
                                <p className="text-sm text-text-secondary">{orphan.age} سنوات</p>
                            </div>
                        </Link>
                    ))
                ) : (
                    <p className="col-span-full rounded-xl bg-white px-4 py-8 text-center text-sm text-text-secondary shadow-sm">لا يوجد أيتام معينون لهذا الكافل</p>
                )}
            </div>
        </div>
    );

    const financialSection = (
        <SponsorFinancialRecord
            sponsor={sponsor}
            sponsoredOrphans={sponsoredOrphans}
            sponsorTransactions={sponsorTransactions}
            totalDonations={totalDonations}
            paymentStats={paymentStats}
            loading={financialLoading}
            isViewingOwnPage={isViewingOwnPage}
        />
    );

    const supportSection = (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
            <div className="relative flex flex-col items-center rounded-xl bg-yellow-50 p-5 text-center shadow-md transition-transform duration-300 hover:scale-[1.01] md:p-6">
                <div className="absolute -top-3 end-3 text-yellow-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-800 md:text-xl">تواصل معنا</h3>
                <p className="mb-4 text-sm leading-7 text-text-secondary md:text-base">
                    لأية استفسارات، نحن متواجدون من الأحد إلى الخميس، 9 صباحًا - 5 مساءً.
                </p>
                <Link to="/messages" className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-primary-hover hover:shadow-primary/40 sm:w-auto">
                    <span>التواصل عبر الرسائل</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </Link>
            </div>

            <Link to="/policies" className="relative flex flex-col items-center rounded-xl bg-blue-50 p-5 text-center shadow-md transition-transform duration-300 hover:scale-[1.01] md:p-6">
                <div className="absolute -top-3 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-sm"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" /></svg>
                </div>
                <div className="mt-4 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h3 className="mt-2 text-lg font-bold text-gray-800 md:text-xl">سياسات يتيم</h3>
                <p className="mt-1 text-sm text-text-secondary">اطلع على شروط وأحكام المنظمة</p>
            </Link>
        </div>
    );

    return (
        <>
            <SendMessageModal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                onSend={handleSendMessage}
                title={`إرسال رسالة إلى ${sponsor.name}`}
            />

            <div ref={receiptRef} className="pb-24 md:pb-0">
                <div className="space-y-6 md:space-y-8">
                    <div className="rounded-2xl bg-bg-card p-4 shadow-md md:rounded-xl md:p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                            <button onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary md:self-start">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            </button>

                            <div className="flex flex-col items-center gap-3 text-center md:flex-row md:items-center md:text-start">
                                {sponsor.uuid ? (
                                    <AvatarUpload
                                        currentAvatarUrl={sponsor.avatarUrl}
                                        userId={sponsor.uuid}
                                        type="sponsor"
                                        onUploadComplete={() => {
                                            window.location.reload();
                                        }}
                                        size="md"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-3xl font-bold text-primary-text md:h-24 md:w-24 md:text-4xl">
                                        {sponsor.name.charAt(0)}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">{sponsor.name}</h1>
                                        <p className="text-sm text-text-secondary md:text-base">كافل مميز في يتيم</p>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                                        <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary md:text-sm">
                                            {sponsoredOrphans.length} أيتام مكفولين
                                        </span>
                                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 md:text-sm">
                                            {formatCurrency(totalDonations)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row md:ms-auto">
                                <button onClick={() => setIsMessageModalOpen(true)} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-light px-4 py-2.5 font-semibold text-primary transition-colors hover:bg-primary hover:text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                    <span>إرسال رسالة</span>
                                </button>
                                <button onClick={handleExportPDF} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                    <span>تصدير</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="md:hidden">
                        <div className="-mx-3 mb-5 flex snap-x snap-mandatory overflow-x-auto border-b border-gray-200 px-3 [scrollbar-width:none]">
                            <SponsorTabButton
                                active={activeTab === 'overview'}
                                label="نظرة عامة"
                                onClick={() => setActiveTab('overview')}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
                            />
                            <SponsorTabButton
                                active={activeTab === 'orphans'}
                                label="الأيتام"
                                onClick={() => setActiveTab('orphans')}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                            />
                            <SponsorTabButton
                                active={activeTab === 'financial'}
                                label="المالية"
                                onClick={() => setActiveTab('financial')}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                            />
                            <SponsorTabButton
                                active={activeTab === 'support'}
                                label="الدعم"
                                onClick={() => setActiveTab('support')}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
                            />
                        </div>

                        {activeTab === 'overview' && overviewSection}
                        {activeTab === 'orphans' && orphansSection}
                        {activeTab === 'financial' && financialSection}
                        {activeTab === 'support' && supportSection}
                    </div>

                    <div className="hidden space-y-8 md:block">
                        {showAdminAccountUi && sponsor.uuid && (
                            <AccountAccessSection profileId={sponsor.uuid} displayName={sponsor.name} />
                        )}
                        {orphansSection}
                        {financialSection}
                        {supportSection}
                    </div>
                </div>
            </div>

            {showAssignOrphansModal && sponsor && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4" onClick={() => setShowAssignOrphansModal(false)}>
                    <div className="max-h-[92svh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white p-4 shadow-xl md:max-h-[80vh] md:max-w-2xl md:rounded-xl md:p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-4 flex items-start justify-between gap-3 border-b border-gray-200 pb-3">
                            <div>
                                <h3 className="text-xl font-bold">تعيين أيتام لـ {sponsor.name}</h3>
                                <p className="mt-1 text-sm text-text-secondary">يمكنك إدارة الارتباطات من شاشة واحدة على الجوال أو سطح المكتب.</p>
                            </div>
                            <button onClick={() => setShowAssignOrphansModal(false)} className="flex h-11 w-11 items-center justify-center rounded-full text-2xl font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800">
                                &times;
                            </button>
                        </div>

                        <div className="space-y-3">
                            {orphansData.map(orphan => {
                                const isAssigned = orphan.uuid && assignedOrphanIds.includes(orphan.uuid);
                                return (
                                    <div key={orphan.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={orphan.photoUrl} name={orphan.name} size="md" />
                                            <div>
                                                <p className="font-semibold text-gray-800">{orphan.name}</p>
                                                <p className="text-sm text-gray-500">{orphan.age} سنوات</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                if (!sponsor.uuid || !orphan.uuid) return;

                                                try {
                                                    if (isAssigned) {
                                                        const { error } = await supabase
                                                            .from('sponsor_orphans')
                                                            .delete()
                                                            .eq('sponsor_id', sponsor.uuid)
                                                            .eq('orphan_id', orphan.uuid);

                                                        if (!error) {
                                                            setAssignedOrphanIds(prev => prev.filter(currentId => currentId !== orphan.uuid));
                                                            refetchSponsors();
                                                        }
                                                    } else {
                                                        const { error } = await supabase
                                                            .from('sponsor_orphans')
                                                            .insert({
                                                                sponsor_id: sponsor.uuid,
                                                                orphan_id: orphan.uuid,
                                                            });

                                                        if (!error) {
                                                            setAssignedOrphanIds(prev => [...prev, orphan.uuid!]);
                                                            refetchSponsors();
                                                        }
                                                    }
                                                } catch (err) {
                                                    console.error('Error updating orphan-to-sponsor assignment:', err);
                                                }
                                            }}
                                            className={`min-h-[44px] rounded-lg px-4 py-2 font-semibold text-sm ${
                                                isAssigned
                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    : 'bg-primary text-white hover:bg-primary-hover'
                                            }`}
                                        >
                                            {isAssigned ? 'إلغاء التعيين' : 'تعيين'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SponsorPage;
