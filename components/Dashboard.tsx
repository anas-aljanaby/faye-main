import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useOrphans } from '../hooks/useOrphans';
import { useSponsors } from '../hooks/useSponsors';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useAuth } from '../contexts/AuthContext';
import { financialTransactions } from '../data';
import { TransactionStatus, Orphan, Sponsor, PaymentStatus, TransactionType } from '../types';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AvatarUpload } from './AvatarUpload';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';

const WidgetCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ title, icon, children }) => (
    <div className="bg-bg-card rounded-lg shadow-md p-5 h-full">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-light text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-gray-700">{title}</h3>
        </div>
        <div className="space-y-3">{children}</div>
    </div>
);

const UpcomingOccasions: React.FC<{ orphans: Orphan[] }> = ({ orphans }) => {
    const today = new Date();
    const upcoming = orphans
        .flatMap(o => o.specialOccasions.map(occ => ({ ...occ, orphanName: o.name, orphanId: o.id })))
        .filter(occ => occ.date >= today)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 3);

    return (
        <WidgetCard title="المناسبات القادمة" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z"/></svg>}>
            {upcoming.length > 0 ? (
                upcoming.map(occ => (
                    <div key={occ.id} className="text-sm">
                        <p className="font-semibold text-gray-800">{occ.title} لـ <Link to={`/orphan/${occ.orphanId}`} className="text-primary hover:underline">{occ.orphanName}</Link></p>
                        <p className="text-text-secondary">{occ.date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}</p>
                    </div>
                ))
            ) : (
                <p className="text-sm text-center text-text-secondary pt-4">لا توجد مناسبات قادمة.</p>
            )}
        </WidgetCard>
    );
};

