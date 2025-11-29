import React, { useRef, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrphans } from '../hooks/useOrphans';
import { useSponsors } from '../hooks/useSponsors';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useAuth } from '../contexts/AuthContext';
import { findById } from '../utils/idMapper';
import { financialTransactions } from '../data';
import { Payment, PaymentStatus, Achievement, SpecialOccasion, Gift, TransactionType, Orphan, UpdateLog, ProgramParticipation } from '../types';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AvatarUpload } from './AvatarUpload';

const AddAchievementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (achievement: Omit<Achievement, 'id'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const resetAndClose = () => {
        setTitle('');
        setDescription('');
        setDate('');
        setMediaFile(null);
        if (mediaPreview) {
            URL.revokeObjectURL(mediaPreview);
        }
        setMediaPreview(null);
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !date.trim() || !description.trim()) {
            alert("يرجى ملء جميع الحقول: العنوان، الوصف، والتاريخ.");
            return;
        }
        
        const newAchievement: Omit<Achievement, 'id'> = {
            title,
            description,
            date: new Date(date),
            ...(mediaFile && {
                mediaUrl: mediaPreview!,
                mediaType: mediaFile.type.startsWith('image/') ? 'image' : 'video'
            })
        };
        onSave(newAchievement);
        resetAndClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={resetAndClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">إضافة إنجاز جديد</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الإنجاز" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" required />
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف الإنجاز" rows={3} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md resize-y" required />
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" required />
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">رفع صورة أو فيديو (اختياري)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.8-3.3-4.8-6.3-4.2-1.2.2-2.3.8-3.1 1.5-1-.7-2.3-1-3.6-1-3.3 0-6 2.7-6 6 0 1.3.4 2.5 1 3.5"/><path d="m20 17-5-5-4 4-3-3-5 5"/><path d="M16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M15 22H9a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2Z"/></svg>
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-hover focus-within:outline-none">
                                        <span>ارفع ملف</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,video/mp4" />
                                    </label>
                                    <p className="pr-1">أو اسحبه وأفلته هنا</p>
                                </div>
                                <p className="text-xs text-gray-500">صور أو فيديو (MP4)</p>
                            </div>
                        </div>
                    </div>

                    {mediaPreview && (
                        <div className="mt-4">
                            <h4 className="font-semibold text-sm mb-2">معاينة:</h4>
                            {mediaFile?.type.startsWith('image/') ? (
                                <img src={mediaPreview} alt="Preview" className="rounded-lg max-h-48 w-auto mx-auto" />
                            ) : (
                                <video src={mediaPreview} controls muted className="rounded-lg max-h-48 w-auto mx-auto" />
                            )}
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={resetAndClose} className="py-2 px-5 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 font-semibold">إلغاء</button>
                        <button type="submit" className="py-2 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold">حفظ الإنجاز</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddUpdateLogModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (note: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [note, setNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (note.trim()) {
            onSave(note.trim());
            setNote('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">إضافة تحديث/ملاحظة جديدة</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="اكتب ملاحظتك هنا..." rows={4} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md resize-y" required autoFocus/>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 font-semibold">إلغاء</button>
                        <button type="submit" className="py-2 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold">حفظ الملاحظة</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddEventModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string) => void;
    date: Date | null;
}> = ({ isOpen, onClose, onSave, date }) => {
    const [title, setTitle] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onSave(title.trim());
            setTitle('');
            onClose();
        }
    };

    if (!isOpen || !date) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2">إضافة حدث جديد</h3>
                <p className="text-sm text-gray-500 mb-4">
                    لـ {date.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الحدث (مثال: موعد طبيب الأسنان)" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" required autoFocus/>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 font-semibold">إلغاء</button>
                        <button type="submit" className="py-2 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold">حفظ الحدث</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const InfoCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; className?: string, headerActions?: React.ReactNode }> = ({ title, children, icon, className = '', headerActions }) => (
    <div className={`bg-bg-card p-6 rounded-xl shadow-sm ${className}`}>
        <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-light text-primary rounded-lg flex items-center justify-center">{icon}</div>
                <h3 className="text-xl font-bold text-gray-700">{title}</h3>
            </div>
            {headerActions}
        </div>
        <div className="text-text-secondary space-y-2">{children}</div>
    </div>
);

const YearlyPaymentSummary: React.FC<{ payments: Payment[] }> = ({ payments }) => {
    const year = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

    const getStatusForMonth = (month: Date) => {
        const paymentForMonth = payments.find(p => 
            p.dueDate.getFullYear() === month.getFullYear() &&
            p.dueDate.getMonth() === month.getMonth()
        );

        if (!paymentForMonth) {
            return { status: 'لا يوجد', color: 'bg-gray-200', textColor: 'text-gray-500' };
        }

        switch (paymentForMonth.status) {
            case PaymentStatus.Paid:
                return { status: 'مدفوع', color: 'bg-green-100', textColor: 'text-green-700' };
            case PaymentStatus.Due:
                return { status: 'مستحق', color: 'bg-yellow-100', textColor: 'text-yellow-700' };
            case PaymentStatus.Overdue:
                return { status: 'متأخر', color: 'bg-red-100', textColor: 'text-red-700' };
            default:
                return { status: 'غير معروف', color: 'bg-gray-200', textColor: 'text-gray-500' };
        }
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {months.map(month => {
                const { status, color, textColor } = getStatusForMonth(month);
                return (
                    <div key={month.getMonth()} className={`p-3 rounded-lg text-center ${color}`}>
                        <p className="font-semibold text-gray-800">{month.toLocaleDateString('ar-EG', { month: 'long' })}</p>
                        <p className={`text-sm font-medium ${textColor}`}>{status}</p>
                    </div>
                );
            })}
        </div>
    );
};

const FinancialRecordCard: React.FC<{ orphanId: number }> = ({ orphanId }) => {
    const relatedTransactions = useMemo(() => {
        return financialTransactions
            .filter(tx => 
                tx.orphanId === orphanId || 
                tx.receipt?.relatedOrphanIds?.includes(orphanId)
            )
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [orphanId]);

    const CashIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="6" x2="6" y1="12" y2="12"/><line x1="18" x2="18" y1="12" y2="12"/></svg>;
    
    return (
        <InfoCard title="السجل المالي" icon={CashIcon}>
            {relatedTransactions.length > 0 ? (
                <div className="space-y-3 -mx-2 max-h-60 overflow-y-auto pr-2">
                    {relatedTransactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${tx.type === TransactionType.Income ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {tx.type === TransactionType.Income ? 
                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> :
                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                                    }
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{tx.description}</p>
                                    <p className="text-xs text-gray-500">{tx.date.toLocaleDateString('ar-EG')}</p>
                                </div>
                            </div>
                            <span className={`text-lg font-bold ${tx.type === TransactionType.Income ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.type === TransactionType.Income ? '+' : '-'}${tx.amount.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p>لا توجد حركات مالية مسجلة لهذا اليتيم.</p>
            )}
        </InfoCard>
    );
};

const ProgramStatusPill: React.FC<{ status: ProgramParticipation['status'] }> = ({ status }) => {
    const styles = {
        'ملتحق': 'bg-blue-100 text-blue-800',
        'مكتمل': 'bg-green-100 text-green-800',
        'غير ملتحق': 'bg-gray-100 text-gray-800',
        'بحاجة للتقييم': 'bg-yellow-100 text-yellow-800',
    };
    return (
        <span className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 ${styles[status]}`}>
            {status}
        </span>
    );
};

const InteractiveCalendar: React.FC<{ 
    orphan: Orphan;
    onDayClick: (date: Date) => void;
}> = ({ orphan, onDayClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const events = useMemo(() => {
        const allEvents = new Map<string, { type: string; title: string }[]>();
        const addEvent = (date: Date, type: string, title: string) => {
            const dateString = date.toISOString().split('T')[0];
            if (!allEvents.has(dateString)) {
                allEvents.set(dateString, []);
            }
            allEvents.get(dateString)?.push({ type, title });
        };

        orphan.achievements.forEach(a => addEvent(a.date, 'achievement', a.title));
        orphan.specialOccasions.forEach(o => addEvent(o.date, 'occasion', o.title));
        orphan.gifts.forEach(g => addEvent(g.date, 'gift', g.item));
        orphan.payments.forEach(p => {
            if (p.status === PaymentStatus.Due || p.status === PaymentStatus.Overdue) {
                 addEvent(p.dueDate, 'payment', 'دفعة مستحقة');
            }
        });

        return allEvents;
    }, [orphan]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
    const today = new Date();
    
    // Arabic weekdays starting from Sunday
    const weekdays = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h4 className="text-lg font-bold text-gray-700">
                    {currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                </h4>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-text-secondary mb-2">
                {weekdays.map(day => <div key={day} className="font-semibold">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: daysInMonth }).map((_, day) => {
                    const dayNumber = day + 1;
                    const date = new Date(year, month, dayNumber);
                    const dateString = date.toISOString().split('T')[0];
                    const dayEvents = events.get(dateString);
                    const isToday = today.toDateString() === date.toDateString();
                    
                    return (
                        <div 
                            key={dayNumber} 
                            onClick={() => onDayClick(date)}
                            className={`h-12 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors duration-200 relative group ${isToday ? 'bg-primary text-white font-bold' : 'hover:bg-primary-light'}`}
                            title={`إضافة حدث ليوم ${dayNumber}`}
                        >
                            <span className="z-10">{dayNumber}</span>
                            {dayEvents && (
                                <div className="absolute bottom-1.5 flex gap-0.5 z-10">
                                    {dayEvents.slice(0, 3).map((event, i) => {
                                        const colors = {
                                            achievement: 'bg-green-500',
                                            occasion: 'bg-blue-500',
                                            gift: 'bg-yellow-500',
                                            payment: 'bg-red-500',
                                        };
                                        return <span key={i} className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : colors[event.type as keyof typeof colors] || 'bg-gray-400'}`}></span>;
                                    })}
                                </div>
                            )}
                            {dayEvents && (
                                <div className="absolute hidden group-hover:block bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded-md shadow-lg py-1 px-2 z-20 pointer-events-none">
                                    {dayEvents.map((e, i) => <div key={i} className="py-0.5">{e.title}</div>)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const OrphanProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orphans: orphansData, loading: orphansLoading, updateOrphan } = useOrphans();
  const { sponsors: sponsorsData } = useSponsors();
  const { userProfile } = useAuth();
  const isTeamMember = userProfile?.role === 'team_member';
  
  const orphan = useMemo(() => findById(orphansData, id || ''), [orphansData, id]);
  const sponsor = useMemo(() => orphan ? findById(sponsorsData, orphan.sponsorId) : undefined, [orphan, sponsorsData]);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'ذكر' as 'ذكر' | 'أنثى',
    healthStatus: '',
    grade: '',
    country: '',
    governorate: '',
    attendance: '',
    performance: '',
    familyStatus: '',
    housingStatus: '',
    guardian: '',
    sponsorshipType: '',
  });
  
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryReport, setSummaryReport] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  
  const [isNeedsModalOpen, setIsNeedsModalOpen] = useState(false);
  const [needsReport, setNeedsReport] = useState('');
  const [isNeedsLoading, setIsNeedsLoading] = useState(false);
  const [needsError, setNeedsError] = useState('');

  const [isAddAchievementModalOpen, setIsAddAchievementModalOpen] = useState(false);
  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [selectedDateForEvent, setSelectedDateForEvent] = useState<Date | null>(null);

  // Initialize edit form data when orphan loads or edit mode is enabled
  React.useEffect(() => {
    if (orphan && isEditMode) {
      setEditFormData({
        name: orphan.name,
        dateOfBirth: orphan.dateOfBirth.toISOString().split('T')[0],
        gender: orphan.gender,
        healthStatus: orphan.healthStatus,
        grade: orphan.grade,
        country: orphan.country,
        governorate: orphan.governorate,
        attendance: orphan.attendance,
        performance: orphan.performance,
        familyStatus: orphan.familyStatus,
        housingStatus: orphan.housingStatus,
        guardian: orphan.guardian,
        sponsorshipType: orphan.sponsorshipType,
      });
    }
  }, [orphan, isEditMode]);

  if (orphansLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!orphan) {
    return <div className="text-center text-red-500">لم يتم العثور على اليتيم.</div>;
  }

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!orphan?.uuid) return;
    
    setIsSaving(true);
    try {
      await updateOrphan(orphan.uuid, {
        name: editFormData.name,
        date_of_birth: editFormData.dateOfBirth,
        gender: editFormData.gender,
        health_status: editFormData.healthStatus,
        grade: editFormData.grade,
        country: editFormData.country,
        governorate: editFormData.governorate,
        attendance: editFormData.attendance,
        performance: editFormData.performance,
        family_status: editFormData.familyStatus,
        housing_status: editFormData.housingStatus,
        guardian: editFormData.guardian,
        sponsorship_type: editFormData.sponsorshipType,
      });
      setIsEditMode(false);
    } catch (error) {
      console.error('Error saving orphan:', error);
      alert('حدث خطأ أثناء حفظ التغييرات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAchievement = async (newAchievementData: Omit<Achievement, 'id'>) => {
    // TODO: Implement API call to save achievement to database
    // For now, this is a placeholder
    console.log('Adding achievement:', newAchievementData);
  };
  
    const handleAddUpdateLog = async (note: string) => {
        // TODO: Implement API call to save update log to database
        // For now, this is a placeholder
        console.log('Adding update log:', note);
        setIsAddLogModalOpen(false);
    };

    const handleDayClickForEvent = (date: Date) => {
        setSelectedDateForEvent(date);
        setIsAddEventModalOpen(true);
    };

    const handleAddEvent = async (title: string) => {
        if (!selectedDateForEvent || !orphan) return;

        // TODO: Implement API call to save special occasion to database
        // For now, this is a placeholder
        console.log('Adding special occasion:', { title, date: selectedDateForEvent, orphanId: orphan.id });
        setIsAddEventModalOpen(false);
        setSelectedDateForEvent(null);
    };

    const handleGenerateSummaryReport = async () => {
        if (!orphan) return;
        setIsSummaryModalOpen(true);
        setIsSummaryLoading(true);
        setSummaryError('');
        setSummaryReport('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const orphanData = {
                name: orphan.name,
                age: orphan.age,
                grade: orphan.grade,
                performance: orphan.performance,
                attendance: orphan.attendance,
                familyStatus: orphan.familyStatus,
                guardian: orphan.guardian,
                payments: orphan.payments.map(p => ({ status: p.status, amount: `$${p.amount}`, dueDate: p.dueDate.toISOString().split('T')[0] })),
                achievements: orphan.achievements.map(a => a.title),
            };

            const prompt = `
            بصفتك باحث اجتماعي في منظمة "فيء"، قم بإعداد تقرير موجز عن حالة اليتيم "${orphan.name}" بناءً على البيانات التالية. 
            التقرير يجب أن يكون موجهاً لمدير الحالة للمراجعة السريعة.
            
            ركز على النقاط التالية:
            1.  **ملخص عام:** قدم نبذة عن اليتيم (العمر، الصف الدراسي).
            2.  **الأداء الدراسي:** قيم مستواه بناءً على الأداء والانتظام.
            3.  **الوضع المالي:** لخص حالة الدفعات، مع الإشارة إلى أي مبالغ متأخرة أو مستحقة بالدولار الأمريكي ($).
            4.  **الإنجازات والجوانب الإيجابية:** اذكر أي إنجازات مسجلة لتعزيز معنوياته.
            5.  **توصية:** بناءً على ما سبق، قدم توصية سريعة (مثال: "يحتاج إلى متابعة دراسية"، "وضعه مستقر"، "يحتاج إلى دعم مالي عاجل").

            استخدم لغة عربية واضحة ومباشرة.

            البيانات:
            ${JSON.stringify(orphanData, null, 2)}
            `;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setSummaryReport(response.text);
        } catch (err) {
            console.error(err);
            setSummaryError('حدث خطأ أثناء إنشاء التقرير.');
        } finally {
            setIsSummaryLoading(false);
        }
    };
    
    const handleGenerateNeedsReport = async () => {
        if (!orphan) return;
        setIsNeedsModalOpen(true);
        setIsNeedsLoading(true);
        setNeedsError('');
        setNeedsReport('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Collect comprehensive data
            const orphanData = {
                ...orphan,
                payments: orphan.payments.map(p => ({ status: p.status, amount: p.amount, dueDate: p.dueDate.toISOString().split('T')[0] })),
                achievements: orphan.achievements.map(a => ({ ...a, date: a.date.toISOString().split('T')[0] })),
                specialOccasions: orphan.specialOccasions.map(o => ({ ...o, date: o.date.toISOString().split('T')[0] })),
            };

            const prompt = `
            بصفتك خبير في التنمية الاجتماعية ورعاية الأطفال في منظمة "فيء"، قم بتحليل البيانات الشاملة التالية لليتيم "${orphan.name}".
            مهمتك هي إنشاء "تقرير تقييم احتياجات" مفصل ومنظم.

            التقرير يجب أن يغطي النقاط التالية بوضوح:
            1.  **ملخص الوضع الحالي:** نبذة سريعة عن اليتيم.
            2.  **نقاط القوة:** حدد الجوانب الإيجابية والإنجازات التي تظهر في ملفه (أكاديمية, شخصية, إلخ).
            3.  **الجوانب التي تحتاج إلى دعم:** قسم هذا الجزء إلى فئات واضحة:
                *   **الدعم الأكاديمي:** هل مستواه الدراسي أو انتظامه يتطلب تدخلاً؟
                *   **الدعم الاجتماعي والنفسي:** بناءً على حالته الأسرية والسكنية, هل هناك احتياجات اجتماعية أو نفسية؟
                *   **الدعم المادي:** بناءً على حالة الدفعات المالية والهدايا المسجلة, هل هناك فجوات مادية؟
            4.  **توصيات وخطة عمل:** بناءً على التحليل، اقترح خطوات عملية ومحددة يمكن لفريق العمل اتخاذها لوضع خطة رعاية مخصصة. (مثال: "جدولة جلسة مع المرشد الأكاديمي", "توفير سلة غذائية", "التخطيط لهدية في مناسبته القادمة").

            يجب أن يكون التقرير مكتوباً بلغة عربية احترافية وسهل الفهم لمديري الحالات.

            البيانات:
            ${JSON.stringify(orphanData, null, 2)}
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setNeedsReport(response.text);
        } catch (err) {
            console.error(err);
            setNeedsError('حدث خطأ أثناء إنشاء تقرير الاحتياجات.');
        } finally {
            setIsNeedsLoading(false);
        }
    };


  const handleExportPDF = () => {
    const input = profileRef.current;
    if (input) {
        const actionBars = input.querySelectorAll('.mobile-action-bar');
        actionBars.forEach(bar => (bar as HTMLElement).style.display = 'none');
        
        const button = input.querySelector('#export-button-desktop') as HTMLElement;
        if(button) button.style.display = 'none';

        html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
            if(button) button.style.display = 'flex';
            actionBars.forEach(bar => (bar as HTMLElement).style.display = 'flex');

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`تقرير-${orphan.name}.pdf`);
        });
    }
  };

  const UserIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  const BookIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>;
  const HomeIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  const ShieldIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  const CalendarIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
  const DownloadIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
  const TrophyIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M8 21h8"/><path d="M12 17.5c-1.5 0-3-1-3-3.5V4.5A2.5 2.5 0 0 1 11.5 2h1A2.5 2.5 0 0 1 15 4.5V14c0 2.5-1.5 3.5-3 3.5Z"/></svg>;
  const GiftIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z"/></svg>;
  const SparklesIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;
  const HeartIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
  const FileTextIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
  const ClipboardCheckIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>;


  return (
    <>
    <div ref={profileRef} className="bg-transparent p-4 sm:p-0" style={{paddingBottom: '100px'}}>
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-bg-card p-8 rounded-xl shadow-sm flex flex-col md:flex-row items-center gap-8">
        {orphan.uuid ? (
          <AvatarUpload
            currentAvatarUrl={orphan.photoUrl}
            userId={orphan.uuid}
            type="orphan"
            onUploadComplete={(newUrl) => {
              // Refresh orphans to get updated avatar
              window.location.reload();
            }}
            size="lg"
          />
        ) : (
          <img src={orphan.photoUrl} alt={orphan.name} className="w-32 h-32 rounded-full object-cover ring-4 ring-primary-light" />
        )}
        <div className="text-center md:text-right flex-grow">
          {isEditMode ? (
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="text-4xl font-bold text-gray-800 bg-white border-2 border-primary rounded-lg px-4 py-2 w-full md:w-auto"
            />
          ) : (
            <h1 className="text-4xl font-bold text-gray-800">{orphan.name}</h1>
          )}
          <p className="text-lg text-text-secondary">{orphan.age} سنوات - {orphan.governorate}, {orphan.country}</p>
        </div>
        <div className="ms-auto hidden sm:flex gap-2">
          {isTeamMember && (
            <>
              {isEditMode ? (
                <>
                  <button onClick={handleCancelEdit} className="bg-gray-100 text-gray-700 font-semibold py-2 px-5 rounded-lg hover:bg-gray-200 transition-colors">
                    إلغاء
                  </button>
                  <button onClick={handleSaveEdit} disabled={isSaving} className="bg-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-primary/70 disabled:cursor-not-allowed flex items-center gap-2">
                    {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                </>
              ) : (
                <button onClick={handleEdit} className="bg-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  تعديل
                </button>
              )}
            </>
          )}
          <button id="export-button-desktop" onClick={handleExportPDF} className="bg-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2">
            {DownloadIcon}
            تصدير PDF
          </button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <InfoCard title="البيانات الشخصية" icon={UserIcon}>
            {isEditMode ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">تاريخ الميلاد:</label>
                  <input type="date" value={editFormData.dateOfBirth} onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">الجنس:</label>
                  <select value={editFormData.gender} onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as 'ذكر' | 'أنثى' })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md">
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">الحالة الصحية:</label>
                  <input type="text" value={editFormData.healthStatus} onChange={(e) => setEditFormData({ ...editFormData, healthStatus: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">القائم بالرعاية:</label>
                  <input type="text" value={editFormData.guardian} onChange={(e) => setEditFormData({ ...editFormData, guardian: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" />
                </div>
              </div>
            ) : (
              <>
                <p><strong>تاريخ الميلاد:</strong> {orphan.dateOfBirth.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p><strong>الجنس:</strong> {orphan.gender}</p>
                <p><strong>الحالة الصحية:</strong> {orphan.healthStatus}</p>
                <p><strong>القائم بالرعاية:</strong> {orphan.guardian}</p>
              </>
            )}
        </InfoCard>
        <InfoCard title="البيانات الدراسية" icon={BookIcon}>
            {isEditMode ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">المرحلة:</label>
                  <input type="text" value={editFormData.grade} onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">الانتظام:</label>
                  <input type="text" value={editFormData.attendance} onChange={(e) => setEditFormData({ ...editFormData, attendance: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">المستوى:</label>
                  <input type="text" value={editFormData.performance} onChange={(e) => setEditFormData({ ...editFormData, performance: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" />
                </div>
              </div>
            ) : (
              <>
                <p><strong>المرحلة:</strong> {orphan.grade}</p>
                <p><strong>الانتظام:</strong> {orphan.attendance}</p>
                <p><strong>المستوى:</strong> <span className="font-bold text-primary">{orphan.performance}</span></p>
              </>
            )}
        </InfoCard>
        <InfoCard title="الحالة الاجتماعية والسكن" icon={HomeIcon}>
            {isEditMode ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">العائلة:</label>
                  <input type="text" value={editFormData.familyStatus} onChange={(e) => setEditFormData({ ...editFormData, familyStatus: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">السكن:</label>
                  <input type="text" value={editFormData.housingStatus} onChange={(e) => setEditFormData({ ...editFormData, housingStatus: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">البلد:</label>
                  <input type="text" value={editFormData.country} onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">المحافظة:</label>
                  <input type="text" value={editFormData.governorate} onChange={(e) => setEditFormData({ ...editFormData, governorate: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" />
                </div>
              </div>
            ) : (
              <>
                <p><strong>العائلة:</strong> {orphan.familyStatus}</p>
                <p><strong>السكن:</strong> {orphan.housingStatus}</p>
              </>
            )}
        </InfoCard>
        <InfoCard title="الكفالة والمتابعة" icon={ShieldIcon}>
            {isEditMode ? (
              <div className="space-y-3">
                {sponsor ? (
                  <p><strong>الكافل:</strong>{' '}
                    <Link to={`/sponsor/${sponsor.id}`} className="text-primary hover:underline">{sponsor.name}</Link>
                  </p>
                ) : (
                  <p><strong>الكافل:</strong> غير محدد</p>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">نوع الكفالة:</label>
                  <input type="text" value={editFormData.sponsorshipType} onChange={(e) => setEditFormData({ ...editFormData, sponsorshipType: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" />
                </div>
              </div>
            ) : (
              <>
                {sponsor ? (
                  <p><strong>الكافل:</strong>{' '}
                    <Link to={`/sponsor/${sponsor.id}`} className="text-primary hover:underline">{sponsor.name}</Link>
                  </p>
                ) : (
                  <p><strong>الكافل:</strong> غير محدد</p>
                )}
                <p><strong>نوع الكفالة:</strong> {orphan.sponsorshipType}</p>
              </>
            )}
        </InfoCard>
      </div>

       <InfoCard title="البيانات الاجتماعية والشخصية" icon={HeartIcon} className="md:col-span-2">
            <div className="space-y-4">
                <div>
                    <h4 className="font-bold text-gray-800 mb-2">أفراد الأسرة</h4>
                    <div className="space-y-1">
                        {orphan.familyMembers.length > 0 ? orphan.familyMembers.map((member, index) => (
                            <p key={index}>- {member.relationship} (العمر: {member.age})</p>
                        )) : <p>لا توجد بيانات.</p>}
                    </div>
                </div>
                <div className="border-t pt-4">
                    <h4 className="font-bold text-gray-800 mb-2">الهوايات والأنشطة</h4>
                     {orphan.hobbies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                           {orphan.hobbies.map((hobby, index) => (
                                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">{hobby}</span>
                            ))}
                        </div>
                    ) : <p>لا توجد بيانات.</p>}
                </div>
                <div className="border-t pt-4">
                    <h4 className="font-bold text-gray-800 mb-2">الاحتياجات والأمنيات</h4>
                    {orphan.needsAndWishes.length > 0 ? (
                        <ul className="list-disc pr-5 space-y-1">
                            {orphan.needsAndWishes.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    ) : <p>لا توجد بيانات.</p>}
                </div>
            </div>
        </InfoCard>

        <InfoCard title="برامج فيء" icon={ClipboardCheckIcon} className="md:col-span-2">
            <div className="space-y-4">
                <div>
                    <h4 className="font-bold text-gray-800 mb-2">البرنامج التربوي</h4>
                    <div className="flex items-center gap-3">
                        <ProgramStatusPill status={orphan.educationalProgram.status} />
                        <p className="text-sm">{orphan.educationalProgram.details}</p>
                    </div>
                </div>
                <div className="border-t pt-4">
                    <h4 className="font-bold text-gray-800 mb-2">الدعم النفسي</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-semibold text-gray-700 text-sm mb-2">للطفل ({orphan.name})</p>
                            <div className="flex items-center gap-3">
                                <ProgramStatusPill status={orphan.psychologicalSupport.child.status} />
                                <p className="text-sm">{orphan.psychologicalSupport.child.details}</p>
                            </div>
                        </div>
                         <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-semibold text-gray-700 text-sm mb-2">للقائم بالرعاية ({orphan.guardian})</p>
                             <div className="flex items-center gap-3">
                                <ProgramStatusPill status={orphan.psychologicalSupport.guardian.status} />
                                <p className="text-sm">{orphan.psychologicalSupport.guardian.details}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </InfoCard>

       <div className="bg-bg-card p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-light text-primary rounded-lg flex items-center justify-center">{CalendarIcon}</div>
            <h3 className="text-xl font-bold text-gray-700">ملخص الدفعات السنوي ({new Date().getFullYear()})</h3>
        </div>
        <YearlyPaymentSummary payments={orphan.payments} />
      </div>

      <FinancialRecordCard orphanId={orphan.id} />
      
      <InfoCard title="تحليلات الذكاء الاصطناعي" icon={SparklesIcon} className="md:col-span-2">
        <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-800">موجز سريع للحالة</h4>
                <p className="text-sm my-2">احصل على تقرير فوري يلخص الوضع الأكاديمي والمالي لليتيم مع توصية سريعة.</p>
                <button onClick={handleGenerateSummaryReport} className="text-sm font-semibold py-2 px-4 bg-primary-light text-primary rounded-lg hover:bg-primary hover:text-white transition-colors w-full">
                    إنشاء موجز
                </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-800">تقرير تقييم الاحتياجات</h4>
                <p className="text-sm my-2">تحليل شامل لبيانات اليتيم لتحديد نقاط القوة والجوانب التي تحتاج إلى دعم.</p>
                <button onClick={handleGenerateNeedsReport} className="text-sm font-semibold py-2 px-4 bg-primary-light text-primary rounded-lg hover:bg-primary hover:text-white transition-colors w-full">
                    إنشاء تقرير احتياجات
                </button>
            </div>
        </div>
      </InfoCard>

        <InfoCard title="الرزنامة التفاعلية" icon={CalendarIcon} className="md:col-span-2">
          <InteractiveCalendar orphan={orphan} onDayClick={handleDayClickForEvent} />
        </InfoCard>

      <InfoCard
        title="سجل التحديثات"
        icon={FileTextIcon}
        className="md:col-span-2"
        headerActions={
            <button onClick={() => setIsAddLogModalOpen(true)} className="text-sm font-semibold py-1 px-3 bg-primary-light text-primary rounded-full hover:bg-primary hover:text-white transition-colors flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                إضافة
            </button>
        }
    >
        <div className="space-y-3 max-h-72 overflow-y-auto pr-2 -mr-2">
            {orphan.updateLogs.length > 0 ? orphan.updateLogs.map(log => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200/80">
                    <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-gray-800 text-sm">{log.author}</p>
                        <p className="text-xs text-gray-500">{log.date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <p className="text-sm">{log.note}</p>
                </div>
            )) : <p className="text-center py-4">لا توجد تحديثات مسجلة.</p>}
        </div>
    </InfoCard>

      <div className="grid md:grid-cols-3 gap-6">
        <InfoCard 
            title="الإنجازات" 
            icon={TrophyIcon} 
            className="md:col-span-2"
            headerActions={
                <button onClick={() => setIsAddAchievementModalOpen(true)} className="text-sm font-semibold py-1 px-3 bg-primary-light text-primary rounded-full hover:bg-primary hover:text-white transition-colors flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    إضافة
                </button>
            }
        >
          {orphan.achievements.length > 0 ? orphan.achievements.map(ach => (
            <div key={ach.id} className="p-3 bg-gray-50 rounded-lg">
                {ach.mediaUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden">
                        {ach.mediaType === 'image' ? (
                            <img src={ach.mediaUrl} alt={ach.title} className="w-full h-auto object-cover" />
                        ) : ach.mediaType === 'video' ? (
                            <video src={ach.mediaUrl} controls muted className="w-full h-auto bg-black" />
                        ) : null}
                    </div>
                )}
                <div>
                    <p className="font-bold text-gray-800">{ach.title} <span className="text-sm font-normal text-gray-500">- {ach.date.toLocaleDateString('ar-EG')}</span></p>
                    <p className="text-sm">{ach.description}</p>
                </div>
            </div>
          )) : <p>لا توجد إنجازات مسجلة.</p>}
        </InfoCard>
        <div className="space-y-6">
          <InfoCard title="مناسبات خاصة" icon={CalendarIcon}>
            {orphan.specialOccasions.length > 0 ? orphan.specialOccasions.map(occ => (
              <p key={occ.id}><strong>{occ.title}:</strong> {occ.date.toLocaleDateString('ar-EG')}</p>
            )) : <p>لا توجد مناسبات.</p>}
          </InfoCard>
          <InfoCard title="الهدايا" icon={GiftIcon}>
             {orphan.gifts.length > 0 ? orphan.gifts.map(gift => (
              <p key={gift.id} className="text-sm"><strong>{gift.item}</strong> من {gift.from}</p>
             )) : <p>لا توجد هدايا مسجلة.</p>}
          </InfoCard>
        </div>
      </div>
    </div>
    </div>
    
    {/* Mobile Action Bar */}
    <div className={`mobile-action-bar sm:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-2 grid gap-1 text-center ${isTeamMember && isEditMode ? 'grid-cols-6' : isTeamMember ? 'grid-cols-5' : 'grid-cols-4'}`}>
        <button onClick={() => navigate(-1)} className="flex flex-col items-center text-gray-600 hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            <span className="text-xs">رجوع</span>
        </button>
        {!isEditMode && (
          <>
            <button onClick={handleExportPDF} className="flex flex-col items-center text-gray-600 hover:text-primary">
              {DownloadIcon}
              <span className="text-xs">PDF</span>
            </button>
            <button onClick={handleGenerateSummaryReport} className="flex flex-col items-center text-gray-600 hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4"/><path d="M9 12h6"/><path d="M12 9v6"/><path d="M15 12h0"/></svg>
              <span className="text-xs">موجز</span>
            </button>
            <button onClick={handleGenerateNeedsReport} className="flex flex-col items-center text-gray-600 hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.09 16.05 19.5 20.5"/><path d="M6.12 6.12a9 9 0 0 0 11.76 11.76"/><path d="M17.88 17.88a9 9 0 0 0-11.76-11.76"/><path d="m3.5 7.5.01-.01"/><path d="m20.5 16.5.01-.01"/><path d="M12 2a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4v0a4 4 0 0 0 4-4v0a4 4 0 0 0-4-4Z"/><path d="M12 12a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4v0a4 4 0 0 0 4-4v0a4 4 0 0 0-4-4Z"/></svg>
              <span className="text-xs">احتياجات</span>
            </button>
          </>
        )}
        {isTeamMember && (
          <>
            <button onClick={isEditMode ? handleCancelEdit : handleEdit} className="flex flex-col items-center text-gray-600 hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              <span className="text-xs">{isEditMode ? 'إلغاء' : 'تعديل'}</span>
            </button>
            {isEditMode && (
              <button onClick={handleSaveEdit} disabled={isSaving} className="flex flex-col items-center text-gray-600 hover:text-primary disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                <span className="text-xs">{isSaving ? 'جاري...' : 'حفظ'}</span>
              </button>
            )}
          </>
        )}
    </div>

    {/* Summary Report Modal */}
    {isSummaryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">التقرير الموجز لـ {orphan.name}</h3>
                    <button onClick={() => setIsSummaryModalOpen(false)} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                {isSummaryLoading && <div className="text-center p-8">جاري إنشاء التقرير...</div>}
                {summaryError && <div className="text-red-600 bg-red-100 p-3 rounded">{summaryError}</div>}
                {summaryReport && <div className="whitespace-pre-wrap text-gray-700">{summaryReport}</div>}
            </div>
        </div>
    )}
    
     {/* Needs Report Modal */}
    {isNeedsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold">تقرير تقييم الاحتياجات لـ {orphan.name}</h3>
                    <button onClick={() => setIsNeedsModalOpen(false)} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                </div>
                {isNeedsLoading && <div className="text-center p-8">جاري تحليل البيانات وإنشاء التقرير...</div>}
                {needsError && <div className="text-red-600 bg-red-100 p-3 rounded">{needsError}</div>}
                {needsReport && <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans">{needsReport}</div>}
            </div>
        </div>
    )}

    {/* Add Achievement Modal */}
    <AddAchievementModal 
        isOpen={isAddAchievementModalOpen}
        onClose={() => setIsAddAchievementModalOpen(false)}
        onSave={handleAddAchievement}
    />

    {/* Add Update Log Modal */}
    <AddUpdateLogModal
        isOpen={isAddLogModalOpen}
        onClose={() => setIsAddLogModalOpen(false)}
        onSave={handleAddUpdateLog}
    />

    {/* Add Event Modal */}
    <AddEventModal 
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        onSave={handleAddEvent}
        date={selectedDateForEvent}
    />
    </>
  );
};

export default OrphanProfile;