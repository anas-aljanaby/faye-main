import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrphansBasic, useOrphanDetail } from '../hooks/useOrphans';
import { useOccasions } from '../hooks/useOccasions';
import { useSponsorsBasic } from '../hooks/useSponsors';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useAuth } from '../contexts/AuthContext';
import { findById } from '../utils/idMapper';
import { financialTransactions } from '../data';
import { Payment, PaymentStatus, Achievement, SpecialOccasion, Gift, TransactionType, Orphan, UpdateLog, ProgramParticipation } from '../types';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AvatarUpload } from './AvatarUpload';
import { supabase } from '../lib/supabase';
import { withUserContext } from '../lib/supabaseClient';
import Avatar from './Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import OptimizedImage from './OptimizedImage';

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

const EventModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (title: string) => void;
    onUpdate: (occasionId: string, title: string) => void;
    onDelete: (occasionId: string) => void;
    date: Date | null;
    existingEvents: { id: string; title: string; type: string }[];
}> = ({ isOpen, onClose, onAdd, onUpdate, onDelete, date, existingEvents }) => {
    const [newTitle, setNewTitle] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTitle.trim()) {
            onAdd(newTitle.trim());
            setNewTitle('');
            setIsAdding(false);
        }
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId && editingTitle.trim()) {
            onUpdate(editingId, editingTitle.trim());
            setEditingId(null);
            setEditingTitle('');
        }
    };

    const handleDelete = (id: string) => {
        onDelete(id);
        setDeleteConfirmId(null);
    };

    const startEditing = (id: string, title: string) => {
        setEditingId(id);
        setEditingTitle(title);
        setIsAdding(false);
        setDeleteConfirmId(null);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingTitle('');
    };

    const handleClose = () => {
        setNewTitle('');
        setEditingId(null);
        setEditingTitle('');
        setIsAdding(false);
        setDeleteConfirmId(null);
        onClose();
    };

    if (!isOpen || !date) return null;

    // Filter to only show editable occasions (type === 'occasion')
    const editableEvents = existingEvents.filter(e => e.type === 'occasion');
    const otherEvents = existingEvents.filter(e => e.type !== 'occasion');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-bold">الأحداث</h3>
                        <p className="text-sm text-gray-500">
                            {date.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                </div>

                {/* Existing Editable Events */}
                {editableEvents.length > 0 && (
                    <div className="space-y-2 mb-4">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">المناسبات المسجلة</h4>
                        {editableEvents.map(event => (
                            <div key={event.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                {editingId === event.id ? (
                                    <form onSubmit={handleEditSubmit} className="space-y-2">
                                        <input
                                            type="text"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button type="submit" className="py-1.5 px-4 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-hover">
                                                حفظ
                                            </button>
                                            <button type="button" onClick={cancelEditing} className="py-1.5 px-4 bg-gray-100 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-200">
                                                إلغاء
                                            </button>
                                        </div>
                                    </form>
                                ) : deleteConfirmId === event.id ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-red-600 font-semibold">هل أنت متأكد من حذف "{event.title}"؟</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleDelete(event.id)} className="py-1.5 px-4 bg-red-500 text-white rounded-md text-sm font-semibold hover:bg-red-600">
                                                نعم، احذف
                                            </button>
                                            <button onClick={() => setDeleteConfirmId(null)} className="py-1.5 px-4 bg-gray-100 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-200">
                                                إلغاء
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            <span className="text-gray-800">{event.title}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => startEditing(event.id, event.title)}
                                                className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-md"
                                                title="تعديل"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(event.id)}
                                                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md"
                                                title="حذف"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Other Events (non-editable) */}
                {otherEvents.length > 0 && (
                    <div className="space-y-2 mb-4">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">أحداث أخرى</h4>
                        {otherEvents.map((event, idx) => {
                            const colors: Record<string, { bg: string; dot: string }> = {
                                achievement: { bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
                                gift: { bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
                                payment: { bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
                            };
                            const color = colors[event.type] || { bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-500' };
                            return (
                                <div key={`${event.type}-${idx}`} className={`${color.bg} border rounded-lg p-3`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${color.dot}`}></span>
                                        <span className="text-gray-800">{event.title}</span>
                                        <span className="text-xs text-gray-500">
                                            ({event.type === 'achievement' ? 'إنجاز' : event.type === 'gift' ? 'هدية' : event.type === 'payment' ? 'دفعة' : 'آخر'})
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add New Event */}
                {isAdding ? (
                    <form onSubmit={handleAddSubmit} className="space-y-3 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-600">إضافة مناسبة جديدة</h4>
                        <input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="عنوان المناسبة (مثال: موعد طبيب الأسنان)"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold text-sm">
                                حفظ
                            </button>
                            <button type="button" onClick={() => { setIsAdding(false); setNewTitle(''); }} className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm">
                                إلغاء
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => { setIsAdding(true); setEditingId(null); setDeleteConfirmId(null); }}
                        className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        إضافة مناسبة جديدة
                    </button>
                )}

                {existingEvents.length === 0 && !isAdding && (
                    <p className="text-center text-gray-500 text-sm mt-4">لا توجد أحداث في هذا اليوم</p>
                )}
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
    occasions: SpecialOccasion[];
    onDayClick: (date: Date, events: { id: string; type: string; title: string }[]) => void;
}> = ({ orphan, occasions, onDayClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const events = useMemo(() => {
        const allEvents = new Map<string, { id: string; type: string; title: string }[]>();
        const addEvent = (date: Date, type: string, title: string, id: string) => {
            const dateString = date.toISOString().split('T')[0];
            if (!allEvents.has(dateString)) {
                allEvents.set(dateString, []);
            }
            allEvents.get(dateString)?.push({ id, type, title });
        };

        orphan.achievements.forEach(a => addEvent(a.date, 'achievement', a.title, a.id));
        // Use occasions from hook instead of orphan.specialOccasions
        occasions.forEach(o => addEvent(o.date, 'occasion', o.title, o.id));
        orphan.gifts.forEach(g => addEvent(g.date, 'gift', g.item, g.id));
        orphan.payments.forEach(p => {
            if (p.status === PaymentStatus.Due || p.status === PaymentStatus.Overdue) {
                 addEvent(p.dueDate, 'payment', 'دفعة مستحقة', p.id);
            }
        });

        return allEvents;
    }, [orphan, occasions]);

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
                            onClick={() => onDayClick(date, dayEvents || [])}
                            className={`h-12 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors duration-200 relative group ${isToday ? 'bg-primary text-white font-bold' : 'hover:bg-primary-light'}`}
                            title={dayEvents && dayEvents.length > 0 ? `${dayEvents.length} حدث` : `إضافة حدث ليوم ${dayNumber}`}
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


// --- New Design Helper Components ---

const Lightbox: React.FC<{ src: string; type: 'image' | 'video'; onClose: () => void }> = ({ src, type, onClose }) => (
    <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={onClose}
    >
        <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div className="max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {type === 'image' ? (
                <OptimizedImage src={src} alt="Full view" className="max-h-[90vh] max-w-full rounded-lg shadow-2xl" />
            ) : (
                <video src={src} controls autoPlay className="max-h-[90vh] max-w-full rounded-lg shadow-2xl" />
            )}
        </div>
    </motion.div>
);

const TabButton: React.FC<{ active: boolean; label: string; onClick: () => void; icon?: React.ReactNode }> = ({ active, label, onClick, icon }) => (
    <button
        onClick={onClick}
        className={`relative px-6 py-3 text-sm font-bold transition-colors duration-200 flex items-center gap-2 whitespace-nowrap
        ${active ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
    >
        {icon}
        {label}
        {active && (
            <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
        )}
    </button>
);

const EditableField: React.FC<{ 
    label: string; 
    value: string | number; 
    isEditing: boolean; 
    onChange: (val: string) => void;
    type?: 'text' | 'number' | 'date' | 'select';
    options?: string[];
}> = ({ label, value, isEditing, onChange, type = 'text', options }) => {
    return (
        <div className="mb-1">
            <span className="text-xs text-gray-500 block mb-0.5">{label}</span>
            {isEditing ? (
                type === 'select' && options ? (
                    <select 
                        value={value} 
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full p-1.5 border rounded-lg text-sm bg-white focus:ring-1 focus:ring-primary"
                    >
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                ) : (
                    <input 
                        type={type} 
                        value={value} 
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full p-1.5 border rounded-lg text-sm focus:ring-1 focus:ring-primary"
                    />
                )
            ) : (
                <p className="font-semibold text-gray-800 text-sm min-h-[1.25rem]">{value || '—'}</p>
            )}
        </div>
    );
};

const OrphanProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Use lightweight list hook only to map numeric ID to orphan UUID
  const { orphans: orphansIndex, loading: orphansLoading } = useOrphansBasic();
  const orphanFromIndex = useMemo(() => findById(orphansIndex, id || ''), [orphansIndex, id]);
  const orphanUuid = orphanFromIndex?.uuid || null;
  const { orphan, loading: orphanLoading, error: orphanError, updateOrphan } = useOrphanDetail(orphanUuid);
  const { occasions: allOccasions, addOccasion, updateOccasion, deleteOccasion } = useOccasions();
  const { sponsors: sponsorsData } = useSponsorsBasic();
  const { userProfile, canEditOrphans } = useAuth();
  const isTeamMember = userProfile?.role === 'team_member';
  const hasEditPermission = isTeamMember && canEditOrphans();
  
  const sponsor = useMemo(() => orphan ? findById(sponsorsData, orphan.sponsorId) : undefined, [orphan, sponsorsData]);
  const profileRef = useRef<HTMLDivElement>(null);

  // Filter occasions linked to this orphan
  const orphanOccasions = useMemo(() => {
    if (!orphan?.uuid) return [];
    return allOccasions.filter(occ => 
      occ.orphan_id === orphan.uuid || 
      occ.occasion_type === 'organization_wide' ||
      (occ.occasion_type === 'multi_orphan' && occ.linked_orphans?.some(o => o.id === orphan.uuid))
    );
  }, [allOccasions, orphan]);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'education' | 'timeline' | 'gallery' | 'financial'>('overview');
  const [lightboxItem, setLightboxItem] = useState<{ src: string; type: 'image' | 'video' } | null>(null);
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
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDateForEvent, setSelectedDateForEvent] = useState<Date | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<{ id: string; type: string; title: string }[]>([]);
  
  // Sponsor note states
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [sponsorNote, setSponsorNote] = useState<string>('');
  const [isNoteLoading, setIsNoteLoading] = useState(false);
  const [isSponsorOfOrphan, setIsSponsorOfOrphan] = useState(false);

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

  // Check if current user is sponsor of this orphan and fetch note
  useEffect(() => {
    const checkSponsorAndFetchNote = async () => {
      if (!userProfile || !orphan?.uuid || userProfile.role !== 'sponsor') {
        setIsSponsorOfOrphan(false);
        return;
      }

      try {
        // Check if user sponsors this orphan
        const { data: sponsorOrphan } = await withUserContext(async () => {
          return await supabase
            .from('sponsor_orphans')
            .select('orphan_id')
            .eq('sponsor_id', userProfile.id)
            .eq('orphan_id', orphan.uuid)
            .single();
        });

        if (sponsorOrphan) {
          setIsSponsorOfOrphan(true);
          
          // Fetch existing note
          const { data: noteData } = await withUserContext(async () => {
            return await supabase
              .from('sponsor_notes')
              .select('note')
              .eq('sponsor_id', userProfile.id)
              .eq('orphan_id', orphan.uuid)
              .single();
          });

          if (noteData) {
            setSponsorNote(noteData.note);
          }
        } else {
          setIsSponsorOfOrphan(false);
        }
      } catch (err) {
        console.error('Error checking sponsor relationship:', err);
        setIsSponsorOfOrphan(false);
      }
    };

    checkSponsorAndFetchNote();
  }, [userProfile, orphan]);

  // Fetch note for sponsor (to display only to sponsor)
  const [displayNote, setDisplayNote] = useState<{ note: string; sponsorName: string; updatedAt: Date } | null>(null);
  
  useEffect(() => {
    const fetchDisplayNote = async () => {
      if (!orphan?.uuid || !userProfile || userProfile.role !== 'sponsor') {
        setDisplayNote(null);
        return;
      }

      try {
        const { data: noteData } = await withUserContext(async () => {
          return await supabase
            .from('sponsor_notes')
            .select(`
              note,
              updated_at,
              sponsor:user_profiles!sponsor_notes_sponsor_id_fkey(name)
            `)
            .eq('orphan_id', orphan.uuid)
            .single();
        });

        if (noteData) {
          setDisplayNote({
            note: noteData.note,
            sponsorName: (noteData.sponsor as any)?.name || 'كافل',
            updatedAt: new Date(noteData.updated_at),
          });
        } else {
          setDisplayNote(null);
        }
      } catch (err) {
        // No note found or error - that's okay
        setDisplayNote(null);
      }
    };

    fetchDisplayNote();
  }, [orphan, userProfile]);

  const handleSaveNote = async () => {
    if (!userProfile || !orphan?.uuid || !isSponsorOfOrphan) return;

    setIsNoteLoading(true);
    try {
      const { error } = await withUserContext(async () => {
        return await supabase
          .from('sponsor_notes')
          .upsert({
            orphan_id: orphan.uuid,
            sponsor_id: userProfile.id,
            note: sponsorNote,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'orphan_id,sponsor_id'
          });
      });

      if (error) throw error;

      setIsNoteModalOpen(false);
      // Refresh display note
      const { data: noteData } = await withUserContext(async () => {
        return await supabase
          .from('sponsor_notes')
          .select(`
            note,
            updated_at,
            sponsor:user_profiles!sponsor_notes_sponsor_id_fkey(name)
          `)
          .eq('orphan_id', orphan.uuid)
          .single();
      });

      if (noteData) {
        setDisplayNote({
          note: noteData.note,
          sponsorName: (noteData.sponsor as any)?.name || 'كافل',
          updatedAt: new Date(noteData.updated_at),
        });
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert('حدث خطأ أثناء حفظ الملاحظة');
    } finally {
      setIsNoteLoading(false);
    }
  };

  if (orphansLoading || orphanLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!orphan && !orphanLoading) {
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

    const handleDayClickForEvent = (date: Date, events: { id: string; type: string; title: string }[]) => {
        setSelectedDateForEvent(date);
        setSelectedDateEvents(events);
        setIsEventModalOpen(true);
    };

    const handleAddEvent = async (title: string) => {
        if (!selectedDateForEvent || !orphan || !orphan.uuid) return;

        try {
            await addOccasion(title, selectedDateForEvent, 'orphan_specific', [orphan.uuid]);
        } catch (error) {
            console.error('Error adding special occasion:', error);
            alert('حدث خطأ أثناء إضافة المناسبة');
        }
    };

    const handleUpdateEvent = async (occasionId: string, title: string) => {
        if (!orphan || !orphan.uuid) return;

        try {
            await updateOccasion(occasionId, { title });
        } catch (error) {
            console.error('Error updating special occasion:', error);
            alert('حدث خطأ أثناء تعديل المناسبة');
        }
    };

    const handleDeleteEvent = async (occasionId: string) => {
        if (!orphan || !orphan.uuid) return;

        try {
            await deleteOccasion(occasionId);
        } catch (error) {
            console.error('Error deleting special occasion:', error);
            alert('حدث خطأ أثناء حذف المناسبة');
        }
    };
    
    const handleCloseEventModal = () => {
        setIsEventModalOpen(false);
        setSelectedDateForEvent(null);
        setSelectedDateEvents([]);
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
                specialOccasions: orphanOccasions.map(o => ({ ...o, date: o.date.toISOString().split('T')[0] })),
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

  const DownloadIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;

  // Mock Academic Data for Chart
  const academicData = [
    { term: 'الفصل 1', math: 85, science: 78, arabic: 90, islamic: 95 },
    { term: 'الفصل 2', math: 88, science: 82, arabic: 92, islamic: 94 },
    { term: 'الفصل 3', math: 92, science: 85, arabic: 95, islamic: 98 },
    { term: 'الحالي', math: orphan.performance === 'ممتاز' ? 95 : 80, science: 88, arabic: 96, islamic: 99 },
  ];

  return (
    <>
    {/* Lightbox Overlay */}
    <AnimatePresence>
        {lightboxItem && (
            <Lightbox 
                src={lightboxItem.src} 
                type={lightboxItem.type} 
                onClose={() => setLightboxItem(null)} 
            />
        )}
    </AnimatePresence>

    {/* AI Summary Report Modal */}
    <AnimatePresence>
        {isSummaryModalOpen && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                onClick={() => setIsSummaryModalOpen(false)}
            >
                <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4">التقرير الموجز لـ {orphan.name}</h3>
                    {isSummaryLoading ? (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    ) : summaryError ? (
                        <div className="text-red-600 bg-red-100 p-3 rounded">{summaryError}</div>
                    ) : (
                        <div className="prose prose-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{summaryReport}</div>
                    )}
                    <button onClick={() => setIsSummaryModalOpen(false)} className="mt-4 w-full py-2 bg-gray-100 rounded-lg font-bold hover:bg-gray-200">إغلاق</button>
                </div>
            </motion.div>
        )}
    </AnimatePresence>

    {/* AI Needs Report Modal */}
    <AnimatePresence>
        {isNeedsModalOpen && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                onClick={() => setIsNeedsModalOpen(false)}
            >
                <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4 border-b pb-3">تقرير تقييم الاحتياجات لـ {orphan.name}</h3>
                    {isNeedsLoading ? (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    ) : needsError ? (
                        <div className="text-red-600 bg-red-100 p-3 rounded">{needsError}</div>
                    ) : (
                        <div className="prose prose-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{needsReport}</div>
                    )}
                    <button onClick={() => setIsNeedsModalOpen(false)} className="mt-4 w-full py-2 bg-gray-100 rounded-lg font-bold hover:bg-gray-200">إغلاق</button>
                </div>
            </motion.div>
        )}
    </AnimatePresence>

    <div ref={profileRef} className="bg-bg-page min-h-screen pb-20">
        {/* Header / Cover */}
        <div className="relative h-48 bg-gradient-to-r from-primary to-primary-hover rounded-b-[2.5rem] shadow-lg mb-16">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_white,_transparent_60%)]" />
            
            {/* Actions Toolbar */}
            <div className="absolute top-4 left-4 flex gap-2 no-print">
                {hasEditPermission && (
                    <>
                        {isEditMode ? (
                            <>
                                <button onClick={handleCancelEdit} className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg backdrop-blur-sm transition text-sm font-semibold">إلغاء</button>
                                <button onClick={handleSaveEdit} disabled={isSaving} className="bg-white text-primary px-3 py-2 rounded-lg transition text-sm font-semibold disabled:opacity-70">
                                    {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                                </button>
                            </>
                        ) : (
                            <button onClick={handleEdit} className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg backdrop-blur-sm transition text-sm font-semibold">تعديل</button>
                        )}
                    </>
                )}
                {isSponsorOfOrphan && (
                    <button onClick={() => setIsNoteModalOpen(true)} className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg backdrop-blur-sm transition text-sm font-semibold">ملاحظة</button>
                )}
                <button id="export-button-desktop" onClick={handleExportPDF} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-sm transition" title="طباعة">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                </button>
                <button onClick={handleGenerateSummaryReport} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-sm transition flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    <span className="hidden sm:inline text-sm">تقرير ذكي</span>
                </button>
            </div>

            {/* Avatar + Name */}
            <div className="absolute -bottom-14 right-8 md:right-16 flex items-center gap-6 w-full">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-md bg-white overflow-hidden flex-shrink-0">
                    {orphan.uuid ? (
                        <AvatarUpload
                            currentAvatarUrl={orphan.photoUrl}
                            userId={orphan.uuid}
                            type="orphan"
                            onUploadComplete={() => window.location.reload()}
                            size="lg"
                        />
                    ) : (
                        <Avatar
                            src={orphan.photoUrl}
                            name={orphan.name}
                            size="xl"
                            className="!w-full !h-full !text-4xl"
                        />
                    )}
                </motion.div>
                <div className="text-white drop-shadow-md -translate-y-12 md:-translate-y-14">
                    {isEditMode ? (
                        <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 bg-white/90 border-2 border-primary rounded-lg px-4 py-2 w-full max-w-xs"
                        />
                    ) : (
                        <h1 className="text-3xl md:text-4xl font-bold">{orphan.name}</h1>
                    )}
                    <p className="opacity-90 text-sm md:text-base font-medium">{orphan.grade} • {orphan.age} سنوات</p>
                </div>
            </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto border-b border-gray-200 mb-6 no-print" style={{ scrollbarWidth: 'none' }}>
                <TabButton active={activeTab === 'overview'} label="نظرة عامة" onClick={() => setActiveTab('overview')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>} />
                <TabButton active={activeTab === 'education'} label="التعليم" onClick={() => setActiveTab('education')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>} />
                <TabButton active={activeTab === 'timeline'} label="الجدول الزمني" onClick={() => setActiveTab('timeline')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
                <TabButton active={activeTab === 'gallery'} label="المعرض" onClick={() => setActiveTab('gallery')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} />
                <TabButton active={activeTab === 'financial'} label="المالية" onClick={() => setActiveTab('financial')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
            </div>

            <div className="min-h-[400px]">
                {/* ==================== TAB 1: OVERVIEW ==================== */}
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Info Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="font-bold text-lg text-gray-800">البيانات الشخصية</h3>
                                <span className={`px-2 py-1 rounded text-xs ${orphan.healthStatus.includes('جيدة') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{orphan.healthStatus}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <EditableField label="تاريخ الميلاد" value={isEditMode ? editFormData.dateOfBirth : orphan.dateOfBirth.toLocaleDateString('ar-EG')} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, dateOfBirth: v })} type="date" />
                                <EditableField label="الجنس" value={isEditMode ? editFormData.gender : orphan.gender} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, gender: v as 'ذكر' | 'أنثى' })} options={['ذكر', 'أنثى']} type="select" />
                                <EditableField label="الدولة" value={isEditMode ? editFormData.country : orphan.country} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, country: v })} />
                                <EditableField label="المحافظة" value={isEditMode ? editFormData.governorate : orphan.governorate} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, governorate: v })} />
                                <div className="col-span-2">
                                    <EditableField label="القائم بالرعاية" value={isEditMode ? editFormData.guardian : orphan.guardian} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, guardian: v })} />
                                </div>
                            </div>
                        </div>

                        {/* Sponsorship Info */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">تفاصيل الكفالة</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">الكافل</p>
                                        {sponsor ? <Link to={`/sponsor/${sponsor.id}`} className="font-semibold text-primary hover:underline">{sponsor.name}</Link> : <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">نوع الكفالة</p>
                                        {isEditMode ? (
                                            <input type="text" value={editFormData.sponsorshipType} onChange={(e) => setEditFormData({ ...editFormData, sponsorshipType: e.target.value })} className="w-full p-1.5 border rounded-lg text-sm focus:ring-1 focus:ring-primary" />
                                        ) : (
                                            <p className="font-semibold text-gray-800">{orphan.sponsorshipType}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social & Housing */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">الحالة الاجتماعية والسكن</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <EditableField label="العائلة" value={isEditMode ? editFormData.familyStatus : orphan.familyStatus} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, familyStatus: v })} />
                                <EditableField label="السكن" value={isEditMode ? editFormData.housingStatus : orphan.housingStatus} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, housingStatus: v })} />
                            </div>
                            {orphan.familyMembers.length > 0 && (
                                <div className="mt-4 pt-3 border-t">
                                    <h4 className="text-xs text-gray-500 mb-2">أفراد الأسرة</h4>
                                    <div className="space-y-1">
                                        {orphan.familyMembers.map((member, index) => (
                                            <p key={index} className="text-sm text-gray-700">- {member.relationship} (العمر: {member.age})</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Interests & Needs */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <svg className="text-yellow-500" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                        الهوايات والاهتمامات
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {orphan.hobbies.length > 0 ? orphan.hobbies.map((hobby, i) => (
                                            <span key={i} className="px-3 py-1 bg-yellow-50 text-yellow-800 rounded-full text-sm font-medium border border-yellow-100">{hobby}</span>
                                        )) : <span className="text-sm text-gray-400">لا توجد بيانات</span>}
                                        {isEditMode && <button className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm hover:bg-gray-200">+</button>}
                                    </div>
                                </div>
                                <div className="border-t pt-3">
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <svg className="text-red-500" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                        الاحتياجات والأمنيات
                                    </h4>
                                    <ul className="space-y-2">
                                        {orphan.needsAndWishes.length > 0 ? orphan.needsAndWishes.map((need, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                                {need}
                                            </li>
                                        )) : <li className="text-sm text-gray-400">لا توجد بيانات</li>}
                                        {isEditMode && <li className="text-sm text-gray-400 italic cursor-pointer hover:text-primary">+ أضف احتياج</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Faye Programs - Full Width */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">برامج فيء</h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-gray-700 text-sm mb-2">البرنامج التربوي</h4>
                                    <div className="flex items-center gap-3">
                                        <ProgramStatusPill status={orphan.educationalProgram.status} />
                                        <p className="text-sm text-gray-600">{orphan.educationalProgram.details}</p>
                                    </div>
                                </div>
                                <div className="border-t pt-4">
                                    <h4 className="font-bold text-gray-700 text-sm mb-2">الدعم النفسي</h4>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="font-semibold text-gray-700 text-xs mb-2">للطفل ({orphan.name})</p>
                                            <div className="flex items-center gap-3">
                                                <ProgramStatusPill status={orphan.psychologicalSupport.child.status} />
                                                <p className="text-sm">{orphan.psychologicalSupport.child.details}</p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="font-semibold text-gray-700 text-xs mb-2">للقائم بالرعاية ({orphan.guardian})</p>
                                            <div className="flex items-center gap-3">
                                                <ProgramStatusPill status={orphan.psychologicalSupport.guardian.status} />
                                                <p className="text-sm">{orphan.psychologicalSupport.guardian.details}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sponsor Note (visible to sponsor only) */}
                        {userProfile?.role === 'sponsor' && displayNote && (
                            <div className="bg-blue-50 p-6 rounded-xl shadow-sm border-2 border-blue-200 md:col-span-2">
                                <h3 className="font-bold text-lg text-gray-800 mb-3">ملاحظة الكافل</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600">من: <span className="font-semibold text-gray-800">{displayNote.sponsorName}</span></p>
                                        <p className="text-xs text-gray-500">آخر تحديث: {displayNote.updatedAt.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                                        <p className="text-gray-800 whitespace-pre-wrap">{displayNote.note}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ==================== TAB 2: EDUCATION ==================== */}
                {activeTab === 'education' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Academic Performance Chart */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                                <h3 className="font-bold text-lg text-gray-800 mb-6">تطور الأداء الدراسي</h3>
                                <div className="h-[300px] w-full" dir="ltr">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={academicData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="term" />
                                            <YAxis domain={[0, 100]} />
                                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Legend />
                                            <Line type="monotone" dataKey="math" name="الرياضيات" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                                            <Line type="monotone" dataKey="science" name="العلوم" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4 }} />
                                            <Line type="monotone" dataKey="arabic" name="اللغة العربية" stroke="#ffc658" strokeWidth={2} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Academic Summary */}
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4">الملخص الأكاديمي</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <EditableField label="المرحلة" value={isEditMode ? editFormData.grade : orphan.grade} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, grade: v })} />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">الانتظام</span>
                                                <span className="font-bold text-green-600">{orphan.attendance}</span>
                                            </div>
                                            {isEditMode && (
                                                <input type="text" value={editFormData.attendance} onChange={(e) => setEditFormData({ ...editFormData, attendance: e.target.value })} className="w-full p-1.5 border rounded-lg text-sm focus:ring-1 focus:ring-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">المستوى</span>
                                                <span className="font-bold text-primary">{orphan.performance}</span>
                                            </div>
                                            {isEditMode && (
                                                <input type="text" value={editFormData.performance} onChange={(e) => setEditFormData({ ...editFormData, performance: e.target.value })} className="w-full p-1.5 border rounded-lg text-sm focus:ring-1 focus:ring-primary" />
                                            )}
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-sm text-gray-500 mb-1">ملاحظات المعلم:</p>
                                            <p className="text-sm italic bg-gray-50 p-2 rounded text-gray-700">"{orphan.name} طالب مجتهد جداً ويشارك بفاعلية في الأنشطة الصفية."</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-3">البرنامج التعليمي</h3>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M22 10v6M2 10v6"/><path d="M2 10l10-5 10 5-10 5z"/><path d="M12 12v9"/></svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{orphan.educationalProgram.status}</p>
                                            <p className="text-xs text-gray-500 mt-1">{orphan.educationalProgram.details}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Psychological Support */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-lg text-gray-800 mb-4">الدعم النفسي</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="font-semibold text-gray-700 text-sm mb-2">للطفل ({orphan.name})</p>
                                    <div className="flex items-center gap-3">
                                        <ProgramStatusPill status={orphan.psychologicalSupport.child.status} />
                                        <p className="text-sm">{orphan.psychologicalSupport.child.details}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="font-semibold text-gray-700 text-sm mb-2">للقائم بالرعاية ({orphan.guardian})</p>
                                    <div className="flex items-center gap-3">
                                        <ProgramStatusPill status={orphan.psychologicalSupport.guardian.status} />
                                        <p className="text-sm">{orphan.psychologicalSupport.guardian.details}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ==================== TAB 3: TIMELINE ==================== */}
                {activeTab === 'timeline' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {/* Activity Timeline */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-gray-800">سجل النشاطات والأحداث</h3>
                                <button onClick={() => setIsAddLogModalOpen(true)} className="text-sm font-semibold py-1.5 px-4 bg-primary-light text-primary rounded-full hover:bg-primary hover:text-white transition-colors flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    إضافة تحديث
                                </button>
                            </div>
                            <div className="relative border-r-2 border-gray-200 mr-3 space-y-8">
                                {[
                                    ...orphan.updateLogs.map(l => ({ ...l, type: 'log' as const })),
                                    ...orphan.achievements.map(a => ({ ...a, type: 'achievement' as const })),
                                    ...orphanOccasions.map(o => ({ ...o, type: 'occasion' as const })),
                                ]
                                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((item: any, idx) => (
                                        <div key={idx} className="relative pr-8">
                                            <div className={`absolute -right-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm
                                                ${item.type === 'achievement' ? 'bg-green-500' : item.type === 'occasion' ? 'bg-purple-500' : 'bg-blue-500'}
                                            `}></div>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                <span className="text-xs font-bold text-gray-400">{new Date(item.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                {item.type === 'achievement' && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">إنجاز</span>}
                                                {item.type === 'occasion' && <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">مناسبة</span>}
                                            </div>
                                            <h4 className="font-bold text-gray-800">{item.title || item.note || 'تحديث'}</h4>
                                            {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                                            {item.author && <p className="text-xs text-gray-500 mt-1">بواسطة: {item.author}</p>}
                                        </div>
                                    ))
                                }
                                {orphan.updateLogs.length === 0 && orphan.achievements.length === 0 && orphanOccasions.length === 0 && (
                                    <p className="text-center text-gray-400 py-8">لا توجد أحداث مسجلة</p>
                                )}
                            </div>
                        </div>

                        {/* Interactive Calendar */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-lg text-gray-800 mb-4">الرزنامة التفاعلية</h3>
                            <InteractiveCalendar orphan={orphan} occasions={orphanOccasions} onDayClick={handleDayClickForEvent} />
                        </div>

                        {/* Occasions & Gifts */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-3">مناسبات خاصة</h3>
                                {orphanOccasions.length > 0 ? orphanOccasions.map(occ => (
                                    <div key={occ.id} className="flex items-center gap-2 py-2 border-b last:border-0">
                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                        <span className="font-semibold text-sm text-gray-800">{occ.title}</span>
                                        <span className="text-xs text-gray-500 mr-auto">{occ.date.toLocaleDateString('ar-EG')}</span>
                                    </div>
                                )) : <p className="text-sm text-gray-400">لا توجد مناسبات.</p>}
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-3">الهدايا</h3>
                                {orphan.gifts.length > 0 ? orphan.gifts.map(gift => (
                                    <div key={gift.id} className="flex items-center gap-2 py-2 border-b last:border-0">
                                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                        <span className="font-semibold text-sm text-gray-800">{gift.item}</span>
                                        <span className="text-xs text-gray-500 mr-auto">من {gift.from}</span>
                                    </div>
                                )) : <p className="text-sm text-gray-400">لا توجد هدايا مسجلة.</p>}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ==================== TAB 4: GALLERY ==================== */}
                {activeTab === 'gallery' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg text-gray-800">معرض الصور والإنجازات</h3>
                            <button onClick={() => setIsAddAchievementModalOpen(true)} className="text-sm font-semibold py-1.5 px-4 bg-primary-light text-primary rounded-full hover:bg-primary hover:text-white transition-colors flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                إضافة إنجاز
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {orphan.achievements.filter(a => a.mediaUrl).map((achievement, idx) => (
                                <div 
                                    key={idx} 
                                    className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all"
                                    onClick={() => setLightboxItem({ src: achievement.mediaUrl!, type: achievement.mediaType || 'image' })}
                                >
                                    {achievement.mediaType === 'video' ? (
                                        <video src={achievement.mediaUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <OptimizedImage src={achievement.mediaUrl!} alt={achievement.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                        <p className="text-white text-sm font-medium truncate">{achievement.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Empty State */}
                        {orphan.achievements.filter(a => a.mediaUrl).length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <p>لا توجد صور في المعرض حالياً</p>
                            </div>
                        )}

                        {/* Achievements List */}
                        {orphan.achievements.length > 0 && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
                                <h3 className="font-bold text-gray-800 mb-4">قائمة الإنجازات</h3>
                                <div className="space-y-3">
                                    {orphan.achievements.map(ach => (
                                        <div key={ach.id} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3">
                                            <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{ach.title} <span className="font-normal text-gray-500">- {ach.date.toLocaleDateString('ar-EG')}</span></p>
                                                {ach.description && <p className="text-sm text-gray-600">{ach.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ==================== TAB 5: FINANCIAL ==================== */}
                {activeTab === 'financial' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Payment Records Table */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-2">
                                <h3 className="font-bold text-lg text-gray-800 mb-4">سجل الدفعات ({new Date().getFullYear()})</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                                <th className="p-3 rounded-r-lg">التاريخ المستحق</th>
                                                <th className="p-3">المبلغ</th>
                                                <th className="p-3">الحالة</th>
                                                <th className="p-3 rounded-l-lg">تاريخ الدفع</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orphan.payments.map((payment, i) => (
                                                <tr key={i} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                                    <td className="p-3">{payment.dueDate.toLocaleDateString('ar-EG')}</td>
                                                    <td className="p-3 font-bold">${payment.amount}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                            payment.status === PaymentStatus.Paid ? 'bg-green-100 text-green-700' :
                                                            payment.status === PaymentStatus.Overdue ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-gray-500">{payment.paidDate ? payment.paidDate.toLocaleDateString('ar-EG') : '-'}</td>
                                                </tr>
                                            ))}
                                            {orphan.payments.length === 0 && (
                                                <tr><td colSpan={4} className="p-6 text-center text-gray-400">لا توجد دفعات مسجلة</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Financial Summary Card */}
                            <div className="bg-primary text-white p-6 rounded-xl shadow-lg flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                                <div>
                                    <p className="text-white/80 text-sm mb-1">الرصيد المستحق</p>
                                    <h3 className="text-4xl font-bold mb-6">
                                        ${orphan.payments.filter(p => p.status !== PaymentStatus.Paid).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                                    </h3>
                                    <p className="text-white/80 text-sm mb-1">إجمالي المدفوعات</p>
                                    <h3 className="text-2xl font-bold">
                                        ${orphan.payments.filter(p => p.status === PaymentStatus.Paid).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Yearly Payment Summary */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-lg text-gray-800 mb-4">ملخص الدفعات الشهري</h3>
                            <YearlyPaymentSummary payments={orphan.payments} />
                        </div>

                        {/* Financial Record from transactions */}
                        <FinancialRecordCard orphanId={orphan.id} />

                        {/* AI Analytics */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                                تحليلات الذكاء الاصطناعي
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-bold text-gray-800">موجز سريع للحالة</h4>
                                    <p className="text-sm my-2 text-gray-600">احصل على تقرير فوري يلخص الوضع الأكاديمي والمالي لليتيم مع توصية سريعة.</p>
                                    <button onClick={handleGenerateSummaryReport} className="text-sm font-semibold py-2 px-4 bg-primary-light text-primary rounded-lg hover:bg-primary hover:text-white transition-colors w-full">
                                        إنشاء موجز
                                    </button>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-bold text-gray-800">تقرير تقييم الاحتياجات</h4>
                                    <p className="text-sm my-2 text-gray-600">تحليل شامل لبيانات اليتيم لتحديد نقاط القوة والجوانب التي تحتاج إلى دعم.</p>
                                    <button onClick={handleGenerateNeedsReport} className="text-sm font-semibold py-2 px-4 bg-primary-light text-primary rounded-lg hover:bg-primary hover:text-white transition-colors w-full">
                                        إنشاء تقرير احتياجات
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    </div>

    {/* Mobile Action Bar */}
    <div className="mobile-action-bar sm:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-2 grid grid-cols-5 gap-1 text-center no-print">
        {[
            { key: 'overview' as const, label: 'عامة', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
            { key: 'education' as const, label: 'التعليم', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> },
            { key: 'timeline' as const, label: 'الأحداث', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
            { key: 'gallery' as const, label: 'المعرض', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
            { key: 'financial' as const, label: 'المالية', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
        ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex flex-col items-center py-1 rounded-lg transition-colors ${activeTab === tab.key ? 'text-primary bg-primary-light' : 'text-gray-500 hover:text-primary'}`}>
                {tab.icon}
                <span className="text-xs mt-0.5">{tab.label}</span>
            </button>
        ))}
    </div>

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

    {/* Event Modal */}
    <EventModal 
        isOpen={isEventModalOpen}
        onClose={handleCloseEventModal}
        onAdd={handleAddEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        date={selectedDateForEvent}
        existingEvents={selectedDateEvents}
    />

    {/* Sponsor Note Modal */}
    {isNoteModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onClick={() => setIsNoteModalOpen(false)}>
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4 text-blue-600 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M16 13H8"/>
              <path d="M16 17H8"/>
              <path d="M10 9H8"/>
            </svg>
            ملاحظة شخصية
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            يمكنك إضافة ملاحظة شخصية عن {orphan.name}. هذه الملاحظة ستكون مرئية لك وللفريق.
          </p>
          <textarea
            value={sponsorNote}
            onChange={(e) => setSponsorNote(e.target.value)}
            placeholder="اكتب ملاحظتك هنا..."
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md mb-4 min-h-[200px] resize-y"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsNoteModalOpen(false)} 
              className="py-2 px-4 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 font-semibold"
            >
              إلغاء
            </button>
            <button 
              onClick={handleSaveNote}
              disabled={isNoteLoading}
              className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isNoteLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الحفظ...
                </>
              ) : (
                'حفظ الملاحظة'
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default OrphanProfile;