const PendingApprovals = () => {
    const pending = financialTransactions.filter(tx => tx.status === TransactionStatus.Pending);

    return (
        <WidgetCard title="الموافقات المالية المعلقة" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}>
            {pending.length > 0 ? (
                <>
                    <p className="font-bold text-2xl text-yellow-600">{pending.length} معاملات</p>
                    <p className="text-sm text-text-secondary">بإجمالي مبلغ <span className="font-semibold">${pending.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}</span></p>
                    <Link to="/financial-system" className="text-sm font-semibold text-primary hover:underline mt-2 inline-block">مراجعة الآن &larr;</Link>
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
         <WidgetCard title="أحدث الإنجازات" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M8 21h8"/><path d="M12 17.5c-1.5 0-3-1-3-3.5V4.5A2.5 2.5 0 0 1 11.5 2h1A2.5 2.5 0 0 1 15 4.5V14c0 2.5-1.5 3.5-3 3.5Z"/></svg>}>
            {latest.length > 0 ? (
                 latest.map(ach => (
                    <div key={ach.id} className="text-sm bg-gray-50 p-2 rounded-lg">
                        <p className="font-semibold text-gray-800 truncate">{ach.title}</p>
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
    const sponsorTransactions = useMemo(() => {
        return financialTransactions.filter(
            tx => tx.type === TransactionType.Income && tx.receipt?.sponsorName === sponsor.name
        );
    }, [sponsor.name]);

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

    const StatCard: React.FC<{ title: string; value: string | number; icon: string; colorClass: string; }> = ({ title, value, icon, colorClass }) => (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${colorClass}`}>
            <div className="text-2xl">{icon}</div>
            <div>
                <p className="text-sm font-semibold opacity-80">{title}</p>
                <p className="text-xl font-bold">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="bg-bg-card p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-light text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z"/></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-700">السجل المالي الذكي</h2>
                        <p className="text-text-secondary">نظرة شاملة على مساهماتك وتأثيرها</p>
                    </div>
                </div>
                <Link
                    to="/payments"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="10" rx="2"/>
                        <path d="M6 12h.01"/>
                        <path d="M10 12h.01"/>
                        <path d="M14 12h.01"/>
                    </svg>
                    عرض جميع الدفعات
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard
                    title="إجمالي التبرعات"
                    value={`$${totalDonations.toLocaleString()}`}
                    icon="💰"
                    colorClass="bg-green-100 text-green-800"
                />
                <StatCard
                    title="دفعات متأخرة"
                    value={paymentStats.overdue}
                    icon="⏳"
                    colorClass="bg-red-100 text-red-800"
                />
                <StatCard
                    title="دفعات مستحقة"
                    value={paymentStats.due}
                    icon="🔔"
                    colorClass="bg-yellow-100 text-yellow-800"
                />
            </div>

            <div className="space-y-3 mb-6">
                <h3 className="font-bold text-gray-800">حالة دفعات الأيتام</h3>
                {sponsoredOrphans.map(orphan => {
                    const overdueCount = orphan.payments.filter(p => p.status === PaymentStatus.Overdue).length;
                    const dueCount = orphan.payments.filter(p => p.status === PaymentStatus.Due).length;
                    let statusText = "جميع الدفعات مسددة";
                    let statusColor = "text-green-600";
                    if (overdueCount > 0) {
                        statusText = `لديه ${overdueCount} دفعة متأخرة`;
                        statusColor = "text-red-600";
                    } else if (dueCount > 0) {
                        statusText = `لديه ${dueCount} دفعة مستحقة`;
                        statusColor = "text-yellow-600";
                    }

                    return (
                        <Link to={`/orphan/${orphan.id}`} key={orphan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <Avatar src={orphan.photoUrl} name={orphan.name} size="md" />
                                <span className="font-semibold text-gray-800">{orphan.name}</span>
                            </div>
                            <span className={`text-sm font-semibold ${statusColor}`}>{statusText}</span>
                        </Link>
                    );
                })}
            </div>

            <div className="border-t pt-4">
                 <h3 className="font-bold text-gray-800 mb-3">أحدث التبرعات</h3>
                 <div className="space-y-2">
                     {sponsorTransactions.slice(0, 3).map(tx => (
                         <div key={tx.id} className="flex justify-between items-center p-2 rounded-lg">
                            <div>
                                <p className="font-semibold text-gray-700 text-sm">{tx.description}</p>
                                <p className="text-xs text-gray-500">{tx.date.toLocaleDateString('ar-EG')}</p>
                            </div>
                            <span className="font-bold text-green-600 text-lg">${tx.amount.toLocaleString()}</span>
                         </div>
                     ))}
                      {sponsorTransactions.length === 0 && <p className="text-sm text-center text-gray-500 py-4">لا توجد تبرعات مسجلة مؤخراً.</p>}
                 </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const [report, setReport] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const { orphans: orphansData } = useOrphans();
    const { sponsors: sponsorsData } = useSponsors();
    const { teamMembers: teamMembersData } = useTeamMembers();
    const { userProfile } = useAuth();
    const receiptRef = useRef<HTMLDivElement>(null);
    const orphansSectionRef = useRef<HTMLDivElement>(null);
    const [assignedTeamMembers, setAssignedTeamMembers] = useState<Array<{ id: string; name: string; avatar_url?: string }>>([]);
    const [manager, setManager] = useState<{ id: string; name: string; avatar_url?: string } | null>(null);
    const [assignedOrphanIds, setAssignedOrphanIds] = useState<string[]>([]);

    // Find the current sponsor based on user profile
    const sponsor = useMemo(() => {
        if (!userProfile || !sponsorsData.length || userProfile.role !== 'sponsor') return null;
        return sponsorsData.find(s => s.uuid === userProfile.id);
    }, [userProfile, sponsorsData]);

    const sponsoredOrphans = useMemo(() => {
        if (!sponsor || assignedOrphanIds.length === 0) return [];
        return orphansData.filter(o => o.uuid && assignedOrphanIds.includes(o.uuid));
    }, [sponsor, orphansData, assignedOrphanIds]);

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
                    const members = assignedData
                        .map(item => item.team_member)
                        .filter(Boolean) as Array<{ id: string; name: string; avatar_url?: string }>;
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

                // Fetch manager from same organization
                const { data: allTeamMembers } = await supabase
                    .from('user_profiles')
                    .select('id, name, avatar_url')
                    .eq('organization_id', userProfile.organization_id)
                    .eq('role', 'team_member');

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
        if(input) {
            const mobileBar = input.querySelector('.mobile-action-bar');
            if (mobileBar) (mobileBar as HTMLElement).style.display = 'none';

            html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
                if (mobileBar) (mobileBar as HTMLElement).style.display = 'grid';

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
        if (!sponsor) {
            return (
                <div className="text-center text-red-500 py-8">
                    <p>لم يتم العثور على معلومات الكافل.</p>
                </div>
            );
        }

        const DownloadIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
        const ShieldIcon = <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

        return (
            <div ref={receiptRef}>
                <div className="space-y-8" style={{ paddingBottom: '80px' }}>
                    {/* Sponsor Header */}
                    <div className="bg-bg-card p-6 rounded-xl shadow-md flex flex-col sm:flex-row items-center gap-6">
                        {sponsor.uuid ? (
                          <AvatarUpload
                            currentAvatarUrl={sponsor.avatarUrl}
                            userId={sponsor.uuid}
                            type="sponsor"
                            onUploadComplete={(newUrl) => {
                              window.location.reload();
                            }}
                            size="md"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center text-primary-text font-bold text-4xl flex-shrink-0">
                            {sponsor.name.charAt(0)}
                          </div>
                        )}
                        <div className="text-center sm:text-right flex-grow">
                            <h1 className="text-3xl font-bold text-gray-800">{sponsor.name}</h1>
                            <p className="text-text-secondary">كافل مميز في فيء</p>
                        </div>
                         <div className="flex items-center gap-3">
                            <button onClick={handleExportPDF} className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-semibold">
                                {DownloadIcon}
                                <span className="hidden sm:inline">تصدير</span>
                            </button>
                        </div>
                    </div>

                    <div ref={orphansSectionRef}>
                        <h2 className="text-2xl font-bold text-gray-700 mb-4">الأيتام المكفولين ({sponsoredOrphans.length})</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sponsoredOrphans.map(orphan => (
                                <Link key={orphan.id} to={`/orphan/${orphan.id}`} className="bg-white rounded-lg shadow p-4 flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <Avatar src={orphan.photoUrl} name={orphan.name} size="xl" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{orphan.name}</h3>
                                        <p className="text-sm text-text-secondary">{orphan.age} سنوات</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Team Members Section */}
                    <div className="bg-bg-card p-6 rounded-xl shadow-md">
                        <h2 className="text-2xl font-bold text-gray-700 mb-4">فريق المتابعة</h2>
                        <div className="space-y-4">
                            {assignedTeamMembers.length > 0 ? (
                                <>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-3">الأعضاء المعينون</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {assignedTeamMembers.map(member => (
                                            <Link 
                                                key={member.id} 
                                                to={`/team/${member.id}`}
                                                className="bg-white rounded-lg shadow p-4 flex items-center gap-4 hover:shadow-lg transition-all"
                                            >
                                                <Avatar src={member.avatar_url} name={member.name} size="lg" />
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">{member.name}</h3>
                                                    <p className="text-sm text-text-secondary">عضو فريق</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-text-secondary text-center py-4">لم يتم تعيين أي أعضاء فريق بعد</p>
                            )}
                            
                            {manager && (
                                <div className="mt-6 pt-6 border-t">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-3">مدير المنظمة</h3>
                                    <Link 
                                        to={`/team/${manager.id}`}
                                        className="bg-blue-50 rounded-lg shadow p-4 flex items-center gap-4 hover:shadow-lg transition-all"
                                    >
                                        <Avatar src={manager.avatar_url} name={manager.name} size="lg" />
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{manager.name}</h3>
                                            <p className="text-sm text-text-secondary">مدير</p>
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <SponsorFinancialRecord sponsor={sponsor} sponsoredOrphans={sponsoredOrphans} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-yellow-50 p-6 rounded-lg shadow-md flex flex-col items-center text-center transform -rotate-2 hover:rotate-0 hover:scale-105 transition-transform duration-300">
                             <div className="absolute -top-4 -right-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 drop-shadow-sm"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">تواصل معنا</h3>
                            <p className="text-text-secondary mb-4">
                                لأية استفسارات، نحن متواجدون من الأحد إلى الخميس، 9 صباحًا - 5 مساءً.
                            </p>
                            <a href="tel:+123456789" className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold py-2 px-6 rounded-full hover:bg-primary-hover transition-colors shadow-lg hover:shadow-primary/40">
                                <span>اتصل بنا الآن</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </a>
                        </div>
                         <Link to="/policies" className="bg-blue-50 p-6 rounded-lg shadow-md flex flex-col items-center text-center transform rotate-1 hover:rotate-0 hover:scale-105 transition-transform duration-300 relative">
                            <div className="absolute -top-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 drop-shadow-sm"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" /></svg>
                            </div>
                            <div className="mt-4 text-blue-600">
                                {ShieldIcon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mt-2">سياسات فيء</h3>
                            <p className="text-text-secondary text-sm mt-1">
                                اطلع على شروط وأحكام المنظمة
                            </p>
                        </Link>
                    </div>
                </div>
                {/* Mobile Action Bar */}
                <div className="mobile-action-bar sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-2 grid grid-cols-4 gap-1 text-center z-40">
                    <button onClick={() => window.history.back()} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        <span className="text-xs">رجوع</span>
                    </button>
                    <button onClick={() => orphansSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <span className="text-xs">الأيتام</span>
                    </button>
                    <Link to="/messages" className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <span className="text-xs">رسالة</span>
                    </Link>
                    <button onClick={handleExportPDF} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        <span className="text-xs">تصدير</span>
                    </button>
                </div>
            </div>
        );
    }

    // Team member dashboard (existing content)

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError('');
        setReport('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const dataSummary = {
                totalOrphans: orphansData.length,
                totalSponsors: sponsorsData.length,
                totalTeamMembers: teamMembersData.length,
                orphans: orphansData.map(o => ({
                    name: o.name,
                    age: o.age,
                    performance: o.performance,
                    payments: o.payments.map(p => ({ status: p.status, amount: p.amount, dueDate: p.dueDate.toISOString().split('T')[0] }))
                })),
                teamMembers: teamMembersData.map(m => ({
                    name: m.name,
                    pendingTasks: m.tasks.filter(t => !t.completed).length,
                    totalTasks: m.tasks.length,
                }))
            };

            const prompt = `
            أنت محلل بيانات في منظمة "فيء" لرعاية الأيتام. بناءً على بيانات JSON التالية، قم بإنشاء تقرير موجز باللغة العربية.
            يجب أن يكون التقرير احترافيًا وسهل القراءة للمديرين.
            ركز على النقاط الرئيسية:
            1. نظرة عامة سريعة على الأرقام (عدد الأيتام، الكفلاء، الموظفين).
            2. تحليل الوضع المالي: اذكر إجمالي المبالغ المتأخرة والمستحقة بالدولار الأمريكي ($) وعددها.
            3. تحليل أداء فريق العمل: اذكر إجمالي عدد المهام المعلقة.
            4. ملاحظات هامة: هل هناك أيتام يحتاجون إلى اهتمام خاص (بناءً على الأداء الدراسي أو الدفعات المتأخرة)؟ اذكر أسماءهم إن وجدوا.
            
            استخدم تنسيقاً واضحاً ومقروءاً. ابدأ بعنوان "التقرير الموجز للوضع الحالي". قسم التقرير إلى فقرات بعناوين فرعية واضحة (مثل: نظرة عامة، الوضع المالي، أداء الفريق، توصيات).
            لا تستخدم تنسيق Markdown.

            البيانات:
            ${JSON.stringify(dataSummary, null, 2)}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            setReport(response.text);

        } catch (err) {
            console.error(err);
            setError('حدث خطأ أثناء إنشاء التقرير. يرجى المحاولة مرة أخرى لاحقاً.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-12">
          <section>
            <div className="bg-bg-card rounded-lg shadow-md p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-700">التقرير الموجز بالذكاء الاصطناعي</h2>
                <button
                  onClick={handleGenerateReport}
                  disabled={isLoading}
                  className="bg-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:bg-primary/70 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>جاري الإنشاء...</span>
                    </>
                  ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                        <span>إنشاء تقرير</span>
                    </>
                  )}
                </button>
              </div>
              {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">{error}</div>}
              <div className="bg-gray-50/80 p-4 rounded-md min-h-[150px] text-gray-700 whitespace-pre-wrap font-sans text-sm leading-relaxed border">
                {isLoading && !report && <div className="flex justify-center items-center h-full text-gray-400">يتم الآن تحليل البيانات...</div>}
                {report ? report : <p className="text-center flex justify-center items-center h-full text-gray-400">انقر على الزر لإنشاء تقرير موجز باستخدام الذكاء الاصطناعي حول الوضع الحالي للمنظمة.</p>}
              </div>
               {report && !isLoading && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-600">إجراءات مقترحة:</h4>
                        <Link to="/financial-system" className="text-sm font-semibold py-1.5 px-3 bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors">عرض الدفعات المتأخرة</Link>
                        <Link to="/messages" className="text-sm font-semibold py-1.5 px-3 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors">صياغة رسالة تذكير للكفلاء</Link>
                        <Link to="/team" className="text-sm font-semibold py-1.5 px-3 bg-indigo-100 text-indigo-800 rounded-full hover:bg-indigo-200 transition-colors">متابعة فريق العمل</Link>
                    </div>
                )}
            </div>
          </section>

          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <UpcomingOccasions orphans={orphansData} />
              <PendingApprovals />
              <LatestAchievements orphans={orphansData} />
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">الأيتام</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {orphansData.slice(0, 4).map(orphan => (
                <Link to={`/orphan/${orphan.id}`} key={orphan.id} className="bg-bg-card rounded-lg shadow-md p-4 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <Avatar src={orphan.photoUrl} name={orphan.name} size="xl" className="mb-4 border-4 border-gray-100 !w-24 !h-24 !text-3xl" />
                  <h3 className="text-lg font-semibold text-gray-800">{orphan.name}</h3>
                  <p className="text-sm text-text-secondary">{orphan.age} سنوات</p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">الكفلاء</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sponsorsData.map(sponsor => (
                <Link to={`/sponsor/${sponsor.id}`} key={sponsor.id} className="bg-bg-card rounded-lg shadow-md p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-primary-text font-bold text-xl">
                    {sponsor.name.charAt(0)}
                  </div>
                  <div>
                      <h3 className="text-lg font-semibold text-gray-800">{sponsor.name}</h3>
                      <p className="text-sm text-text-secondary">يكفل {sponsor.sponsoredOrphanIds.length} يتيم</p>
                    </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">فريق العمل</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembersData
                .sort((a, b) => {
                  const aIsCurrentUser = a.uuid === userProfile?.id;
                  const bIsCurrentUser = b.uuid === userProfile?.id;
                  if (aIsCurrentUser && !bIsCurrentUser) return -1;
                  if (!aIsCurrentUser && bIsCurrentUser) return 1;
                  return 0;
                })
                .map(member => (
                <Link to={`/team/${member.id}`} key={member.id} className="bg-bg-card rounded-lg shadow-md p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <Avatar src={member.avatarUrl} name={member.name} size="lg" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
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