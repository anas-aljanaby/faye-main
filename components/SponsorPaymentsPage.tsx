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
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">تتبع الدفعات</h1>
          <p className="mt-1 text-text-secondary">عرض دفعات الأيتام المكفولين حسب السنة</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))} className="rounded-lg border border-gray-300 px-3 py-2">
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <Link to="/" className="flex items-center gap-2 font-semibold text-primary hover:text-primary-hover">العودة للوحة التحكم</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-green-100 p-4 text-green-800">إجمالي المدفوع: <strong>${summaryStats.totalPaid.toLocaleString()}</strong></div>
        <div className="rounded-lg bg-yellow-100 p-4 text-yellow-800">المستحقات: <strong>${summaryStats.totalOutstanding.toLocaleString()}</strong></div>
        <div className="rounded-lg bg-blue-100 p-4 text-blue-800">قيد المعالجة: <strong>${summaryStats.totalProcessing.toLocaleString()}</strong></div>
        <div className="rounded-lg bg-purple-100 p-4 text-purple-800">عدد الأيتام: <strong>{summaryStats.totalOrphans}</strong></div>
      </div>

      <div className="rounded-lg bg-bg-card p-4 shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="البحث عن يتيم..." className="flex-1 rounded-lg border border-gray-300 px-4 py-2" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="rounded-lg border border-gray-300 px-4 py-2">
            <option value="all">الكل</option>
            <option value={PaymentStatus.Paid}>مدفوع</option>
            <option value={PaymentStatus.Due}>مستحق</option>
            <option value={PaymentStatus.Overdue}>متأخر</option>
            <option value={PaymentStatus.Processing}>قيد المعالجة</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'dueDate' | 'amount')} className="rounded-lg border border-gray-300 px-4 py-2">
            <option value="name">ترتيب حسب الاسم</option>
            <option value="dueDate">ترتيب حسب تاريخ الاستحقاق</option>
            <option value="amount">ترتيب حسب المبلغ</option>
          </select>
        </div>
      </div>

      {filteredAndSortedOrphans.length === 0 ? (
        <div className="rounded-lg bg-bg-card p-8 text-center shadow-md text-text-secondary">لا توجد دفعات مسجلة لهذه السنة</div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedOrphans.map((orphan) => {
            const isExpanded = expandedOrphans.has(orphan.uuid || orphan.id.toString());
            const orphanPayments = orphan.payments;
            return (
              <div key={orphan.id} className="overflow-hidden rounded-lg bg-bg-card shadow-md">
                <div className="cursor-pointer p-4 hover:bg-gray-50" onClick={() => toggleOrphanExpansion(orphan.uuid || orphan.id.toString())}>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center gap-4">
                      <Avatar src={orphan.photoUrl} name={orphan.name} size="xl" className="border-2 border-gray-200" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{orphan.name}</h3>
                        <p className="text-sm text-gray-600">عدد الدفعات: {orphanPayments.length}</p>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = new Date(selectedYear, i, 1);
                        const paymentForMonth = orphanPayments.find((p) => p.dueDate.getFullYear() === month.getFullYear() && p.dueDate.getMonth() === month.getMonth());
                        const label = paymentForMonth?.status ?? 'لا يوجد';
                        return (
                          <div key={i} className="rounded-lg bg-white p-3 text-center shadow-sm">
                            <p className="mb-1 text-sm font-semibold text-gray-800">{month.toLocaleDateString('ar-EG', { month: 'long' })}</p>
                            <p className="text-sm text-text-secondary">{label}</p>
                            {paymentForMonth && <p className="text-xs font-semibold text-gray-700">${paymentForMonth.amount.toLocaleString()}</p>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                      <h5 className="mb-3 font-bold text-gray-800">سجل تغيرات حالة الدفع</h5>
                      <div className="space-y-3">
                        {orphanPayments.map((payment) => (
                          <div key={payment.id} className="rounded border border-gray-100 p-3">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm text-gray-700">
                                {payment.dueDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })} - ${payment.amount.toLocaleString()}
                              </span>
                              <PaymentStatusBadge status={payment.status} />
                            </div>
                            <div className="space-y-1">
                              {(statusHistoryByPayment[payment.id] ?? []).slice(0, 4).map((historyRow) => (
                                <p key={historyRow.id} className="text-xs text-text-secondary">
                                  {historyRow.newStatus} - {historyRow.changedAt.toLocaleDateString('ar-EG')}
                                </p>
                              ))}
                              {(statusHistoryByPayment[payment.id] ?? []).length === 0 && (
                                <p className="text-xs text-gray-400">لا يوجد سجل تغير حالة حتى الآن</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-3 text-left">
                      <Link to={`/orphan/${orphan.id}`} className="text-sm font-semibold text-primary hover:text-primary-hover">عرض الملف الشخصي</Link>
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
