import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useOrphansBasic } from '../hooks/useOrphans';
import { useAuth } from '../contexts/AuthContext';
import { useSponsorsBasic } from '../hooks/useSponsors';
import { PaymentStatus, PaymentStatusHistory } from '../types';
import PaymentStatusBadge from './PaymentStatusBadge';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';

type StatusFilter = 'all' | PaymentStatus;

const statusFilterOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'الكل' },
  { value: PaymentStatus.Paid, label: 'مدفوع' },
  { value: PaymentStatus.Due, label: 'مستحق' },
  { value: PaymentStatus.Overdue, label: 'متأخر' },
  { value: PaymentStatus.Processing, label: 'قيد المعالجة' },
];

const monthFormatter = new Intl.DateTimeFormat('ar-EG', { month: 'short' });
const monthYearFormatter = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' });
const dayMonthYearFormatter = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

const SponsorPaymentsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { orphans: orphansData } = useOrphansBasic();
  const { sponsors: sponsorsData } = useSponsorsBasic();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'dueDate' | 'amount'>('name');
  const [expandedOrphans, setExpandedOrphans] = useState<Set<string>>(new Set());
  const [assignedOrphanIds, setAssignedOrphanIds] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [statusHistoryByPayment, setStatusHistoryByPayment] = useState<Record<string, PaymentStatusHistory[]>>({});

  const sponsor = useMemo(() => {
    if (!userProfile || !sponsorsData.length || userProfile.role !== 'sponsor') return null;
    return sponsorsData.find((s) => s.uuid === userProfile.id);
  }, [userProfile, sponsorsData]);

  useEffect(() => {
    const fetchAssignedOrphans = async () => {
      if (!sponsor?.uuid) return;
      const { data } = await supabase.from('sponsor_orphans').select('orphan_id').eq('sponsor_id', sponsor.uuid);
      setAssignedOrphanIds((data ?? []).map((item) => item.orphan_id));
    };
    fetchAssignedOrphans();
  }, [sponsor?.uuid]);

  const sponsorOrphans = useMemo(() => {
    if (!sponsor || assignedOrphanIds.length === 0) return [];
    return orphansData.filter((o) => o.uuid && assignedOrphanIds.includes(o.uuid));
  }, [sponsor, orphansData, assignedOrphanIds]);

  const orphansWithYearPayments = useMemo(
    () =>
      sponsorOrphans.map((orphan) => ({
        ...orphan,
        payments: orphan.payments.filter((p) => (p.year ?? p.dueDate.getFullYear()) === selectedYear),
      })),
    [selectedYear, sponsorOrphans]
  );

  useEffect(() => {
    const fetchStatusHistory = async () => {
      const paymentIds = orphansWithYearPayments.flatMap((o) => o.payments.map((p) => p.id));
      if (paymentIds.length === 0) {
        setStatusHistoryByPayment({});
        return;
      }
      const { data } = await supabase
        .from('payment_status_history')
        .select('*')
        .in('payment_id', paymentIds)
        .order('changed_at', { ascending: false });

      const grouped: Record<string, PaymentStatusHistory[]> = {};
      (data ?? []).forEach((row) => {
        const mapped: PaymentStatusHistory = {
          id: row.id,
          paymentId: row.payment_id,
          oldStatus: row.old_status ?? undefined,
          newStatus: row.new_status,
          changedBy: row.changed_by ?? undefined,
          changedBySource: row.changed_by_source,
          notes: row.notes ?? undefined,
          changedAt: new Date(row.changed_at),
        };
        if (!grouped[row.payment_id]) grouped[row.payment_id] = [];
        grouped[row.payment_id].push(mapped);
      });
      setStatusHistoryByPayment(grouped);
    };
    fetchStatusHistory();
  }, [orphansWithYearPayments]);

  const summaryStats = useMemo(() => {
    let totalPaid = 0;
    let paidCount = 0;
    let totalOutstanding = 0;
    let outstandingCount = 0;
    let totalProcessing = 0;
    let processingCount = 0;
    orphansWithYearPayments.forEach((orphan) => {
      orphan.payments.forEach((payment) => {
        if (payment.status === PaymentStatus.Paid) {
          totalPaid += payment.amount;
          paidCount++;
        } else if (payment.status === PaymentStatus.Due || payment.status === PaymentStatus.Overdue) {
          totalOutstanding += payment.amount;
          outstandingCount++;
        } else if (payment.status === PaymentStatus.Processing) {
          totalProcessing += payment.amount;
          processingCount++;
        }
      });
    });
    return { totalPaid, paidCount, totalOutstanding, outstandingCount, totalProcessing, processingCount, totalOrphans: orphansWithYearPayments.length };
  }, [orphansWithYearPayments]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: orphansWithYearPayments.reduce((sum, orphan) => sum + orphan.payments.length, 0),
      [PaymentStatus.Paid]: 0,
      [PaymentStatus.Due]: 0,
      [PaymentStatus.Overdue]: 0,
      [PaymentStatus.Processing]: 0,
    };

    orphansWithYearPayments.forEach((orphan) => {
      orphan.payments.forEach((payment) => {
        counts[payment.status] += 1;
      });
    });

    return counts;
  }, [orphansWithYearPayments]);

  const filteredAndSortedOrphans = useMemo(() => {
    let filtered = orphansWithYearPayments;
    if (searchQuery.trim()) filtered = filtered.filter((orphan) => orphan.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (statusFilter !== 'all') {
      filtered = filtered
        .map((orphan) => ({ ...orphan, payments: orphan.payments.filter((p) => p.status === statusFilter) }))
        .filter((orphan) => orphan.payments.length > 0);
    }
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
      if (sortBy === 'dueDate') return (b.payments[0]?.dueDate?.getTime() ?? 0) - (a.payments[0]?.dueDate?.getTime() ?? 0);
      const aTotal = a.payments.reduce((sum, p) => sum + p.amount, 0);
      const bTotal = b.payments.reduce((sum, p) => sum + p.amount, 0);
      return bTotal - aTotal;
    });
    return filtered.map((orphan) => ({ ...orphan, payments: [...orphan.payments].sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime()) }));
  }, [orphansWithYearPayments, searchQuery, sortBy, statusFilter]);

  useEffect(() => {
    if (orphansWithYearPayments.length > 0 && expandedOrphans.size === 0) {
      setExpandedOrphans(new Set(orphansWithYearPayments.map((o) => o.uuid || o.id.toString())));
    }
  }, [orphansWithYearPayments.length, expandedOrphans.size]);

  const toggleOrphanExpansion = (orphanId: string) => {
    setExpandedOrphans((prev) => {
      const next = new Set(prev);
      if (next.has(orphanId)) next.delete(orphanId);
      else next.add(orphanId);
      return next;
    });
  };

  if (userProfile?.role !== 'sponsor') return <Navigate to="/" replace />;
  if (!sponsor) return <div className="py-8 text-center text-red-500">لم يتم العثور على معلومات الكافل.</div>;

  return (
    <div className="space-y-4 pb-2 md:space-y-6">
      <div className="rounded-2xl bg-bg-card p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">الدفعات السنوية</p>
            <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">تتبع الدفعات</h1>
            <p className="text-sm leading-6 text-text-secondary md:text-base">
              عرض دفعات الأيتام المكفولين حسب السنة مع متابعة الحالات والتواريخ.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:w-auto md:min-w-[220px]">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              <span>السنة</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>

            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 md:min-w-[220px]"
            >
              العودة إلى لوحة التحكم
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-green-50 p-3.5 text-green-900 shadow-sm ring-1 ring-green-100 md:p-4">
          <p className="text-xs font-medium text-green-700 md:text-sm">إجمالي المدفوع</p>
          <p className="mt-2 text-lg font-bold md:text-2xl">{formatCurrency(summaryStats.totalPaid)}</p>
          <p className="mt-1 text-xs text-green-700/80 md:text-sm">عدد الدفعات: {summaryStats.paidCount}</p>
        </div>
        <div className="rounded-2xl bg-yellow-50 p-3.5 text-yellow-900 shadow-sm ring-1 ring-yellow-100 md:p-4">
          <p className="text-xs font-medium text-yellow-700 md:text-sm">المستحقات</p>
          <p className="mt-2 text-lg font-bold md:text-2xl">{formatCurrency(summaryStats.totalOutstanding)}</p>
          <p className="mt-1 text-xs text-yellow-700/80 md:text-sm">عدد الدفعات: {summaryStats.outstandingCount}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3.5 text-blue-900 shadow-sm ring-1 ring-blue-100 md:p-4">
          <p className="text-xs font-medium text-blue-700 md:text-sm">قيد المعالجة</p>
          <p className="mt-2 text-lg font-bold md:text-2xl">{formatCurrency(summaryStats.totalProcessing)}</p>
          <p className="mt-1 text-xs text-blue-700/80 md:text-sm">عدد الدفعات: {summaryStats.processingCount}</p>
        </div>
        <div className="rounded-2xl bg-violet-50 p-3.5 text-violet-900 shadow-sm ring-1 ring-violet-100 md:p-4">
          <p className="text-xs font-medium text-violet-700 md:text-sm">الأيتام المكفولون</p>
          <p className="mt-2 text-lg font-bold md:text-2xl">{summaryStats.totalOrphans}</p>
          <p className="mt-1 text-xs text-violet-700/80 md:text-sm">إجمالي السجلات: {statusCounts.all}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-bg-card p-4 shadow-sm md:p-5">
        <div className="space-y-4">
          <div>
            <label htmlFor="payments-search" className="mb-2 block text-sm font-medium text-gray-700">
              البحث عن يتيم
            </label>
            <input
              id="payments-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم..."
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-700">حالة الدفعة</p>
              <p className="text-xs text-text-secondary">مرر لعرض كل الحالات</p>
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {statusFilterOptions.map((option) => {
                const isActive = statusFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {statusCounts[option.value]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              <span>الترتيب</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'dueDate' | 'amount')}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              >
                <option value="name">ترتيب حسب الاسم</option>
                <option value="dueDate">ترتيب حسب تاريخ الاستحقاق</option>
                <option value="amount">ترتيب حسب المبلغ</option>
              </select>
            </label>

            <div className="rounded-xl bg-gray-50 p-3 text-sm text-text-secondary md:self-end">
              عدد الأيتام المطابقين: <span className="font-bold text-gray-800">{filteredAndSortedOrphans.length}</span>
            </div>
          </div>
        </div>
      </div>

      {filteredAndSortedOrphans.length === 0 ? (
        <div className="rounded-2xl bg-bg-card p-8 text-center text-sm text-text-secondary shadow-sm md:text-base">
          لا توجد دفعات مسجلة لهذه السنة
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {filteredAndSortedOrphans.map((orphan) => {
            const isExpanded = expandedOrphans.has(orphan.uuid || orphan.id.toString());
            const orphanPayments = orphan.payments;
            const orphanPaidCount = orphanPayments.filter((payment) => payment.status === PaymentStatus.Paid).length;
            const orphanOutstandingCount = orphanPayments.filter(
              (payment) => payment.status === PaymentStatus.Due || payment.status === PaymentStatus.Overdue
            ).length;
            const orphanTotalAmount = orphanPayments.reduce((sum, payment) => sum + payment.amount, 0);

            return (
              <div key={orphan.id} className="overflow-hidden rounded-2xl bg-bg-card shadow-sm ring-1 ring-black/5">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  className="w-full p-3 text-start transition-colors hover:bg-gray-50 md:p-4"
                  onClick={() => toggleOrphanExpansion(orphan.uuid || orphan.id.toString())}
                >
                  <div className="flex items-start gap-3 md:items-center md:gap-4">
                    <Avatar
                      src={orphan.photoUrl}
                      name={orphan.name}
                      size="md"
                      className="h-14 w-14 border-2 border-gray-200 text-base md:h-16 md:w-16 md:text-lg"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-bold text-gray-800 md:text-xl">{orphan.name}</h3>
                          <p className="mt-1 text-xs text-gray-600 md:text-sm">عدد الدفعات: {orphanPayments.length}</p>
                        </div>
                        <span
                          className={`mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex min-h-8 items-center rounded-full bg-green-50 px-3 text-xs font-semibold text-green-700">
                          مدفوع: {orphanPaidCount}
                        </span>
                        <span className="inline-flex min-h-8 items-center rounded-full bg-yellow-50 px-3 text-xs font-semibold text-yellow-700">
                          مستحق: {orphanOutstandingCount}
                        </span>
                        <span className="inline-flex min-h-8 items-center rounded-full bg-gray-100 px-3 text-xs font-semibold text-gray-700">
                          الإجمالي: {formatCurrency(orphanTotalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="space-y-4 border-t border-gray-200 bg-gray-50 p-3 md:p-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-3 md:p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-gray-800 md:text-base">تقويم الدفعات</h4>
                        <span className="text-xs text-text-secondary">السنة {selectedYear}</span>
                      </div>

                      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:px-0 md:pb-0">
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = new Date(selectedYear, i, 1);
                          const paymentForMonth = orphanPayments.find((p) => p.dueDate.getFullYear() === month.getFullYear() && p.dueDate.getMonth() === month.getMonth());
                          const label = paymentForMonth?.status ?? 'لا يوجد';

                          return (
                            <div
                              key={i}
                              className="min-w-[92px] flex-shrink-0 rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-center shadow-sm md:min-w-0 md:p-3"
                            >
                              <p className="text-xs font-semibold text-gray-800 md:text-sm">{monthFormatter.format(month)}</p>
                              <p className="mt-1 text-[11px] leading-5 text-text-secondary md:text-sm">{label}</p>
                              {paymentForMonth && (
                                <p className="mt-1 text-xs font-semibold text-gray-700 md:text-sm">{formatCurrency(paymentForMonth.amount)}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-3 md:p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h5 className="text-sm font-bold text-gray-800 md:text-base">سجل تغيرات حالة الدفع</h5>
                        <span className="text-xs text-text-secondary">آخر التحديثات</span>
                      </div>

                      <div className="space-y-3">
                        {orphanPayments.map((payment) => (
                          <div key={payment.id} className="rounded-xl border border-gray-100 p-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800">
                                  {monthYearFormatter.format(payment.dueDate)}
                                </p>
                                <p className="mt-1 text-xs text-text-secondary md:text-sm">
                                  المبلغ: {formatCurrency(payment.amount)}
                                </p>
                              </div>

                              <PaymentStatusBadge status={payment.status} className="self-start" />
                            </div>

                            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                              {(statusHistoryByPayment[payment.id] ?? []).slice(0, 4).map((historyRow) => (
                                <div key={historyRow.id} className="rounded-lg bg-gray-50 p-2.5">
                                  <p className="text-xs font-semibold text-gray-700 md:text-sm">{historyRow.newStatus}</p>
                                  <p className="mt-1 text-[11px] leading-5 text-text-secondary md:text-xs">
                                    {dayMonthYearFormatter.format(historyRow.changedAt)}
                                  </p>
                                </div>
                              ))}

                              {(statusHistoryByPayment[payment.id] ?? []).length === 0 && (
                                <p className="text-xs text-gray-400">لا يوجد سجل تغير حالة حتى الآن</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1">
                      <Link
                        to={`/orphan/${orphan.id}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                      >
                        عرض الملف الشخصي
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SponsorPaymentsPage;
