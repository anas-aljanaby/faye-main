import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import TeamList from './TeamList';
import { useDelegates, Delegate, DelegateInput } from '../hooks/useDelegates';

type HrSection = 
    | 'regulations' 
    | 'team'
    | 'delegates'
    | 'volunteers' 
    | 'attendance' 
    | 'leaves' 
    | 'holidays' 
    | 'incentives' 
    | 'circulars' 
    | 'disciplinary' 
    | 'advances' 
    | 'salaries';

// --- VOLUNTEERS SECTION DATA & TYPES ---

type VolunteerClassification = 'موظف' | 'مروج' | 'مانح' | 'سلبي';

interface VolunteerLogEntry {
    id: number;
    volunteerName: string;
    opportunity: string;
    date: Date;
    tasks: string;
    durationHours: number;
    completionPercentage: number;
    performanceRating: number; // 1 to 5
    classification: VolunteerClassification;
    achievements: string;
}

const initialVolunteerData: VolunteerLogEntry[] = [
    { id: 1, volunteerName: 'علياء منصور', opportunity: 'حملة الشتاء', date: new Date('2024-01-15'), tasks: 'توزيع البطانيات والمواد الغذائية', durationHours: 5, completionPercentage: 100, performanceRating: 5, classification: 'مروج', achievements: 'قامت بتنظيم فريق التوزيع بكفاءة عالية.' },
    { id: 2, volunteerName: 'محمد عبدالله', opportunity: 'يوم اليتيم العالمي', date: new Date('2024-04-01'), tasks: 'تنظيم الأنشطة الترفيهية للأطفال', durationHours: 8, completionPercentage: 100, performanceRating: 4, classification: 'موظف', achievements: '' },
    { id: 3, volunteerName: 'سارة كريم', opportunity: 'حملة الشتاء', date: new Date('2024-01-20'), tasks: 'فرز وتعبئة المساعدات', durationHours: 4, completionPercentage: 80, performanceRating: 3, classification: 'سلبي', achievements: 'بحاجة لمزيد من المبادرة.' },
    { id: 4, volunteerName: 'أحمد حسين', opportunity: 'تبرعات رمضان', date: new Date('2024-03-25'), tasks: 'جمع التبرعات في المراكز التجارية', durationHours: 6, completionPercentage: 100, performanceRating: 5, classification: 'مانح', achievements: 'تجاوز الهدف المحدد لجمع التبرعات بنسبة 20%.' },
    { id: 5, volunteerName: 'فاطمة الزهراء', opportunity: 'يوم اليتيم العالمي', date: new Date('2024-04-01'), tasks: 'تقديم الدعم النفسي والإرشاد', durationHours: 8, completionPercentage: 100, performanceRating: 5, classification: 'موظف', achievements: 'حصلت على ردود فعل إيجابية جداً من الأطفال.' },
];

const opportunities = [...new Set(initialVolunteerData.map(v => v.opportunity))];
const classifications: VolunteerClassification[] = ['موظف', 'مروج', 'مانح', 'سلبي'];


// --- UI HELPER COMPONENTS FOR VOLUNTEERS TABLE ---

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${value}%` }}></div>
    </div>
);

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex">
        {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.368-2.446a1 1 0 00-1.176 0l-3.368 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.07 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
            </svg>
        ))}
    </div>
);

const ClassificationPill: React.FC<{ classification: VolunteerClassification }> = ({ classification }) => {
    const styles = {
        'موظف': 'bg-blue-100 text-blue-800',
        'مروج': 'bg-green-100 text-green-800',
        'مانح': 'bg-purple-100 text-purple-800',
        'سلبي': 'bg-gray-100 text-gray-800',
    };
    return <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[classification]}`}>{classification}</span>;
};

