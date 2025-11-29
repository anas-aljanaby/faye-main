import React, { useState, useMemo, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useSponsors } from '../hooks/useSponsors';
import { useOrphans } from '../hooks/useOrphans';
import { useAuth } from '../contexts/AuthContext';
import { financialTransactions } from '../data';
import { PaymentStatus, TransactionType, Sponsor, Orphan } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AvatarUpload } from './AvatarUpload';

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
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary-light text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z"/></svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-700">السجل المالي الذكي</h2>
                    <p className="text-text-secondary">نظرة شاملة على مساهماتك وتأثيرها</p>
                </div>
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
                                <img src={orphan.photoUrl} alt={orphan.name} className="w-10 h-10 rounded-full object-cover" />
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

const SponsorProfile: React.FC = () => {
    const { userProfile } = useAuth();
    const { sponsors: sponsorsData, loading: sponsorsLoading } = useSponsors();
    const { orphans: orphansData } = useOrphans();
    const navigate = useNavigate();
    const receiptRef = useRef<HTMLDivElement>(null);
    const orphansSectionRef = useRef<HTMLDivElement>(null);

    // Find the current sponsor based on user profile
    const sponsor = useMemo(() => {
        if (!userProfile || !sponsorsData.length) return null;
        return sponsorsData.find(s => s.uuid === userProfile.id);
    }, [userProfile, sponsorsData]);

    const sponsoredOrphans = useMemo(() => {
        if (!sponsor) return [];
        return orphansData.filter(o => sponsor.sponsoredOrphanIds.includes(o.id));
    }, [sponsor, orphansData]);

    if (sponsorsLoading) {
        return (
            <div className="text-center py-8">
                <svg className="animate-spin h-12 w-12 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-text-secondary">جاري التحميل...</p>
            </div>
        );
    }

    // Redirect team members away from sponsor profile
    if (userProfile && userProfile.role !== 'sponsor') {
        return <Navigate to="/" replace />;
    }

    if (!sponsor || !userProfile) {
        return (
            <div className="text-center text-red-500 py-8">
                <p>لم يتم العثور على معلومات الكافل.</p>
            </div>
        );
    }

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
                pdf.save(`ملف-الكافل-${sponsor.name}.pdf`);
            });
        }
    };

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
                          // Refresh sponsors to get updated avatar
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
                                <img src={orphan.photoUrl} alt={orphan.name} className="w-16 h-16 rounded-full object-cover" />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{orphan.name}</h3>
                                    <p className="text-sm text-text-secondary">{orphan.age} سنوات</p>
                                </div>
                            </Link>
                        ))}
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
                <button onClick={() => navigate(-1)} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    <span className="text-xs">رجوع</span>
                </button>
                <button onClick={() => orphansSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span className="text-xs">الأيتام</span>
                </button>
                <button onClick={() => navigate('/messages')} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span className="text-xs">رسالة</span>
                </button>
                <button onClick={handleExportPDF} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    <span className="text-xs">تصدير</span>
                </button>
            </div>
        </div>
    );
};

export default SponsorProfile;

