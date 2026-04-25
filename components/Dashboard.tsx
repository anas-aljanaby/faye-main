import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrphansBasic } from '../hooks/useOrphans';
import { useOccasions } from '../hooks/useOccasions';
import { useSponsorsBasic } from '../hooks/useSponsors';
import { useTeamMembersBasic } from '../hooks/useTeamMembers';
import { useAuth } from '../contexts/AuthContext';
import { TransactionStatus, Orphan, Sponsor, PaymentStatus, TransactionType } from '../types';
import { useFinancialTransactions } from '../hooks/useFinancialTransactions';
import { useNotifications } from '../hooks/useNotifications';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AvatarUpload } from './AvatarUpload';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import OccasionsManagementModal from './OccasionsManagementModal';
import { GoogleGenAI } from '@google/genai';
import ResponsiveState from './ResponsiveState';
import InternetRequiredState from './InternetRequiredState';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { formatTimestamp } from '../utils/messaging';
import { canAccessFinancialSystem, canAccessOrphans, canAccessSponsors } from '../lib/accessControl';

const sectionActionLinkClass = 'inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 hover:text-primary-hover md:min-h-0 md:rounded-none md:px-0 md:py-0 md:hover:bg-transparent';

const AnimatedCounter: React.FC<{ value: number; prefix?: string; suffix?: string }> = ({ value, prefix = '', suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        const duration = 800;
        const incrementTime = 20;
        const step = end === 0 ? 0 : (end / duration) * incrementTime;

        const timer = setInterval(() => {
            start += step;
            if (start >= end || step === 0) {
                setDisplayValue(end);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(start));
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [value]);

    return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

const StatWidget: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; subtext: string }> = ({ title, value, icon, color, subtext }) => (
    <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="mb-1 text-xs font-medium text-text-secondary md:text-sm">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800 md:text-3xl">
                    <AnimatedCounter value={value} />
                </h3>
            </div>
            <div className={`shrink-0 rounded-xl p-2.5 ${color} bg-opacity-20 md:p-3`}>
                {icon}
            </div>
        </div>
        <p className="text-xs text-gray-400 md:text-sm">{subtext}</p>
    </div>
);

type ActivityItem = {
    id: string;
    text: string;
    time: string;
    tone: 'success' | 'warning' | 'info';
};

const ActivityList: React.FC<{ items: ActivityItem[]; loading: boolean }> = ({ items, loading }) => {
    return (
        <div className="mt-2 space-y-3">
            {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-start gap-3 rounded-xl border-b border-gray-100 px-3 py-3 last:border-0 md:px-3.5">
                        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-gray-200" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                            <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                        </div>
                    </div>
                ))
            ) : items.length > 0 ? (
                items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-xl border-b border-gray-100 px-3 py-3 transition-colors hover:bg-gray-50 last:border-0 md:px-3.5">
                        <div className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${
                            item.tone === 'success' ? 'bg-green-500' :
                            item.tone === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold leading-6 text-gray-800 md:text-sm">{item.text}</p>
                            <p className="text-xs text-gray-400">{item.time}</p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-500">
                    لا توجد أنشطة حديثة لعرضها الآن.
                </p>
            )}
        </div>
    );
};

const AiSummaryWidget: React.FC = () => {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);

    const generateSummary = async () => {
        setLoading(true);
        try {
            const apiKey = (import.meta as any).env?.VITE_GOOGLE_GENAI_API_KEY as string | undefined;
            if (!apiKey) {
                throw new Error('Missing VITE_GOOGLE_GENAI_API_KEY');
            }

            const ai = new GoogleGenAI({ apiKey });
            const prompt = "أعطني ملخصاً تنفيذياً سريعاً ومحفزاً لمدير جمعية أيتام يوضح حالة الأيتام والكفلاء والمدفوعات بشكل عام.";

            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: prompt,
            });

            // @ts-expect-error: runtime SDK may expose text directly
            setSummary(response.text || 'تم إنشاء الملخص بنجاح، لكن تعذر عرض التفاصيل.');
        } catch (error) {
            setSummary('تعذر إنشاء الملخص حالياً. يرجى التحقق من إعداد مفتاح واجهة برمجة التطبيقات ثم المحاولة لاحقاً.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-hover p-4 text-white md:min-h-0 md:p-6">
            <div className="absolute end-0 top-0 h-28 w-28 -me-10 -mt-10 rounded-full bg-white opacity-10 blur-2xl md:h-32 md:w-32"></div>
            <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-base font-bold md:text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    رؤى ذكية
                </h3>
                <p className="min-h-[84px] text-sm leading-7 opacity-90">
                    {loading ? 'جاري التحليل...' : summary || 'اضغط على الزر للحصول على تحليل فوري للأداء العام للجمعية.'}
                </p>
            </div>
            <button 
                onClick={generateSummary}
                disabled={loading}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors backdrop-blur-sm hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-70 sm:w-max"
            >
                تحديث التحليل
            </button>
        </div>
    );
};