// --- ADD/EDIT VOLUNTEER MODAL ---
const AddEditVolunteerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (log: Omit<VolunteerLogEntry, 'id'> | VolunteerLogEntry) => void;
    logToEdit?: VolunteerLogEntry | null;
}> = ({ isOpen, onClose, onSave, logToEdit }) => {
    const [formData, setFormData] = useState<Omit<VolunteerLogEntry, 'id' | 'date'> & { date: string }>(() => {
        const dateToUse = logToEdit ? new Date(logToEdit.date) : new Date();
        const initialDate = new Date(dateToUse.getTime() - (dateToUse.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
        
        return {
            volunteerName: logToEdit?.volunteerName || '',
            opportunity: logToEdit?.opportunity || '',
            date: initialDate,
            tasks: logToEdit?.tasks || '',
            durationHours: logToEdit?.durationHours || 0,
            completionPercentage: logToEdit?.completionPercentage || 0,
            performanceRating: logToEdit?.performanceRating || 3,
            classification: logToEdit?.classification || 'موظف',
            achievements: logToEdit?.achievements || '',
        };
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = { ...formData, date: new Date(formData.date) };
        if(logToEdit) {
            onSave({ ...finalData, id: logToEdit.id });
        } else {
            onSave(finalData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-6">{logToEdit ? 'تعديل سجل متطوع' : 'إضافة سجل جديد'}</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="volunteerName" value={formData.volunteerName} onChange={handleChange} placeholder="اسم المتطوع" className="md:col-span-2 w-full p-2 border rounded" required />
                    <input name="opportunity" value={formData.opportunity} onChange={handleChange} placeholder="الفرصة التطوعية" className="w-full p-2 border rounded" required />
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded" required />
                    <textarea name="tasks" value={formData.tasks} onChange={handleChange} placeholder="المهام المسندة" className="md:col-span-2 w-full p-2 border rounded" required />
                    <input type="number" name="durationHours" value={formData.durationHours} onChange={handleChange} placeholder="عدد ساعات التطوع" className="w-full p-2 border rounded" required />
                    <select name="classification" value={formData.classification} onChange={handleChange} className="w-full p-2 border rounded">
                        {classifications.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div>
                        <label className="text-sm">نسبة الإنجاز: {formData.completionPercentage}%</label>
                        <input type="range" name="completionPercentage" min="0" max="100" step="10" value={formData.completionPercentage} onChange={handleChange} className="w-full" />
                    </div>
                    <div>
                        <label className="text-sm">تقييم جودة الأداء</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button type="button" key={star} onClick={() => setFormData(p => ({...p, performanceRating: star}))} className="focus:outline-none">
                                <svg className={`w-6 h-6 ${star <= formData.performanceRating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.368-2.446a1 1 0 00-1.176 0l-3.368 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.07 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" /></svg>
                            </button>
                           ))}
                        </div>
                    </div>
                    <textarea name="achievements" value={formData.achievements} onChange={handleChange} placeholder="إنجازات نوعية استثنائية (اختياري)" className="md:col-span-2 w-full p-2 border rounded" />
                    <div className="flex justify-end gap-3 pt-4 md:col-span-2">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 font-semibold">إلغاء</button>
                        <button type="submit" className="py-2 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- KPI SECTION ---

const KPICard: React.FC<{
    title: string;
    value: string;
    note?: string;
    icon: React.ReactNode;
}> = ({ title, value, note, icon }) => (
    <div className="bg-gray-50 p-4 rounded-lg border relative group">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-light text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <h4 className="text-md font-bold text-gray-800">{title}</h4>
                <p className="text-2xl font-bold text-primary">{value}</p>
            </div>
        </div>
        {note && (
            <>
                <div className="absolute top-2 right-2 text-gray-400 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                </div>
                <div className="absolute hidden group-hover:block bottom-full mb-2 w-72 bg-gray-800 text-white text-xs rounded-md shadow-lg p-2 z-20 pointer-events-none">
                    {note}
                </div>
            </>
        )}
    </div>
);

const VolunteerKPIs: React.FC<{ logs: VolunteerLogEntry[] }> = ({ logs }) => {
    const kpiData = useMemo(() => {
        const uniqueVolunteers = new Set(logs.map(log => log.volunteerName));
        const totalVolunteers = uniqueVolunteers.size;
        if (totalVolunteers === 0) return {};

        // KPIs with direct calculation
        const totalHours = logs.reduce((sum, log) => sum + log.durationHours, 0);
        const avgPerformance = logs.reduce((sum, log) => sum + log.performanceRating, 0) / logs.length;
        const avgCompletion = logs.reduce((sum, log) => sum + log.completionPercentage, 0) / logs.length;
        const employeeCount = logs.filter(l => l.classification === 'موظف').length;
        const donorCount = logs.filter(l => l.classification === 'مانح').length;
        
        const promoters = logs.filter(l => ['مروج', 'مانح'].includes(l.classification)).length;
        const detractors = logs.filter(l => l.classification === 'سلبي').length;
        const nps = ((promoters / totalVolunteers) - (detractors / totalVolunteers)) * 100;

        // KPIs with assumed data
        const assumedHourlyWage = 15; // دولار
        const assumedProgramCost = 5000; // دولار
        const assumedTotalApplicants = 20;
        const assumedStartDate = new Date();
        assumedStartDate.setMonth(assumedStartDate.getMonth() - 6);
        const assumedInitialVolunteers = 7;
        
        return {
            value_of_volunteer_hours: { value: `$${(totalHours * assumedHourlyWage).toLocaleString()}`, note: 'تم الحساب بناءً على متوسط أجر افتراضي قدره 15$ للساعة.' },
            strategic_goals_achievement_rate: { value: '80%', note: 'قيمة افتراضية. يتطلب ربط أداء المتطوعين بالأهداف الاستراتيجية للمنظمة.' },
            quality_of_volunteer_work: { value: `${avgPerformance.toFixed(1)} / 5`, note: 'متوسط تقييم الأداء من سجلات المتطوعين.' },
            task_closure_rate: { value: `${avgCompletion.toFixed(0)}%`, note: 'متوسط نسبة إنجاز المهام من سجلات المتطوعين.' },
            average_cost_per_volunteer: { value: `$${(assumedProgramCost / totalVolunteers).toFixed(0)}`, note: 'تم الحساب بناءً على مصروفات برنامج افتراضية قدرها 5000$.' },
            conversion_rate_recruitment: { value: `${((totalVolunteers / assumedTotalApplicants) * 100).toFixed(0)}%`, note: 'تم الحساب بناءً على عدد متقدمين إجمالي افتراضي (20 متقدم).' },
            avg_time_to_first_assignment: { value: '30 يوم', note: 'قيمة افتراضية. يتطلب تاريخ تسجيل لكل متطوع.' },
            skills_utilization_rate: { value: '75%', note: 'قيمة افتراضية. يتطلب ربط مهارات المتطوعين بالمهام الموكلة.' },
            retention_rate: { value: `${((totalVolunteers / assumedInitialVolunteers) * 100).toFixed(0)}%`, note: 'تم الحساب بناءً على عدد متطوعين افتراضي في بداية الفترة (7 متطوعين).' },
            nps: { value: `${nps.toFixed(0)}`, note: 'تم الحساب بناءً على تصنيف المتطوعين (المروجون - السالبون).' },
            diversity_index: { value: '0.65', note: 'قيمة افتراضية. يتطلب بيانات ديموغرافية للمتطوعين.' },
            social_event_participation: { value: '60%', note: 'قيمة افتراضية. يتطلب سجل حضور للفعاليات.' },
            volunteers_to_leaders: { value: '20%', note: 'قيمة افتراضية. يتطلب تتبع مسار المتطوعين القيادي.' },
            avg_new_skills_acquired: { value: '2', note: 'قيمة افتراضية. يتطلب نظام تتبع للمهارات المكتسبة.' },
            volunteer_to_employee: { value: `${((employeeCount / totalVolunteers) * 100).toFixed(0)}%`, note: 'تم الحساب من المتطوعين المصنفين كـ "موظف".' },
            volunteer_to_donor: { value: `${((donorCount / totalVolunteers) * 100).toFixed(0)}%`, note: 'تم الحساب من المتطوعين المصنفين كـ "مانح".' },
        };
    }, [logs]);

    const kpiList = [
        { id: 'value_of_volunteer_hours', title: 'قيمة الساعات التطوعية', icon: '💰' },
        { id: 'strategic_goals_achievement_rate', title: 'تحقيق الأهداف الاستراتيجية', icon: '🎯' },
        { id: 'quality_of_volunteer_work', title: 'جودة العمل التطوعي', icon: '⭐' },
        { id: 'task_closure_rate', title: 'معدل إغلاق المهام', icon: '✅' },
        { id: 'average_cost_per_volunteer', title: 'متوسط التكلفة للمتطوع', icon: '💸' },
        { id: 'conversion_rate_recruitment', title: 'التحويل من طلب لتوظيف', icon: '🤝' },
        { id: 'avg_time_to_first_assignment', title: 'متوسط وقت أول تكليف', icon: '⏱️' },
        { id: 'skills_utilization_rate', title: 'الاستفادة من المهارات', icon: '🛠️' },
        { id: 'retention_rate', title: 'الاحتفاظ بالمتطوعين', icon: '🔄' },
        { id: 'nps', title: 'صافي نقاط المروجين (NPS)', icon: '📈' },
        { id: 'diversity_index', title: 'تنوع المتطوعين', icon: '🌍' },
        { id: 'social_event_participation', title: 'المشاركة بالفعاليات', icon: '🎉' },
        { id: 'volunteers_to_leaders', title: 'التحول إلى قادة', icon: '👑' },
        { id: 'avg_new_skills_acquired', title: 'متوسط المهارات المكتسبة', icon: '🧠' },
        { id: 'volunteer_to_employee', title: 'التحول إلى موظفين', icon: '💼' },
        { id: 'volunteer_to_donor', title: 'التحول إلى مانحين', icon: '💖' },
    ];
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">مؤشرات أداء المتطوعين</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {kpiList.map(kpi => {
                    const data = (kpiData as any)[kpi.id];
                    if (!data) return null;
                    return (
                        <KPICard 
                            key={kpi.id} 
                            title={kpi.title} 
                            value={data.value}
                            note={data.note}
                            icon={<span className="text-xl">{kpi.icon}</span>} 
                        />
                    );
                })}
            </div>
             <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                <h4 className="font-bold mb-2">ملاحظة هامة</h4>
                <p className="text-sm">
                    بعض المؤشرات تم حسابها بناءً على قيم افتراضية نظراً لعدم توفر البيانات الكاملة في النظام حالياً (مثل: التكاليف المالية، عدد المتقدمين، تواريخ التسجيل، وغيرها). مرر الفأرة فوق أي بطاقة لعرض طريقة الحساب.
                    للحصول على قراءات دقيقة، يرجى استكمال البيانات المطلوبة.
                </p>
            </div>
        </div>
    );
};

// --- MAIN VOLUNTEERS SECTION COMPONENT ---
const VolunteersSection: React.FC = () => {
    const [logs, setLogs] = useState<VolunteerLogEntry[]>(initialVolunteerData);
    const [searchQuery, setSearchQuery] = useState('');
    const [opportunityFilter, setOpportunityFilter] = useState('all');
    const [classificationFilter, setClassificationFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<VolunteerLogEntry | null>(null);

    const summary = useMemo(() => {
        const uniqueVolunteers = new Set(logs.map(log => log.volunteerName));
        // FIX: Explicitly set the generic type for `reduce` to `number`.
        // This resolves an issue where TypeScript might incorrectly infer the type of the accumulator `sum`,
        // leading to an arithmetic operation error.
        const totalHours = logs.reduce<number>((sum, log) => sum + log.durationHours, 0);
        const opportunityCounts = logs.reduce((acc: Record<string, number>, log) => {
            acc[log.opportunity] = (acc[log.opportunity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const mostActiveOpportunity = Object.entries(opportunityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        return {
            totalVolunteers: uniqueVolunteers.size,
            totalHours,
            mostActiveOpportunity
        };
    }, [logs]);
    
    const filteredLogs = useMemo(() => {
        return logs.filter(log => 
            (log.volunteerName.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (opportunityFilter === 'all' || log.opportunity === opportunityFilter) &&
            (classificationFilter === 'all' || log.classification === classificationFilter)
        ).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [logs, searchQuery, opportunityFilter, classificationFilter]);
    
    const handleSave = (logData: Omit<VolunteerLogEntry, 'id'> | VolunteerLogEntry) => {
        if ('id' in logData) { // Editing
            setLogs(prev => prev.map(l => l.id === logData.id ? logData : l));
        } else { // Adding
            setLogs(prev => [{ ...logData, id: Date.now() }, ...prev]);
        }
        setIsModalOpen(false);
        setEditingLog(null);
    };

    const handleEdit = (log: VolunteerLogEntry) => {
        setEditingLog(log);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                     <h2 className="text-2xl font-bold text-gray-800">سجل المتطوعين الذكي</h2>
                     <button onClick={() => { setEditingLog(null); setIsModalOpen(true); }} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                         إضافة سجل جديد
                     </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-sm text-gray-600">إجمالي المتطوعين</p>
                        <p className="text-2xl font-bold text-primary">{summary.totalVolunteers}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-sm text-gray-600">إجمالي الساعات التطوعية</p>
                        <p className="text-2xl font-bold text-primary">{summary.totalHours}</p>
                    </div>
                     <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-sm text-gray-600">الفرصة الأكثر نشاطاً</p>
                        <p className="text-2xl font-bold text-primary truncate">{summary.mostActiveOpportunity}</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ابحث بالاسم..." className="flex-grow p-2 border rounded-lg" />
                    <select value={opportunityFilter} onChange={e => setOpportunityFilter(e.target.value)} className="p-2 border rounded-lg bg-white">
                        <option value="all">كل الفرص</option>
                        {opportunities.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                     <select value={classificationFilter} onChange={e => setClassificationFilter(e.target.value)} className="p-2 border rounded-lg bg-white">
                        <option value="all">كل التصنيفات</option>
                        {classifications.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">اسم المتطوع</th>
                                <th className="p-3">الفرصة التطوعية</th>
                                <th className="p-3">المهام المسندة</th>
                                <th className="p-3">عدد الساعات</th>
                                <th className="p-3">نسبة الإنجاز</th>
                                <th className="p-3">جودة الأداء</th>
                                <th className="p-3">التصنيف</th>
                                <th className="p-3">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log, index) => (
                                <tr key={log.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3 font-semibold">{log.volunteerName}</td>
                                    <td className="p-3">{log.opportunity}</td>
                                    <td className="p-3 text-gray-500 max-w-xs truncate" title={log.tasks}>{log.tasks}</td>
                                    <td className="p-3 text-center">{log.durationHours}</td>
                                    <td className="p-3"><ProgressBar value={log.completionPercentage} /></td>
                                    <td className="p-3"><StarRating rating={log.performanceRating} /></td>
                                    <td className="p-3"><ClassificationPill classification={log.classification} /></td>
                                    <td className="p-3">
                                        <button onClick={() => handleEdit(log)} className="text-blue-600 hover:text-blue-800 p-1">تعديل</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredLogs.length === 0 && <p className="text-center text-gray-500 py-10">لا توجد نتائج مطابقة.</p>}
                </div>
            </div>

            <div className="border-t pt-8 mt-8">
                <VolunteerKPIs logs={logs} />
            </div>

            <AddEditVolunteerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                logToEdit={editingLog}
            />
        </div>
    );
};

// --- DELEGATES SECTION ---

interface AddEditDelegateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (delegate: DelegateInput) => void;
    delegateToEdit?: Delegate | null;
}

const AddEditDelegateModal: React.FC<AddEditDelegateModalProps> = ({ isOpen, onClose, onSave, delegateToEdit }) => {
    const [formData, setFormData] = useState<DelegateInput>({
        name: delegateToEdit?.name || '',
        task: delegateToEdit?.task || '',
        address: delegateToEdit?.address || '',
        emails: delegateToEdit?.emails || [''],
        phones: delegateToEdit?.phones || [''],
    });

    // Reset form when modal opens with different delegate
    React.useEffect(() => {
        if (isOpen) {
            setFormData({
                name: delegateToEdit?.name || '',
                task: delegateToEdit?.task || '',
                address: delegateToEdit?.address || '',
                emails: delegateToEdit?.emails?.length ? delegateToEdit.emails : [''],
                phones: delegateToEdit?.phones?.length ? delegateToEdit.phones : [''],
            });
        }
    }, [isOpen, delegateToEdit]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEmailChange = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            emails: prev.emails.map((email, i) => i === index ? value : email)
        }));
    };

    const handlePhoneChange = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            phones: prev.phones.map((phone, i) => i === index ? value : phone)
        }));
    };

    const addEmail = () => {
        setFormData(prev => ({ ...prev, emails: [...prev.emails, ''] }));
    };

    const removeEmail = (index: number) => {
        if (formData.emails.length > 1) {
            setFormData(prev => ({ ...prev, emails: prev.emails.filter((_, i) => i !== index) }));
        }
    };

    const addPhone = () => {
        setFormData(prev => ({ ...prev, phones: [...prev.phones, ''] }));
    };

    const removePhone = (index: number) => {
        if (formData.phones.length > 1) {
            setFormData(prev => ({ ...prev, phones: prev.phones.filter((_, i) => i !== index) }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Filter out empty emails and phones
        const cleanedData = {
            ...formData,
            emails: formData.emails.filter(email => email.trim() !== ''),
            phones: formData.phones.filter(phone => phone.trim() !== ''),
        };
        onSave(cleanedData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-6">{delegateToEdit ? 'تعديل مندوب' : 'إضافة مندوب جديد'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
                        <input 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            placeholder="اسم المندوب" 
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">المهمة</label>
                        <textarea 
                            name="task" 
                            value={formData.task || ''} 
                            onChange={handleChange} 
                            placeholder="وصف المهمة" 
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                            rows={2}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                        <input 
                            name="address" 
                            value={formData.address || ''} 
                            onChange={handleChange} 
                            placeholder="العنوان" 
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                            <button 
                                type="button" 
                                onClick={addEmail}
                                className="text-primary hover:text-primary-hover text-sm font-medium flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                إضافة
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.emails.map((email, index) => (
                                <div key={index} className="flex gap-2">
                                    <input 
                                        type="email"
                                        value={email} 
                                        onChange={(e) => handleEmailChange(index, e.target.value)} 
                                        placeholder="example@email.com" 
                                        className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                                        dir="ltr"
                                    />
                                    {formData.emails.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => removeEmail(index)}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
                            <button 
                                type="button" 
                                onClick={addPhone}
                                className="text-primary hover:text-primary-hover text-sm font-medium flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                إضافة
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.phones.map((phone, index) => (
                                <div key={index} className="flex gap-2">
                                    <input 
                                        type="tel"
                                        value={phone} 
                                        onChange={(e) => handlePhoneChange(index, e.target.value)} 
                                        placeholder="رقم الهاتف" 
                                        className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                                        dir="ltr"
                                    />
                                    {formData.phones.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => removePhone(index)}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 font-semibold">إلغاء</button>
                        <button type="submit" className="py-2 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DelegatesSection: React.FC = () => {
    const { delegates, loading, error, addDelegate, updateDelegate, deleteDelegate } = useDelegates();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDelegate, setEditingDelegate] = useState<Delegate | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filteredDelegates = useMemo(() => {
        return delegates.filter(delegate =>
            delegate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (delegate.task && delegate.task.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (delegate.address && delegate.address.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [delegates, searchQuery]);

    const handleSave = async (delegateData: DelegateInput) => {
        if (editingDelegate) {
            await updateDelegate(editingDelegate.id, delegateData);
        } else {
            await addDelegate(delegateData);
        }
        setIsModalOpen(false);
        setEditingDelegate(null);
    };

    const handleEdit = (delegate: Delegate) => {
        setEditingDelegate(delegate);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المندوب؟')) {
            setDeletingId(id);
            await deleteDelegate(id);
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-600 py-20">
                <p>حدث خطأ: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-800">المندوبين</h2>
                <button 
                    onClick={() => { setEditingDelegate(null); setIsModalOpen(true); }} 
                    className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    إضافة مندوب
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">إجمالي المندوبين</p>
                    <p className="text-2xl font-bold text-primary">{delegates.length}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">مع بريد إلكتروني</p>
                    <p className="text-2xl font-bold text-primary">{delegates.filter(d => d.emails && d.emails.length > 0).length}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">مع رقم هاتف</p>
                    <p className="text-2xl font-bold text-primary">{delegates.filter(d => d.phones && d.phones.length > 0).length}</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-3">
                <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder="ابحث بالاسم أو المهمة أو العنوان..." 
                    className="flex-grow p-2 border rounded-lg" 
                />
            </div>

            {/* Delegates Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="bg-gray-100 text-gray-600">
                        <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">الاسم</th>
                            <th className="p-3">المهمة</th>
                            <th className="p-3">العنوان</th>
                            <th className="p-3">البريد الإلكتروني</th>
                            <th className="p-3">رقم الهاتف</th>
                            <th className="p-3">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDelegates.map((delegate, index) => (
                            <tr key={delegate.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">{index + 1}</td>
                                <td className="p-3 font-semibold">{delegate.name}</td>
                                <td className="p-3 text-gray-500 max-w-xs truncate" title={delegate.task || ''}>{delegate.task || '-'}</td>
                                <td className="p-3 text-gray-500">{delegate.address || '-'}</td>
                                <td className="p-3 text-gray-500" dir="ltr">
                                    {delegate.emails && delegate.emails.length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                            {delegate.emails.map((email, i) => (
                                                <span key={i} className="block">{email}</span>
                                            ))}
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="p-3 text-gray-500" dir="ltr">
                                    {delegate.phones && delegate.phones.length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                            {delegate.phones.map((phone, i) => (
                                                <span key={i} className="block">{phone}</span>
                                            ))}
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleEdit(delegate)} 
                                            className="text-blue-600 hover:text-blue-800 p-1"
                                        >
                                            تعديل
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(delegate.id)} 
                                            className="text-red-600 hover:text-red-800 p-1"
                                            disabled={deletingId === delegate.id}
                                        >
                                            {deletingId === delegate.id ? 'جاري...' : 'حذف'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredDelegates.length === 0 && (
                    <p className="text-center text-gray-500 py-10">
                        {delegates.length === 0 ? 'لا يوجد مندوبين. قم بإضافة مندوب جديد.' : 'لا توجد نتائج مطابقة.'}
                    </p>
                )}
            </div>

            <AddEditDelegateModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingDelegate(null); }}
                onSave={handleSave}
                delegateToEdit={editingDelegate}
            />
        </div>
    );
};

const hrSections: { id: HrSection; title: string; icon: React.ReactNode }[] = [
    { id: 'regulations', title: 'اللائحة', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg> },
    { id: 'team', title: 'الموظفون', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: 'delegates', title: 'المندوبين', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: 'volunteers', title: 'المتطوعون', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8.3-15 15.7"/><path d="m15 8.3-11 11.4"/><path d="m19 12.3-1.4-1.4"/><path d="m15 16.3-1.4-1.4"/></svg> },
    { id: 'attendance', title: 'الحاضرين والإنصراف', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { id: 'leaves', title: 'الاجازات', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
    { id: 'holidays', title: 'العطلات الرسمية', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg> },
    { id: 'incentives', title: 'الحوافز والجوائز', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M8 21h8"/><path d="M12 17.5c-1.5 0-3-1-3-3.5V4.5A2.5 2.5 0 0 1 11.5 2h1A2.5 2.5 0 0 1 15 4.5V14c0 2.5-1.5 3.5-3 3.5Z"/></svg> },
    { id: 'circulars', title: 'التعميمات الادارية', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11v2a2 2 0 0 0 2 2h3l7 7V2L8 9H5a2 2 0 0 0-2 2z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> },
    { id: 'disciplinary', title: 'الجزاءات التأديبية', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h.79a4.5 4.5 0 1 1 0 9Z"/><line x1="12" x2="12" y1="12" y2="22"/><line x1="12" x2="12" y1="2" y2="3"/></svg> },
    { id: 'advances', title: 'السلف', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { id: 'salaries', title: 'الرواتب', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="6" x2="6" y1="12" y2="12"/><line x1="18" x2="18" y1="12" y2="12"/></svg> },
];


const PlaceholderContent: React.FC<{ title: string }> = ({ title }) => (
    <div className="text-center text-gray-500 py-20 flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p>محتوى هذا القسم سيتم إضافته قريباً.</p>
    </div>
);


const HumanResources: React.FC = () => {
    const [activeSection, setActiveSection] = useState<HrSection>('volunteers');

    const renderContent = () => {
        const section = hrSections.find(s => s.id === activeSection);
        if (!section) return null;

        if (activeSection === 'volunteers') {
            return <VolunteersSection />;
        }

        if (activeSection === 'team') {
            return <TeamList embedded />;
        }

        if (activeSection === 'delegates') {
            return <DelegatesSection />;
        }

        return <PlaceholderContent title={section.title} />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold text-gray-800">إدارة الموارد البشرية</h1>
                
                {/* Horizontal Tab Navigation */}
                <div className="border-b border-gray-200 overflow-x-auto">
                    <nav className="flex gap-2 min-w-max" role="tablist">
                        {hrSections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                role="tab"
                                aria-selected={activeSection === section.id}
                                className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all whitespace-nowrap border-b-2 ${
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
            
            {/* Main Content Area */}
            <main className="bg-bg-card p-6 rounded-xl shadow-sm min-h-[400px]">
                {renderContent()}
            </main>
        </div>
    );
};

export default HumanResources;