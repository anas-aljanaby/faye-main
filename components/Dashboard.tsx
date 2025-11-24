import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { orphans, sponsors, teamMembers, financialTransactions } from '../data';
import { TransactionStatus } from '../types';
import { GoogleGenAI } from "@google/genai";

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

const UpcomingOccasions = () => {
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

const LatestAchievements = () => {
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

const Dashboard: React.FC = () => {
    const [report, setReport] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError('');
        setReport('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const dataSummary = {
                totalOrphans: orphans.length,
                totalSponsors: sponsors.length,
                totalTeamMembers: teamMembers.length,
                orphans: orphans.map(o => ({
                    name: o.name,
                    age: o.age,
                    performance: o.performance,
                    payments: o.payments.map(p => ({ status: p.status, amount: p.amount, dueDate: p.dueDate.toISOString().split('T')[0] }))
                })),
                teamMembers: teamMembers.map(m => ({
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
              <UpcomingOccasions />
              <PendingApprovals />
              <LatestAchievements />
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">الأيتام</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {orphans.slice(0, 4).map(orphan => (
                <Link to={`/orphan/${orphan.id}`} key={orphan.id} className="bg-bg-card rounded-lg shadow-md p-4 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <img src={orphan.photoUrl} alt={orphan.name} className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-gray-100" />
                  <h3 className="text-lg font-semibold text-gray-800">{orphan.name}</h3>
                  <p className="text-sm text-text-secondary">{orphan.age} سنوات</p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">الكفلاء</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sponsors.map(sponsor => (
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
              {teamMembers.map(member => (
                <Link to={`/team/${member.id}`} key={member.id} className="bg-bg-card rounded-lg shadow-md p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <img src={member.avatarUrl} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
                    <p className="text-sm text-text-secondary">يتابع {member.assignedOrphanIds.length} أيتام</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
    );
};

export default Dashboard;