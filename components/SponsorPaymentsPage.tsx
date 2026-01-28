import React, { useState, useMemo, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useOrphansBasic } from '../hooks/useOrphans';
import { useAuth } from '../contexts/AuthContext';
import { useSponsors } from '../hooks/useSponsors';
import { PaymentStatus, Orphan, Payment } from '../types';
import PaymentStatusBadge from './PaymentStatusBadge';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';

type StatusFilter = 'all' | PaymentStatus;

const SponsorPaymentsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { orphans: orphansData } = useOrphansBasic();
  const { sponsors: sponsorsData } = useSponsors();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'dueDate' | 'amount'>('name');
  const [expandedOrphans, setExpandedOrphans] = useState<Set<string>>(new Set());
  const [assignedOrphanIds, setAssignedOrphanIds] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  // Find the current sponsor
  const sponsor = useMemo(() => {
    if (!userProfile || !sponsorsData.length || userProfile.role !== 'sponsor') return null;
    return sponsorsData.find(s => s.uuid === userProfile.id);
  }, [userProfile, sponsorsData]);

  // Fetch assigned orphans for sponsor
  useEffect(() => {
    const fetchAssignedOrphans = async () => {
      if (!sponsor?.uuid || !userProfile) return;

      try {
        const { data: orphanAssignments } = await supabase
          .from('sponsor_orphans')
          .select('orphan_id')
          .eq('sponsor_id', sponsor.uuid);

        if (orphanAssignments) {
          setAssignedOrphanIds(orphanAssignments.map(item => item.orphan_id));
        }
      } catch (err) {
        console.error('Error fetching assigned orphans:', err);
      }
    };

    if (userProfile?.role === 'sponsor' && sponsor) {
      fetchAssignedOrphans();
    }
  }, [sponsor, userProfile]);

  // Generate demo payments for orphans that don't have payments for the selected year
  const orphansWithDemoPayments = useMemo(() => {
    if (!sponsor || assignedOrphanIds.length === 0) return [];
    const filtered = orphansData.filter(o => o.uuid && assignedOrphanIds.includes(o.uuid));
    
    return filtered.map(orphan => {
      // Check if orphan has payments for the selected year
      const paymentsForYear = orphan.payments.filter(p => p.dueDate.getFullYear() === selectedYear);
      
      // If no payments for selected year, generate demo payments
      if (paymentsForYear.length === 0) {
        const demoPayments: Payment[] = [];
        const statuses = [PaymentStatus.Paid, PaymentStatus.Due, PaymentStatus.Overdue, PaymentStatus.Processing];
        
        // Generate 6-8 random payments throughout the year
        const numPayments = 6 + Math.floor(Math.random() * 3); // 6-8 payments
        const usedMonths = new Set<number>();
        
        for (let i = 0; i < numPayments; i++) {
          let month;
          do {
            month = Math.floor(Math.random() * 12);
          } while (usedMonths.has(month));
          usedMonths.add(month);
          
          const dueDate = new Date(selectedYear, month, 1);
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const amount = 50 + Math.floor(Math.random() * 50); // $50-$100
          
          const payment: Payment = {
            id: `demo-${orphan.id}-${month}`,
            amount,
            dueDate,
            status,
            paidDate: status === PaymentStatus.Paid ? new Date(selectedYear, month, Math.floor(Math.random() * 28) + 1) : undefined,
          };
          
          demoPayments.push(payment);
        }
        
        return {
          ...orphan,
          payments: [...orphan.payments, ...demoPayments],
        };
      }
      
      return orphan;
    });
  }, [sponsor, orphansData, assignedOrphanIds, selectedYear]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    let totalPaid = 0;
    let paidCount = 0;
    let totalOutstanding = 0;
    let outstandingCount = 0;
    let totalProcessing = 0;
    let processingCount = 0;

    orphansWithDemoPayments.forEach(orphan => {
      orphan.payments.forEach(payment => {
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

    return {
      totalPaid,
      paidCount,
      totalOutstanding,
      outstandingCount,
      totalProcessing,
      processingCount,
      totalOrphans: orphansWithDemoPayments.length,
    };
  }, [orphansWithDemoPayments]);

  // Filter and sort payments
  const filteredAndSortedOrphans = useMemo(() => {
    let filtered = orphansWithDemoPayments;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(orphan =>
        orphan.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.map(orphan => ({
        ...orphan,
        payments: orphan.payments.filter(p => p.status === statusFilter),
      })).filter(orphan => orphan.payments.length > 0);
    }

    // Sort orphans
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'ar');
        case 'dueDate':
          const aLatest = a.payments[0]?.dueDate || new Date(0);
          const bLatest = b.payments[0]?.dueDate || new Date(0);
          return bLatest.getTime() - aLatest.getTime();
        case 'amount':
          const aTotal = a.payments.reduce((sum, p) => sum + p.amount, 0);
          const bTotal = b.payments.reduce((sum, p) => sum + p.amount, 0);
          return bTotal - aTotal;
        default:
          return 0;
      }
    });

    // Sort payments within each orphan by due date (newest first)
    return filtered.map(orphan => ({
      ...orphan,
      payments: [...orphan.payments].sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime()),
    }));
  }, [orphansWithDemoPayments, statusFilter, searchQuery, sortBy]);

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

  // Expand all orphans by default on first load
  useEffect(() => {
    if (orphansWithDemoPayments.length > 0 && expandedOrphans.size === 0) {
      setExpandedOrphans(new Set(orphansWithDemoPayments.map(o => o.uuid || o.id.toString())));
    }
  }, [orphansWithDemoPayments.length]);

  // Redirect if not a sponsor
  if (userProfile?.role !== 'sponsor') {
    return <Navigate to="/" replace />;
  }

  if (!sponsor) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>لم يتم العثور على معلومات الكافل.</p>
      </div>
    );
  }

  const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; icon: string; colorClass: string }> = ({ title, value, subtitle, icon, colorClass }) => (
    <div className={`p-4 rounded-lg ${colorClass}`}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-semibold opacity-80">{title}</p>
          <p className="text-xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">تتبع الدفعات</h1>
          <p className="text-text-secondary mt-1">عرض جميع الدفعات للأيتام المكفولين</p>
        </div>
        <Link
          to="/"
          className="text-primary hover:text-primary-hover font-semibold flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          العودة للوحة التحكم
        </Link>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المدفوع"
          value={`$${summaryStats.totalPaid.toLocaleString()}`}
          subtitle={`${summaryStats.paidCount} دفعة`}
          icon="✅"
          colorClass="bg-green-100 text-green-800"
        />
        <StatCard
          title="المستحقات"
          value={`$${summaryStats.totalOutstanding.toLocaleString()}`}
          subtitle={`${summaryStats.outstandingCount} دفعة`}
          icon="⚠️"
          colorClass="bg-yellow-100 text-yellow-800"
        />
        <StatCard
          title="قيد المعالجة"
          value={`$${summaryStats.totalProcessing.toLocaleString()}`}
          subtitle={`${summaryStats.processingCount} دفعة`}
          icon="🔄"
          colorClass="bg-blue-100 text-blue-800"
        />
        <StatCard
          title="عدد الأيتام"
          value={summaryStats.totalOrphans}
          subtitle="يتيم مكفول"
          icon="👥"
          colorClass="bg-purple-100 text-purple-800"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-bg-card p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="البحث عن يتيم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setStatusFilter(PaymentStatus.Paid)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                statusFilter === PaymentStatus.Paid
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              مدفوع
            </button>
            <button
              onClick={() => setStatusFilter(PaymentStatus.Due)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                statusFilter === PaymentStatus.Due
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              مستحق
            </button>
            <button
              onClick={() => setStatusFilter(PaymentStatus.Overdue)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                statusFilter === PaymentStatus.Overdue
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              متأخر
            </button>
            <button
              onClick={() => setStatusFilter(PaymentStatus.Processing)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                statusFilter === PaymentStatus.Processing
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              قيد المعالجة
            </button>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'dueDate' | 'amount')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="name">ترتيب حسب الاسم</option>
            <option value="dueDate">ترتيب حسب تاريخ الاستحقاق</option>
            <option value="amount">ترتيب حسب المبلغ</option>
          </select>
        </div>
      </div>

      {/* Payments List */}
      {filteredAndSortedOrphans.length === 0 ? (
        <div className="bg-bg-card p-8 rounded-lg shadow-md text-center">
          <p className="text-text-secondary text-lg">
            {searchQuery || statusFilter !== 'all'
              ? 'لا توجد نتائج مطابقة للبحث'
              : 'لا توجد دفعات مسجلة'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedOrphans.map(orphan => {
            const isExpanded = expandedOrphans.has(orphan.uuid || orphan.id.toString());
            const orphanPayments = orphan.payments;
            const paidCount = orphanPayments.filter(p => p.status === PaymentStatus.Paid).length;
            const dueCount = orphanPayments.filter(p => p.status === PaymentStatus.Due).length;
            const overdueCount = orphanPayments.filter(p => p.status === PaymentStatus.Overdue).length;
            const processingCount = orphanPayments.filter(p => p.status === PaymentStatus.Processing).length;
            const totalAmount = orphanPayments.reduce((sum, p) => sum + p.amount, 0);

            return (
              <div key={orphan.id} className="bg-bg-card rounded-lg shadow-md overflow-hidden">
                {/* Orphan Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleOrphanExpansion(orphan.uuid || orphan.id.toString())}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar src={orphan.photoUrl} name={orphan.name} size="xl" className="border-2 border-gray-200" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-gray-800">{orphan.name}</h3>
                          <Link
                            to={`/orphan/${orphan.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:text-primary-hover text-sm font-semibold"
                          >
                            عرض الملف الشخصي →
                          </Link>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <span className="text-sm text-gray-600">
                            إجمالي الدفعات: <strong>{orphanPayments.length}</strong>
                          </span>
                          <span className="text-sm text-gray-600">
                            المبلغ الإجمالي: <strong>${totalAmount.toLocaleString()}</strong>
                          </span>
                          {paidCount > 0 && (
                            <span className="text-sm text-green-600">
                              مدفوع: <strong>{paidCount}</strong>
                            </span>
                          )}
                          {dueCount > 0 && (
                            <span className="text-sm text-yellow-600">
                              مستحق: <strong>{dueCount}</strong>
                            </span>
                          )}
                          {overdueCount > 0 && (
                            <span className="text-sm text-red-600">
                              متأخر: <strong>{overdueCount}</strong>
                            </span>
                          )}
                          {processingCount > 0 && (
                            <span className="text-sm text-blue-600">
                              قيد المعالجة: <strong>{processingCount}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
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
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {orphanPayments.length === 0 ? (
                      <div className="p-3 text-center text-text-secondary text-sm">
                        لا توجد دفعات مسجلة
                      </div>
                    ) : (
                      <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-gray-800">
                            تقويم الدفعات
                          </h4>
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold bg-white shadow-sm"
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {Array.from({ length: 12 }, (_, i) => {
                            const month = new Date(selectedYear, i, 1);
                            // Get payment for this month (same logic as orphan profile)
                            const paymentForMonth = orphanPayments.find(p => 
                              p.dueDate.getFullYear() === month.getFullYear() &&
                              p.dueDate.getMonth() === month.getMonth()
                            );

                            // Determine status (same logic as orphan profile)
                            const getStatusForMonth = () => {
                              if (!paymentForMonth) {
                                return { 
                                  status: 'لا يوجد', 
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
                                className={`${bgColor} p-3 rounded-lg text-center shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer`}
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
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