const AdvancedOverviewSection: React.FC<{ orphansCount: number; sponsorsCount: number }> = ({ orphansCount, sponsorsCount }) => {
    const { notifications, loading: notificationsLoading } = useNotifications();
    const { transactions, loading: transactionsLoading } = useFinancialTransactions('dashboard');

    const totalDonations = useMemo(() => {
        return transactions
            .filter((transaction) => transaction.type === TransactionType.Income && transaction.status === TransactionStatus.Completed)
            .reduce((sum, transaction) => sum + transaction.amount, 0);
    }, [transactions]);

    const recentActivities = useMemo<ActivityItem[]>(() => {
        if (notifications.length > 0) {
            return notifications.slice(0, 4).map((notification) => ({
                id: notification.id,
                text: notification.title,
                time: formatTimestamp(notification.createdAt),
                tone:
                    notification.type === 'financial_transaction_pending_approval' ||
                    notification.type === 'financial_transaction_rejected' ||
                    notification.type === 'payment_overdue'
                        ? 'warning'
                        : notification.type === 'financial_transaction_approved' || notification.type === 'payment_received'
                            ? 'success'
                            : 'info',
            }));
        }

        return transactions.slice(0, 4).map((transaction) => ({
            id: transaction.id,
            text:
                transaction.type === TransactionType.Income
                    ? `تم تسجيل تبرع جديد: ${transaction.description}`
                    : `تم تحديث معاملة مالية: ${transaction.description}`,
            time: formatTimestamp(transaction.date),
            tone:
                transaction.status === TransactionStatus.Pending || transaction.status === TransactionStatus.Rejected
                    ? 'warning'
                    : 'success',
        }));
    }, [notifications, transactions]);

    return (
        <section className="space-y-4 md:space-y-6">
            <div className="space-y-1">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-gray-800 md:text-2xl">نظرة سريعة على المؤشرات</h2>
                    <p className="text-sm text-text-secondary">ملخص حيّ يعتمد على بيانات النظام الحالية.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                <div className="rounded-2xl border border-gray-100 bg-bg-card p-4 shadow-sm md:p-5">
                    <StatWidget
                        title="إجمالي الأيتام"
                        value={orphansCount}
                        subtext="عدد السجلات النشطة في النظام حالياً"
                        color="text-primary bg-primary"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-6 md:w-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        }
                    />
                </div>
                <div className="rounded-2xl border border-gray-100 bg-bg-card p-4 shadow-sm md:p-5">
                    <StatWidget
                        title="إجمالي الكفلاء"
                        value={sponsorsCount}
                        subtext="عدد الكفلاء المرتبطين بالمنظمة"
                        color="text-blue-600 bg-blue-600"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-6 md:w-6"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        }
                    />
                </div>
                <div className="rounded-2xl border border-gray-100 bg-bg-card p-4 shadow-sm md:p-5">
                    <StatWidget
                        title="إجمالي التبرعات"
                        value={totalDonations}
                        subtext="قيمة الإيرادات المكتملة والمسجلة فعلياً"
                        color="text-green-600 bg-green-600"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-6 md:w-6"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        }
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                <AiSummaryWidget />
                <div className="rounded-2xl border border-gray-100 bg-bg-card p-4 shadow-sm md:p-5">
                    <h3 className="mb-2 text-base font-bold text-gray-800 md:text-lg">آخر الأنشطة</h3>
                    <ActivityList items={recentActivities} loading={notificationsLoading || transactionsLoading} />
                </div>
            </div>
        </section>
    );
};

const WidgetCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ title, icon, children }) => (
    <div className="h-full rounded-xl border border-gray-100 bg-bg-card p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary md:h-10 md:w-10">
                {icon}
            </div>
            <h3 className="text-base font-bold text-gray-700 md:text-lg">{title}</h3>
        </div>
        <div className="space-y-3">{children}</div>
    </div>
);

const UpcomingOccasions: React.FC<{ onViewAll: () => void }> = ({ onViewAll }) => {
    const { occasions, loading } = useOccasions();
    const { orphans } = useOrphansBasic();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = useMemo(() => {
        return occasions
            .filter(occ => {
                const occDate = new Date(occ.date);
                occDate.setHours(0, 0, 0, 0);
                return occDate >= today;
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 3);
    }, [occasions, today]);

    const getOrphanName = (occasion: typeof occasions[0]) => {
        if (occasion.occasion_type === 'organization_wide') {
            return null;
        }
        if (occasion.occasion_type === 'multi_orphan' && occasion.linked_orphans && occasion.linked_orphans.length > 0) {
            return occasion.linked_orphans.map(o => o.name).join('، ');
        }
        if (occasion.orphan_id) {
            const orphan = orphans.find(o => o.uuid === occasion.orphan_id);
            return orphan?.name || null;
        }
        return null;
    };

    const getOrphanId = (occasion: typeof occasions[0]) => {
        if (occasion.occasion_type === 'organization_wide') {
            return null;
        }
        if (occasion.occasion_type === 'multi_orphan' && occasion.linked_orphans && occasion.linked_orphans.length > 0) {
            return null; // Multiple orphans, can't link to one
        }
        if (occasion.orphan_id) {
            const orphan = orphans.find(o => o.uuid === occasion.orphan_id);
            return orphan?.id || null;
        }
        return null;
    };

    const getOccasionTypeLabel = (type: string) => {
        switch (type) {
            case 'orphan_specific':
                return 'خاص';
            case 'organization_wide':
                return 'عام';
            case 'multi_orphan':
                return 'عدة أيتام';
            default:
                return '';
        }
    };

    return (
        <WidgetCard 
            title="المناسبات القادمة" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z"/></svg>}
        >
            {loading ? (
                <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
            ) : upcoming.length > 0 ? (
                <>
                    {upcoming.map(occ => {
                        const orphanName = getOrphanName(occ);
                        const orphanId = getOrphanId(occ);
                        return (
                            <div key={occ.id} className="-mx-1 cursor-pointer rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-gray-50" onClick={onViewAll}>
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <p className="line-clamp-2 font-semibold text-gray-800">{occ.title}</p>
                                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[11px] text-blue-800">
                                        {getOccasionTypeLabel(occ.occasion_type)}
                                    </span>
                                </div>
                                {orphanName && (
                                    <p className="text-text-secondary text-sm">
                                        {orphanId ? (
                                            <>لـ <Link to={`/orphan/${orphanId}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{orphanName}</Link></>
                                        ) : (
                                            <>لـ {orphanName}</>
                                        )}
                                    </p>
                                )}
                                <p className="text-text-secondary text-xs">{occ.date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}</p>
                            </div>
                        );
                    })}
                    {occasions.filter(occ => {
                        const occDate = new Date(occ.date);
                        occDate.setHours(0, 0, 0, 0);
                        return occDate >= today;
                    }).length > 3 && (
                        <button
                            onClick={onViewAll}
                            className={`${sectionActionLinkClass} mt-2 w-full`}
                        >
                            عرض الكل ({occasions.filter(occ => {
                                const occDate = new Date(occ.date);
                                occDate.setHours(0, 0, 0, 0);
                                return occDate >= today;
                            }).length})
                        </button>
                    )}
                </>
            ) : (
                <div className="text-center">
                    <p className="text-sm text-text-secondary pt-4">لا توجد مناسبات قادمة.</p>
                    <button
                        onClick={onViewAll}
                        className={`${sectionActionLinkClass} mt-2 w-full md:w-auto`}
                    >
                        عرض جميع المناسبات
                    </button>
                </div>
            )}
        </WidgetCard>
    );
};

const PendingApprovals = () => {
    const { transactions, loading } = useFinancialTransactions('dashboard');
    const pending = transactions.filter(tx => tx.status === TransactionStatus.Pending);

    return (
        <WidgetCard title="الموافقات المالية المعلقة" icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}>
            {loading ? (
                <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
            ) : pending.length > 0 ? (
                <>
                    <p className="text-xl font-bold text-yellow-600 md:text-2xl">{pending.length} معاملات</p>
                    <p className="text-sm text-text-secondary">بإجمالي مبلغ <span className="font-semibold">${pending.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}</span></p>
                    <Link to="/financial-system" className={`${sectionActionLinkClass} mt-2 w-full md:w-auto`}>مراجعة الآن &larr;</Link>
                </>
            ) : (
                 <p className="text-sm text-center text-text-secondary pt-4">لا توجد موافقات معلقة.</p>
            )}
        </WidgetCard>
    );
};

const LatestAchievements: React.FC<{ orphans: Orphan[] }> = ({ orphans }) => {
    const latest = orphans
        .flatMap(o => o.achievements.map(ach => ({ ...ach, orphanName: o.name, orphanId: o.id })))
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 2);
        
    return (
         <WidgetCard title="أحدث الإنجازات" icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M8 21h8"/><path d="M12 17.5c-1.5 0-3-1-3-3.5V4.5A2.5 2.5 0 0 1 11.5 2h1A2.5 2.5 0 0 1 15 4.5V14c0 2.5-1.5 3.5-3 3.5Z"/></svg>}>
            {latest.length > 0 ? (
                 latest.map(ach => (
                    <div key={ach.id} className="rounded-xl bg-gray-50 p-3 text-sm">
                        <p className="line-clamp-2 text-[13px] font-semibold text-gray-800 md:text-sm">{ach.title}</p>
                        <p className="text-text-secondary">بواسطة <Link to={`/orphan/${ach.orphanId}`} className="text-primary hover:underline">{ach.orphanName}</Link></p>
                    </div>
                ))
            ) : (
                <p className="text-sm text-center text-text-secondary pt-4">لا توجد إنجازات حديثة.</p>
            )}
        </WidgetCard>
    );
};

const SponsorFinancialRecord: React.FC<{ sponsor: Sponsor; sponsoredOrphans: Orphan[] }> = ({ sponsor, sponsoredOrphans }) => {
    const { transactions } = useFinancialTransactions();

    const sponsorTransactions = useMemo(() => {
        return transactions.filter(
            tx => tx.type === TransactionType.Income && tx.receipt?.sponsorName === sponsor.name
        );
    }, [transactions, sponsor.name]);

    const totalDonations = useMemo(() => {
        return sponsorTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    }, [sponsorTransactions]);

    const paymentStats = useMemo(() => {
        let overdue = 0;
        let due = 0;
        sponsoredOrphans.forEach(orphan => {
            orphan.payments.forEach(p => {
                if (p.status === PaymentStatus.Overdue) overdue++;
                if (p.status === PaymentStatus.Due) due++;
            });
        });
        return { overdue, due };
    }, [sponsoredOrphans]);

    const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; colorClass: string; }> = ({ title, value, icon, colorClass }) => (
        <div className={`min-w-[13.5rem] shrink-0 snap-start rounded-xl border p-3.5 md:min-w-0 md:p-4 ${colorClass}`}>
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-current shadow-sm md:h-11 md:w-11">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold opacity-80 md:text-sm">{title}</p>
                    <p className="text-lg font-bold md:text-xl">{value}</p>
                </div>
            </div>
        </div>
    );

    return (
        <section className="rounded-2xl border border-gray-100 bg-bg-card p-4 shadow-sm md:p-6 md:shadow-md">
            <div className="mb-5 flex flex-col gap-4 md:mb-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3 md:items-center md:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary md:h-12 md:w-12">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 md:h-6 md:w-6"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z"/></svg>
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xl font-bold text-gray-700 md:text-2xl">السجل المالي الذكي</h2>
                        <p className="text-sm leading-6 text-text-secondary">نظرة شاملة على مساهماتك وتأثيرها</p>
                    </div>
                </div>
                <Link
                    to="/payments"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover md:w-auto"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 md:h-5 md:w-5">
                        <rect x="2" y="7" width="20" height="10" rx="2"/>
                        <path d="M6 12h.01"/>
                        <path d="M10 12h.01"/>
                        <path d="M14 12h.01"/>
                    </svg>
                    عرض جميع الدفعات
                </Link>
            </div>

            <div className="mb-6 flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0">
                <StatCard
                    title="إجمالي التبرعات"
                    value={`$${totalDonations.toLocaleString()}`}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    }
                    colorClass="border-green-100 bg-green-50 text-green-700"
                />
                <StatCard
                    title="دفعات متأخرة"
                    value={paymentStats.overdue}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    }
                    colorClass="border-red-100 bg-red-50 text-red-700"
                />
                <StatCard
                    title="دفعات مستحقة"
                    value={paymentStats.due}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    }
                    colorClass="border-yellow-100 bg-yellow-50 text-yellow-700"
                />
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
                        <h3 className="text-base font-bold text-gray-800 md:text-lg">حالة دفعات الأيتام</h3>
                        {sponsoredOrphans.length > 3 && (
                            <Link to="/payments" className={sectionActionLinkClass}>
                                عرض الكل
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </Link>
                        )}
                    </div>
                    {sponsoredOrphans.length > 0 ? (
                        <div className="grid gap-3">
                            {sponsoredOrphans.slice(0, 3).map(orphan => {
                                const overdueCount = orphan.payments.filter(p => p.status === PaymentStatus.Overdue).length;
                                const dueCount = orphan.payments.filter(p => p.status === PaymentStatus.Due).length;
                                let statusText = 'جميع الدفعات مسددة';
                                let statusBadgeClass = 'bg-green-100 text-green-700';
                                if (overdueCount > 0) {
                                    statusText = `لديه ${overdueCount} دفعة متأخرة`;
                                    statusBadgeClass = 'bg-red-100 text-red-700';
                                } else if (dueCount > 0) {
                                    statusText = `لديه ${dueCount} دفعة مستحقة`;
                                    statusBadgeClass = 'bg-yellow-100 text-yellow-700';
                                }

                                return (
                                    <Link to="/payments" key={orphan.id} className="flex min-h-11 flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5 transition-colors hover:bg-gray-100 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={orphan.photoUrl} name={orphan.name} size="md" className="!h-11 !w-11 !text-base md:!h-12 md:!w-12 md:!text-lg" />
                                            <div className="min-w-0">
                                                <p className="line-clamp-1 font-semibold text-gray-800">{orphan.name}</p>
                                                <p className="text-xs text-text-secondary">متابعة حالة الدفعات الحالية</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex min-h-11 items-center justify-center rounded-full px-3 py-2 text-center text-sm font-semibold ${statusBadgeClass}`}>
                                            {statusText}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-500">لا يوجد أيتام مكفولين</p>
                    )}
                </div>

                <div className="border-t border-gray-100 pt-5">
                    <div className="mb-3 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
                        <h3 className="text-base font-bold text-gray-800 md:text-lg">أحدث التبرعات</h3>
                        {sponsorTransactions.length > 3 && (
                            <Link to="/payments" className={sectionActionLinkClass}>
                                عرض الكل
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </Link>
                        )}
                    </div>
                    <div className="space-y-3">
                        {sponsorTransactions.length > 0 ? (
                            sponsorTransactions.slice(0, 3).map(tx => (
                                <div key={tx.id} className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                        <p className="line-clamp-2 text-sm font-semibold text-gray-700">{tx.description}</p>
                                        <p className="text-xs text-gray-500">{tx.date.toLocaleDateString('ar-EG')}</p>
                                    </div>
                                    <span className="text-base font-bold text-green-600 md:text-lg">${tx.amount.toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-500">لا توجد تبرعات مسجلة مؤخراً.</p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

const Dashboard: React.FC = () => {
    const { isOnline } = useNetworkStatus();
    const { orphans: orphansData, loading: orphansLoading } = useOrphansBasic();
    const { sponsors: sponsorsData, loading: sponsorsLoading } = useSponsorsBasic();
    const { teamMembers: teamMembersData, loading: teamMembersLoading } = useTeamMembersBasic();
    const countsLoading = orphansLoading || sponsorsLoading || teamMembersLoading;
    const { userProfile, permissions, isSystemAdmin } = useAuth();
    const receiptRef = useRef<HTMLDivElement>(null);
    const orphansSectionRef = useRef<HTMLDivElement>(null);
    const [assignedTeamMembers, setAssignedTeamMembers] = useState<Array<{ id: string; name: string; avatar_url?: string }>>([]);
    const [manager, setManager] = useState<{ id: string; name: string; avatar_url?: string } | null>(null);
    const [assignedOrphanIds, setAssignedOrphanIds] = useState<string[]>([]);
    const [isOccasionsModalOpen, setIsOccasionsModalOpen] = useState(false);
    const hasAnyCachedDashboardData = orphansData.length > 0 || sponsorsData.length > 0 || teamMembersData.length > 0;
    const accessContext = useMemo(
        () => ({
            role: userProfile?.role,
            permissions,
            isSystemAdmin: isSystemAdmin(),
        }),
        [isSystemAdmin, permissions, userProfile?.role]
    );
    const canOpenOrphans = canAccessOrphans(accessContext);
    const canOpenSponsors = canAccessSponsors(accessContext);
    const canOpenFinancials = canAccessFinancialSystem(accessContext);

    // Find the current sponsor based on user profile
    const sponsor = useMemo(() => {
        if (!userProfile || !sponsorsData.length || userProfile.role !== 'sponsor') return null;
        return sponsorsData.find(s => s.uuid === userProfile.id);
    }, [userProfile, sponsorsData]);

    const sponsoredOrphans = useMemo(() => {
        if (!sponsor || assignedOrphanIds.length === 0) return [];
        return orphansData.filter(o => o.uuid && assignedOrphanIds.includes(o.uuid));
    }, [sponsor, orphansData, assignedOrphanIds]);

    // Calculate payment stats for sponsored orphans (always call hooks at top level)
    const sponsorPaymentStats = useMemo(() => {
        let overdue = 0;
        let due = 0;
        let overdueAmount = 0;
        let dueAmount = 0;
        let recentlyReceived = 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        sponsoredOrphans.forEach(orphan => {
            orphan.payments.forEach(p => {
                if (p.status === PaymentStatus.Overdue) {
                    overdue++;
                    overdueAmount += p.amount;
                }
                if (p.status === PaymentStatus.Due) {
                    due++;
                    dueAmount += p.amount;
                }
                if (p.status === PaymentStatus.Paid && p.paidDate && p.paidDate >= thirtyDaysAgo) {
                    recentlyReceived++;
                }
            });
        });
        return { overdue, due, overdueAmount, dueAmount, recentlyReceived };
    }, [sponsoredOrphans]);

    // Fetch assigned team members, manager, and assigned orphans for sponsor
    useEffect(() => {
        const fetchSponsorData = async () => {
            if (!sponsor?.uuid || !userProfile) return;

            try {
                // Fetch assigned team members
                const { data: assignedData } = await supabase
                    .from('sponsor_team_members')
                    .select(`
                        team_member_id,
                        team_member:user_profiles!sponsor_team_members_team_member_id_fkey(id, name, avatar_url)
                    `)
                    .eq('sponsor_id', sponsor.uuid);

                if (assignedData) {
                    const members: Array<{ id: string; name: string; avatar_url?: string }> = [];
                    assignedData.forEach(item => {
                        const teamMember = item.team_member as any;
                        if (teamMember && typeof teamMember === 'object' && !Array.isArray(teamMember)) {
                            members.push({
                                id: String(teamMember.id || ''),
                                name: String(teamMember.name || ''),
                                avatar_url: teamMember.avatar_url ? String(teamMember.avatar_url) : undefined
                            });
                        }
                    });
                    setAssignedTeamMembers(members);
                }

                // Fetch assigned orphans
                const { data: orphanAssignments } = await supabase
                    .from('sponsor_orphans')
                    .select('orphan_id')
                    .eq('sponsor_id', sponsor.uuid);

                if (orphanAssignments) {
                    setAssignedOrphanIds(orphanAssignments.map(item => item.orphan_id));
                }

                // Fetch manager from same organization (excluding system admin)
                const { data: allTeamMembers } = await supabase
                    .from('user_profiles')
                    .select('id, name, avatar_url')
                    .eq('organization_id', userProfile.organization_id)
                    .eq('role', 'team_member')
                    .eq('is_system_admin', false);

                if (allTeamMembers && allTeamMembers.length > 0) {
                    const teamMemberIds = allTeamMembers.map(m => m.id);
                    const { data: permissionsData } = await supabase
                        .from('user_permissions')
                        .select('user_id')
                        .eq('is_manager', true)
                        .in('user_id', teamMemberIds)
                        .limit(1);

                    if (permissionsData && permissionsData.length > 0) {
                        const managerId = permissionsData[0].user_id;
                        const managerProfile = allTeamMembers.find(m => m.id === managerId);
                        if (managerProfile) {
                            setManager({
                                id: managerProfile.id,
                                name: managerProfile.name,
                                avatar_url: managerProfile.avatar_url || undefined
                            });
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching sponsor data:', err);
            }
        };

        if (userProfile?.role === 'sponsor' && sponsor) {
            fetchSponsorData();
        }
    }, [sponsor, userProfile]);

    const handleExportPDF = () => {
        const input = receiptRef.current;
        if (input) {
            html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`ملف-الكافل-${sponsor?.name || 'profile'}.pdf`);
            });
        }
    };

    // If sponsor, show sponsor profile content
    if (userProfile?.role === 'sponsor') {
        if (!isOnline && !countsLoading && !hasAnyCachedDashboardData) {
            return (
                <InternetRequiredState
                    title="الاتصال مطلوب لفتح لوحة الكافل"
                    description="لا توجد بيانات محفوظة لهذه اللوحة حتى الآن. اتصل بالإنترنت لعرض أحدث المعلومات."
                />
            );
        }

        if (!sponsor) {
            return (
                <ResponsiveState
                    variant="error"
                    title="تعذر العثور على معلومات الكافل"
                    description="لم نتمكن من تحميل لوحة الكافل الآن. حاول تحديث الصفحة أو العودة لاحقًا."
                />
            );
        }

        const DownloadIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 md:h-5 md:w-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
        const ShieldIcon = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 md:h-7 md:w-7"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
        const sponsorSectionCardClass = 'rounded-2xl border border-gray-100 bg-bg-card p-4 shadow-sm md:p-6 md:shadow-md';
        const sponsorActionClass = 'inline-flex min-h-11 min-w-[8.75rem] shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition-colors md:min-w-0';

        // Get current time greeting
        const getGreeting = () => {
            const hour = new Date().getHours();
            if (hour < 12) return 'صباح الخير';
            if (hour < 18) return 'مساء الخير';
            return 'مساء الخير';
        };

        return (
            <div ref={receiptRef} className="space-y-6 pb-2 md:space-y-8 md:pb-0">
                {!isOnline ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        أنت في وضع دون اتصال. يتم عرض آخر بيانات متاحة للقراءة فقط.
                    </div>
                ) : null}
                <section className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-l from-primary/15 via-white to-primary/5 p-4 sm:p-5 md:rounded-2xl md:p-8">
                    <div className="absolute start-0 top-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 md:h-32 md:w-32"></div>
                    <div className="absolute bottom-0 end-0 h-32 w-32 translate-x-1/4 translate-y-1/4 rounded-full bg-primary/5 md:h-48 md:w-48"></div>

                    <div className="relative z-10 space-y-5 md:space-y-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
                            <div className="max-w-2xl space-y-2">
                                <p className="text-sm font-medium text-primary md:text-base">{getGreeting()} 👋</p>
                                <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
                                    {userProfile?.name || sponsor.name}
                                </h1>
                                <p className="text-sm leading-6 text-text-secondary md:text-base">
                                    لوحة التحكم - نظرة شاملة على أيتامك المكفولين
                                </p>
                                <button
                                    type="button"
                                    onClick={() => orphansSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-white md:hidden"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                    الانتقال إلى الأيتام المكفولين
                                </button>
                            </div>

                            <div className="flex gap-3 overflow-x-auto pb-1 md:flex-wrap md:justify-end md:overflow-visible md:pb-0">
                                <Link to="/payments" className={`${sponsorActionClass} bg-primary text-white hover:bg-primary-hover`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 12h.01"/><path d="M10 12h.01"/><path d="M14 12h.01"/></svg>
                                    الدفعات
                                </Link>
                                <Link to="/messages" className={`${sponsorActionClass} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                    الرسائل
                                </Link>
                                <button type="button" onClick={handleExportPDF} className={`${sponsorActionClass} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`}>
                                    {DownloadIcon}
                                    <span>تصدير</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0">
                            <div className="min-w-[14rem] shrink-0 rounded-xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm md:min-w-0">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 md:h-11 md:w-11">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-2xl font-bold text-gray-800 md:text-3xl">{sponsoredOrphans.length}</p>
                                        <p className="text-sm text-text-secondary">يتيم مكفول</p>
                                    </div>
                                </div>
                            </div>

                            <div className="min-w-[14rem] shrink-0 rounded-xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm md:min-w-0">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600 md:h-11 md:w-11">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-2xl font-bold text-gray-800 md:text-3xl">{sponsorPaymentStats.due}</p>
                                        <p className="text-sm text-text-secondary">دفعات مستحقة</p>
                                        <p className="text-xs text-text-secondary">بقيمة ${sponsorPaymentStats.dueAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="min-w-[14rem] shrink-0 rounded-xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm md:min-w-0">
                                <div className="flex items-start gap-3">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:h-11 md:w-11 ${sponsorPaymentStats.overdue > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-2xl font-bold md:text-3xl ${sponsorPaymentStats.overdue > 0 ? 'text-red-600' : 'text-gray-800'}`}>{sponsorPaymentStats.overdue}</p>
                                        <p className="text-sm text-text-secondary">دفعات متأخرة</p>
                                        <p className="text-xs text-text-secondary">بقيمة ${sponsorPaymentStats.overdueAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="rounded-xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-text-secondary shadow-sm">
                            تم استلام {sponsorPaymentStats.recentlyReceived} دفعة خلال آخر 30 يوماً.
                        </p>
                    </div>
                </section>

                <section ref={orphansSectionRef} className="space-y-4">
                    <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-gray-700 md:text-2xl">الأيتام المكفولين</h2>
                            <p className="text-sm text-text-secondary">ملخص سريع للأيتام المرتبطين بحسابك.</p>
                        </div>
                        {sponsoredOrphans.length > 4 && (
                            <Link to="/orphans" className={sectionActionLinkClass}>
                                عرض الكل ({sponsoredOrphans.length})
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </Link>
                        )}
                    </div>
                    {sponsoredOrphans.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                            {sponsoredOrphans.slice(0, 4).map(orphan => (
                                <Link key={orphan.id} to={`/orphan/${orphan.id}`} className="flex flex-col items-center rounded-2xl border border-gray-100 bg-bg-card p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md md:p-5 md:shadow-md">
                                    <Avatar src={orphan.photoUrl} name={orphan.name} size="xl" className="mb-3 border-4 border-gray-100 !h-20 !w-20 !text-2xl md:mb-4 md:!h-24 md:!w-24 md:!text-3xl" />
                                    <h3 className="line-clamp-2 text-base font-semibold text-gray-800 md:text-lg">{orphan.name}</h3>
                                    <p className="text-sm text-text-secondary">{orphan.age} سنوات</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-bg-card px-4 py-8 text-center text-text-secondary">
                            <p>لا يوجد أيتام مكفولين حالياً</p>
                        </div>
                    )}
                </section>

                <section className={sponsorSectionCardClass}>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-gray-700 md:text-2xl">فريق المتابعة</h2>
                        <p className="text-sm text-text-secondary">الأعضاء المسؤولون عن المتابعة المباشرة لحالتك وحالات الأيتام.</p>
                    </div>

                    <div className="mt-5 space-y-5">
                        {assignedTeamMembers.length > 0 ? (
                            <div className="space-y-3">
                                <h3 className="text-base font-semibold text-gray-700 md:text-lg">الأعضاء المعينون</h3>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                                    {assignedTeamMembers.map(member => (
                                        <Link
                                            key={member.id}
                                            to={`/team/${member.id}`}
                                            className="flex min-h-11 items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                                        >
                                            <Avatar src={member.avatar_url} name={member.name} size="md" className="md:!h-12 md:!w-12 md:!text-lg" />
                                            <div className="min-w-0">
                                                <h3 className="line-clamp-1 font-semibold text-gray-800">{member.name}</h3>
                                                <p className="text-sm text-text-secondary">عضو فريق</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-text-secondary">لم يتم تعيين أي أعضاء فريق بعد</p>
                        )}

                        {manager && (
                            <div className="border-t border-gray-100 pt-5">
                                <h3 className="mb-3 text-base font-semibold text-gray-700 md:text-lg">مدير المنظمة</h3>
                                <Link
                                    to={`/team/${manager.id}`}
                                    className="flex min-h-11 items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <Avatar src={manager.avatar_url} name={manager.name} size="md" className="md:!h-12 md:!w-12 md:!text-lg" />
                                    <div className="min-w-0">
                                        <h3 className="line-clamp-1 font-semibold text-gray-800">{manager.name}</h3>
                                        <p className="text-sm text-text-secondary">مدير</p>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                <SponsorFinancialRecord sponsor={sponsor} sponsoredOrphans={sponsoredOrphans} />

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                    <div className="relative overflow-hidden rounded-2xl border border-yellow-100 bg-gradient-to-br from-yellow-50 to-white p-5 shadow-sm md:p-6 md:shadow-md">
                        <div className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-yellow-500 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        </div>
                        <div className="max-w-sm space-y-3">
                            <h3 className="pe-10 text-xl font-bold text-gray-800">تواصل معنا</h3>
                            <p className="text-sm leading-6 text-text-secondary">
                                لأية استفسارات، نحن متواجدون من الأحد إلى الخميس، 9 صباحاً - 5 مساءً.
                            </p>
                            <Link to="/messages" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-hover md:w-auto">
                                <span>التواصل عبر الرسائل</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </Link>
                        </div>
                    </div>

                    <Link to="/policies" className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md md:p-6 md:shadow-md">
                        <div className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-blue-500 shadow-sm">
                            {ShieldIcon}
                        </div>
                        <div className="max-w-sm space-y-3">
                            <h3 className="pe-10 text-xl font-bold text-gray-800">سياسات يتيم</h3>
                            <p className="text-sm leading-6 text-text-secondary">
                                اطلع على شروط وأحكام المنظمة وكل السياسات المنظمة للعلاقة مع يتيم.
                            </p>
                            <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm font-semibold text-blue-700">
                                الانتقال إلى السياسات
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </span>
                        </div>
                    </Link>
                </section>
            </div>
        );
    }

    // Team member dashboard (existing content)
    if (!isOnline && !countsLoading && !hasAnyCachedDashboardData) {
        return (
            <InternetRequiredState
                title="الاتصال مطلوب لفتح لوحة التحكم"
                description="هذه أول زيارة أو لا توجد بيانات محفوظة بعد. اتصل بالإنترنت لتحميل لوحة التحكم."
            />
        );
    }

    // Calculate stats
    const overduePayments = orphansData.reduce((count, orphan) => 
        count + orphan.payments.filter(p => p.status === PaymentStatus.Overdue).length, 0
    );
    const duePayments = orphansData.reduce((count, orphan) => 
        count + orphan.payments.filter(p => p.status === PaymentStatus.Due).length, 0
    );
    const duePaymentsAmount = orphansData.reduce((sum, orphan) =>
        sum + orphan.payments.filter(p => p.status === PaymentStatus.Due).reduce((acc, p) => acc + p.amount, 0), 0
    );
    const overduePaymentsAmount = orphansData.reduce((sum, orphan) =>
        sum + orphan.payments.filter(p => p.status === PaymentStatus.Overdue).reduce((acc, p) => acc + p.amount, 0), 0
    );
    const recentlyReceivedPayments = orphansData.reduce((count, orphan) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return count + orphan.payments.filter(p => p.status === PaymentStatus.Paid && p.paidDate && p.paidDate >= thirtyDaysAgo).length;
    }, 0);

    // Get current time greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'صباح الخير';
        if (hour < 18) return 'مساء الخير';
        return 'مساء الخير';
    };
    
    return (
        <div className="space-y-8 md:space-y-12">
          {!isOnline ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              أنت في وضع دون اتصال. يتم عرض البيانات المحفوظة فقط، ولا يمكن تنفيذ عمليات تعديل جديدة.
            </div>
          ) : null}
          {/* Welcome Hero Section */}
          <section className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 md:rounded-2xl md:p-8">
            <div className="absolute start-0 top-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 md:h-32 md:w-32"></div>
            <div className="absolute bottom-0 end-0 h-32 w-32 translate-x-1/4 translate-y-1/4 rounded-full bg-primary/5 md:h-48 md:w-48"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
                <div className="max-w-2xl">
                  <p className="mb-1 text-sm font-medium text-primary md:text-base">{getGreeting()} 👋</p>
                  <h1 className="mb-2 text-xl font-bold text-gray-800 sm:text-2xl md:text-3xl">
                    {userProfile?.name || 'مرحباً بك في يتيم'}
                  </h1>
                  <p className="text-sm leading-6 text-text-secondary md:text-base">
                    لوحة التحكم الرئيسية - نظرة شاملة على أنشطة المنظمة
                  </p>
                </div>
                
                <div className="grid w-full grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:flex md:w-auto md:flex-wrap">
                  {canOpenOrphans && (
                    <Link to="/orphans" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover md:px-5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      عرض الأيتام
                    </Link>
                  )}
                  <Link to="/messages" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 md:px-5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    الرسائل
                  </Link>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:gap-4">
                <div className="rounded-xl border border-white/60 bg-white/85 p-3 shadow-sm backdrop-blur-sm md:p-4">
                  <div className="flex flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 md:h-10 md:w-10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div className="min-w-0">
                      {countsLoading ? <div className="mb-1 h-7 w-12 animate-pulse rounded-lg bg-gray-200/70" /> : <p className="text-xl font-bold text-gray-800 md:text-2xl">{orphansData.length}</p>}
                      <p className="text-xs text-text-secondary md:text-sm">يتيم</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/60 bg-white/85 p-3 shadow-sm backdrop-blur-sm md:p-4">
                  <div className="flex flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600 md:h-10 md:w-10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div className="min-w-0">
                      {countsLoading ? <div className="mb-1 h-7 w-12 animate-pulse rounded-lg bg-gray-200/70" /> : <p className="text-xl font-bold text-gray-800 md:text-2xl">{sponsorsData.length}</p>}
                      <p className="text-xs text-text-secondary md:text-sm">كافل</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/60 bg-white/85 p-3 shadow-sm backdrop-blur-sm md:p-4">
                  <div className="flex flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 md:h-10 md:w-10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div className="min-w-0">
                      {countsLoading ? <div className="mb-1 h-7 w-12 animate-pulse rounded-lg bg-gray-200/70" /> : <p className="text-xl font-bold text-gray-800 md:text-2xl">{duePayments}</p>}
                      <p className="text-xs text-text-secondary md:text-sm">دفعة مستحقة</p>
                      <p className="text-[11px] text-text-secondary md:text-xs">(${duePaymentsAmount.toLocaleString()})</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/60 bg-white/85 p-3 shadow-sm backdrop-blur-sm md:p-4">
                  <div className="flex flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${overduePayments > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} md:h-10 md:w-10`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:h-5 md:w-5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div className="min-w-0">
                      {countsLoading ? <div className="mb-1 h-7 w-12 animate-pulse rounded-lg bg-gray-200/70" /> : <p className={`text-xl font-bold md:text-2xl ${overduePayments > 0 ? 'text-red-600' : 'text-gray-800'}`}>{overduePayments}</p>}
                      <p className="text-xs text-text-secondary md:text-sm">دفعة متأخرة</p>
                      <p className="text-[11px] text-text-secondary md:text-xs">(${overduePaymentsAmount.toLocaleString()})</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-secondary sm:text-sm">دفعات تم استلامها خلال آخر 30 يوماً: {recentlyReceivedPayments}</p>
            </div>
          </section>

          <AdvancedOverviewSection
            orphansCount={orphansData.length}
            sponsorsCount={sponsorsData.length}
          />

          <section>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
              <UpcomingOccasions onViewAll={() => setIsOccasionsModalOpen(true)} />
              {canOpenFinancials && <PendingApprovals />}
              <LatestAchievements orphans={orphansData} />
            </div>
          </section>

          <OccasionsManagementModal
            isOpen={isOccasionsModalOpen}
            onClose={() => setIsOccasionsModalOpen(false)}
          />

          {canOpenOrphans && (
          <section>
            <div className="mb-4 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
              <h2 className="text-xl font-bold text-gray-700 md:text-2xl">الأيتام</h2>
              {orphansData.length > 4 && (
                <Link to="/orphans" className={sectionActionLinkClass}>
                  عرض الكل ({orphansData.length})
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {orphansData.slice(0, 4).map(orphan => (
                <Link to={`/orphan/${orphan.id}`} key={orphan.id} className="flex flex-col items-center rounded-xl bg-bg-card p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md md:shadow-md md:hover:shadow-xl">
                  <Avatar src={orphan.photoUrl} name={orphan.name} size="xl" className="mb-3 border-4 border-gray-100 !h-20 !w-20 !text-2xl md:mb-4 md:!h-24 md:!w-24 md:!text-3xl" />
                  <h3 className="line-clamp-2 text-base font-semibold text-gray-800 md:text-lg">{orphan.name}</h3>
                  <p className="text-sm text-text-secondary">{orphan.age} سنوات</p>
                </Link>
              ))}
            </div>
          </section>
          )}

          {canOpenSponsors && (
          <section>
            <div className="mb-4 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
              <h2 className="text-xl font-bold text-gray-700 md:text-2xl">الكفلاء</h2>
              {sponsorsData.length > 6 && (
                <Link to="/sponsors" className={sectionActionLinkClass}>
                  عرض الكل ({sponsorsData.length})
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {sponsorsData.slice(0, 6).map(sponsor => (
                <Link to={`/sponsor/${sponsor.id}`} key={sponsor.id} className="flex items-center gap-3 rounded-xl bg-bg-card p-4 shadow-sm transition-colors hover:bg-gray-50 md:gap-4 md:p-5 md:shadow-md">
                  <Avatar src={sponsor.avatarUrl} name={sponsor.name} size="md" className="!h-11 !w-11 !text-lg md:!h-12 md:!w-12 md:!text-xl" />
                  <div className="min-w-0">
                      <h3 className="line-clamp-1 text-base font-semibold text-gray-800 md:text-lg">{sponsor.name}</h3>
                      <p className="text-sm text-text-secondary">يكفل {sponsor.sponsoredOrphanIds.length} يتيم</p>
                    </div>
                </Link>
              ))}
            </div>
          </section>
          )}

          <section>
            <div className="mb-4 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
              <h2 className="text-xl font-bold text-gray-700 md:text-2xl">فريق العمل</h2>
              {teamMembersData.length > 6 && (
                <Link to="/team" className={sectionActionLinkClass}>
                  عرض الكل ({teamMembersData.length})
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {teamMembersData
                .sort((a, b) => {
                  const aIsCurrentUser = a.uuid === userProfile?.id;
                  const bIsCurrentUser = b.uuid === userProfile?.id;
                  if (aIsCurrentUser && !bIsCurrentUser) return -1;
                  if (!aIsCurrentUser && bIsCurrentUser) return 1;
                  return 0;
                })
                .slice(0, 6)
                .map(member => (
                <Link to={`/team/${member.id}`} key={member.id} className="flex items-center gap-3 rounded-xl bg-bg-card p-4 shadow-sm transition-colors hover:bg-gray-50 md:gap-4 md:p-5 md:shadow-md">
                  <Avatar src={member.avatarUrl} name={member.name} size="md" className="!h-11 !w-11 !text-base md:!h-12 md:!w-12 md:!text-lg" />
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 text-base font-semibold text-gray-800 md:text-lg">{member.name}</h3>
                    <p className="text-sm text-text-secondary">عضو فريق</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
    );
};

export default Dashboard;
