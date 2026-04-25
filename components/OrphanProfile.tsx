import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrphansBasic, useOrphanDetail } from '../hooks/useOrphans';
import { useOccasions } from '../hooks/useOccasions';
import { useSponsorsBasic } from '../hooks/useSponsors';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useAuth } from '../contexts/AuthContext';
import { findById } from '../utils/idMapper';
import { useFinancialTransactions } from '../hooks/useFinancialTransactions';
import { Payment, PaymentStatus, Achievement, SpecialOccasion, Gift, TransactionType, Orphan, UpdateLog, ProgramParticipation } from '../types';
import { uploadOrphanAchievementMedia } from '../utils/orphanAchievementUpload';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AvatarUpload } from './AvatarUpload';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import OptimizedImage from './OptimizedImage';
import ResponsiveState from './ResponsiveState';
import PaymentStatusBadge from './PaymentStatusBadge';
import {
    canAccessFinancialSystem,
    canAccessOrphanFinancials,
} from '../lib/accessControl';
import {
    buildFinancialSystemUrl,
    filterTransactionsByOrphan,
} from '../lib/orphanFinancials';

/** React Query persistence (or other hydration) may restore dates as strings — normalize before calling Date methods. */
function coerceToDate(value: unknown): Date | null {
    if (value == null || value === '') return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const d = new Date(value as string | number);
    return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateArEG(value: unknown): string {
    const d = coerceToDate(value);
    return d ? d.toLocaleDateString('ar-EG') : '—';
}

function toDateInputString(value: unknown): string {
    const d = coerceToDate(value);
    return d ? d.toISOString().split('T')[0] : '';
}

function formatDateArShort(value: unknown): string {
    const d = coerceToDate(value);
    return d ? d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

const AddAchievementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (achievement: Omit<Achievement, 'id'> & { mediaFile?: File | null }) => void;
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
        
        const newAchievement: Omit<Achievement, 'id'> & { mediaFile?: File | null } = {
            title,
            description,
            date: new Date(date),
            ...(mediaFile && {
                mediaUrl: mediaPreview!,
                mediaType: mediaFile.type.startsWith('image/') ? 'image' : 'video'
            }),
            mediaFile,
        };
        onSave(newAchievement);
        resetAndClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 p-0 md:items-center md:p-4" onClick={resetAndClose}>
            <div className="max-h-[92svh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white p-4 shadow-xl md:max-h-[90vh] md:max-w-lg md:rounded-lg md:p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="mb-4 text-xl font-bold">إضافة إنجاز جديد</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الإنجاز" className="min-h-[44px] w-full rounded-md border border-gray-300 bg-white px-3 py-2" required />
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف الإنجاز" rows={3} className="min-h-[120px] w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2" required />
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-[44px] w-full rounded-md border border-gray-300 bg-white px-3 py-2" required />
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">رفع صورة أو فيديو (اختياري)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.8-3.3-4.8-6.3-4.2-1.2.2-2.3.8-3.1 1.5-1-.7-2.3-1-3.6-1-3.3 0-6 2.7-6 6 0 1.3.4 2.5 1 3.5"/><path d="m20 17-5-5-4 4-3-3-5 5"/><path d="M16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M15 22H9a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2Z"/></svg>
                                <div className="flex flex-wrap justify-center gap-x-1 text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-hover focus-within:outline-none">
                                        <span>ارفع ملف</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,video/mp4" />
                                    </label>
                                    <p className="pe-1">أو اسحبه وأفلته هنا</p>
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
                    
                    <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                        <button type="button" onClick={resetAndClose} className="min-h-[44px] rounded-lg bg-gray-100 px-5 py-2 font-semibold text-text-secondary hover:bg-gray-200">إلغاء</button>
                        <button type="submit" className="min-h-[44px] rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-hover">حفظ الإنجاز</button>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 p-0 md:items-center md:p-4" onClick={onClose}>
            <div className="w-full rounded-t-[1.75rem] bg-white p-4 shadow-xl md:max-w-lg md:rounded-lg md:p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="mb-4 text-xl font-bold">إضافة تحديث/ملاحظة جديدة</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="اكتب ملاحظتك هنا..." rows={4} className="min-h-[180px] w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2" required autoFocus/>
                    <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                        <button type="button" onClick={onClose} className="min-h-[44px] rounded-lg bg-gray-100 px-5 py-2 font-semibold text-text-secondary hover:bg-gray-200">إلغاء</button>
                        <button type="submit" className="min-h-[44px] rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-hover">حفظ الملاحظة</button>
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
    /** When false, day details are view-only (sponsors / no edit permission). */
    allowManage?: boolean;
}> = ({ isOpen, onClose, onAdd, onUpdate, onDelete, date, existingEvents, allowManage = true }) => {
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 p-0 md:items-center md:p-4" onClick={handleClose}>
            <div className="max-h-[92svh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white p-4 shadow-xl md:max-h-[80vh] md:max-w-lg md:rounded-lg md:p-6" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-xl font-bold">الأحداث</h3>
                        <p className="text-sm text-gray-500">
                            {date.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={handleClose} className="flex h-11 w-11 items-center justify-center rounded-full text-2xl font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-800">&times;</button>
                </div>

                {/* Existing Editable Events */}
                {editableEvents.length > 0 && (
                    <div className="space-y-2 mb-4">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">المناسبات المسجلة</h4>
                        {editableEvents.map(event => (
                            <div key={event.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                {!allowManage ? (
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        <span className="text-gray-800">{event.title}</span>
                                    </div>
                                ) : editingId === event.id ? (
                                    <form onSubmit={handleEditSubmit} className="space-y-2">
                                        <input
                                            type="text"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            className="min-h-[44px] w-full rounded-md border border-gray-300 bg-white px-3 py-2"
                                            autoFocus
                                        />
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <button type="submit" className="min-h-[44px] rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
                                                حفظ
                                            </button>
                                            <button type="button" onClick={cancelEditing} className="min-h-[44px] rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                                                إلغاء
                                            </button>
                                        </div>
                                    </form>
                                ) : deleteConfirmId === event.id ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-red-600 font-semibold">هل أنت متأكد من حذف "{event.title}"؟</p>
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <button onClick={() => handleDelete(event.id)} className="min-h-[44px] rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                                                نعم، احذف
                                            </button>
                                            <button onClick={() => setDeleteConfirmId(null)} className="min-h-[44px] rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
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
                {allowManage &&
                    (isAdding ? (
                    <form onSubmit={handleAddSubmit} className="space-y-3 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-600">إضافة مناسبة جديدة</h4>
                        <input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="عنوان المناسبة (مثال: موعد طبيب الأسنان)"
                            className="min-h-[44px] w-full rounded-md border border-gray-300 bg-white px-3 py-2"
                            autoFocus
                        />
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <button type="submit" className="min-h-[44px] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
                                حفظ
                            </button>
                            <button type="button" onClick={() => { setIsAdding(false); setNewTitle(''); }} className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                                إلغاء
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        type="button"
                        onClick={() => { setIsAdding(true); setEditingId(null); setDeleteConfirmId(null); }}
                        className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        إضافة مناسبة جديدة
                    </button>
                ))}

                {existingEvents.length === 0 && !isAdding && (
                    <p className="text-center text-gray-500 text-sm mt-4">لا توجد أحداث في هذا اليوم</p>
                )}
            </div>
        </div>
    );
};


const InfoCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; className?: string, headerActions?: React.ReactNode }> = ({ title, children, icon, className = '', headerActions }) => (
    <div className={`rounded-xl bg-bg-card p-4 shadow-sm md:p-6 ${className}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary md:h-10 md:w-10">{icon}</div>
                <h3 className="text-lg font-bold text-gray-700 md:text-xl">{title}</h3>
            </div>
            {headerActions}
        </div>
        <div className="text-text-secondary space-y-2">{children}</div>
    </div>
);

const YearlyPaymentSummary: React.FC<{ payments: Payment[]; year: number }> = ({ payments, year }) => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

    const getStatusForMonth = (month: Date) => {
        const paymentForMonth = payments.find(p => {
            const due = coerceToDate(p.dueDate);
            if (!due) return false;
            return due.getFullYear() === month.getFullYear() && due.getMonth() === month.getMonth();
        });

        if (!paymentForMonth) {
            return { status: 'فارغ', color: 'bg-gray-100', textColor: 'text-gray-500', amount: null };
        }

        switch (paymentForMonth.status) {
            case PaymentStatus.Paid:
                return { status: 'مدفوع', color: 'bg-green-100', textColor: 'text-green-700', amount: paymentForMonth.amount };
            case PaymentStatus.Due:
                return { status: 'مستحق', color: 'bg-yellow-100', textColor: 'text-yellow-700', amount: paymentForMonth.amount };
            case PaymentStatus.Overdue:
                return { status: 'متأخر', color: 'bg-red-100', textColor: 'text-red-700', amount: paymentForMonth.amount };
            case PaymentStatus.Processing:
                return { status: 'قيد المعالجة', color: 'bg-blue-100', textColor: 'text-blue-700', amount: paymentForMonth.amount };
            default:
                return { status: 'غير معروف', color: 'bg-gray-100', textColor: 'text-gray-500', amount: paymentForMonth.amount };
        }
    };

    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
            {months.map(month => {
                const { status, color, textColor, amount } = getStatusForMonth(month);
                return (
                    <div key={month.getMonth()} className={`rounded-lg border border-white/60 p-2.5 text-center md:p-3 ${color}`}>
                        <p className="text-sm font-semibold text-gray-800 md:text-base">{month.toLocaleDateString('ar-EG', { month: 'long' })}</p>
                        <p className={`text-xs font-medium md:text-sm ${textColor}`}>{status}</p>
                        {amount !== null && (
                            <p className={`mt-1 text-[11px] font-semibold md:text-xs ${textColor}`}>${amount.toLocaleString()}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const FinancialRecordCard: React.FC<{
    orphanId: number;
    showOpenInFinancialSystem?: boolean;
}> = ({ orphanId, showOpenInFinancialSystem = false }) => {
    const { transactions, loading } = useFinancialTransactions();

    const relatedTransactions = useMemo(() => {
        return filterTransactionsByOrphan(transactions, orphanId)
            .sort((a, b) => (coerceToDate(b.date)?.getTime() ?? 0) - (coerceToDate(a.date)?.getTime() ?? 0));
    }, [orphanId, transactions]);

    const CashIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="6" x2="6" y1="12" y2="12"/><line x1="18" x2="18" y1="12" y2="12"/></svg>;
    
    return (
        <InfoCard
            title="الحركات المالية المرتبطة"
            icon={CashIcon}
            headerActions={
                showOpenInFinancialSystem ? (
                    <Link
                        to={buildFinancialSystemUrl(orphanId)}
                        className="inline-flex min-h-[36px] items-center rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                        فتح في النظام المالي
                    </Link>
                ) : null
            }
        >
            {loading ? (
                <p>جاري تحميل الحركات المالية...</p>
            ) : relatedTransactions.length > 0 ? (
                <div className="max-h-60 space-y-3 overflow-y-auto pe-2">
                    {relatedTransactions.map(tx => (
                        <div key={tx.id} className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${tx.type === TransactionType.Income ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {tx.type === TransactionType.Income ? 
                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> :
                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                                    }
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800">{tx.description}</p>
                                    <p className="text-xs text-gray-500">{formatDateArEG(tx.date)}</p>
                                </div>
                            </div>
                            <span className={`text-base font-bold sm:text-lg ${tx.type === TransactionType.Income ? 'text-green-600' : 'text-red-600'}`}>
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

const FinancialMetricCard: React.FC<{
    title: string;
    value: string;
    helper?: string;
    tone?: 'primary' | 'green' | 'yellow' | 'slate';
}> = ({ title, value, helper, tone = 'slate' }) => {
    const toneStyles = {
        primary: 'bg-primary text-white',
        green: 'bg-green-50 text-green-900 ring-1 ring-green-100',
        yellow: 'bg-yellow-50 text-yellow-900 ring-1 ring-yellow-100',
        slate: 'bg-white text-gray-900 ring-1 ring-gray-100',
    };

    const helperStyles = {
        primary: 'text-white/80',
        green: 'text-green-700/80',
        yellow: 'text-yellow-700/80',
        slate: 'text-gray-500',
    };

    return (
        <div className={`rounded-2xl p-4 shadow-sm ${toneStyles[tone]}`}>
            <p className={`text-xs font-medium md:text-sm ${helperStyles[tone]}`}>{title}</p>
            <p className="mt-2 text-lg font-bold md:text-2xl">{value}</p>
            {helper && <p className={`mt-1 text-xs md:text-sm ${helperStyles[tone]}`}>{helper}</p>}
        </div>
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
        const addEvent = (date: Date | string, type: string, title: string, id: string) => {
            const d = coerceToDate(date);
            if (!d) return;
            const dateString = d.toISOString().split('T')[0];
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
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <button onClick={() => changeMonth(-1)} className="flex h-11 w-11 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h4 className="text-center text-base font-bold text-gray-700 md:text-lg">
                    {currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                </h4>
                <button onClick={() => changeMonth(1)} className="flex h-11 w-11 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-text-secondary md:text-sm">
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
                            className={`group relative flex aspect-square min-h-[2.65rem] cursor-pointer flex-col items-center justify-center rounded-lg p-1 text-xs transition-colors duration-200 md:min-h-[3rem] md:text-sm ${isToday ? 'bg-primary font-bold text-white' : 'hover:bg-primary-light'}`}
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
                                <div className="pointer-events-none absolute bottom-full z-20 mb-2 hidden w-max max-w-xs rounded-md bg-gray-800 px-2 py-1 text-xs text-white shadow-lg group-hover:block md:block">
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
        <button className="absolute end-4 top-4 p-2 text-white hover:text-gray-300">
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
        className={`relative flex min-h-[44px] snap-start items-center gap-2 whitespace-nowrap rounded-t-xl px-4 py-3 text-sm font-bold transition-colors duration-200 md:px-6
        ${active ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
    >
        {icon}
        {label}
        {active && (
            <motion.div
                layoutId="activeTab"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
            />
        )}
    </button>
);

const PROGRAM_STATUS_OPTIONS: ProgramParticipation['status'][] = ['ملتحق', 'غير ملتحق', 'مكتمل', 'بحاجة للتقييم'];
const PERFORMANCE_OPTIONS = ['', 'ممتاز', 'جيد جداً', 'جيد'];
const ATTENDANCE_OPTIONS = ['', 'منتظم', 'منتظمة', 'غير منتظم', 'ضعيف'];
const HEALTH_STATUS_PRESETS = ['', 'جيدة', 'جيدة مع ملاحظات', 'تحتاج متابعة', 'غير محدد'];

const EditableField: React.FC<{ 
    label: string; 
    value: string | number; 
    isEditing: boolean; 
    onChange: (val: string) => void;
    type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
    options?: string[];
    textareaRows?: number;
}> = ({ label, value, isEditing, onChange, type = 'text', options, textareaRows = 3 }) => {
    return (
        <div className="mb-1">
            <span className="text-xs text-gray-500 block mb-0.5">{label}</span>
            {isEditing ? (
                type === 'select' && options ? (
                    <select 
                        value={value} 
                        onChange={(e) => onChange(e.target.value)}
                        className="min-h-[44px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                    >
                        {options.map(opt => (
                            <option key={opt || 'empty'} value={opt}>{opt || '—'}</option>
                        ))}
                    </select>
                ) : type === 'textarea' ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={textareaRows}
                        className="min-h-[6rem] w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                    />
                ) : (
                    <input 
                        type={type} 
                        value={value} 
                        onChange={(e) => onChange(e.target.value)}
                        className="min-h-[44px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                    />
                )
            ) : (
                <p className="font-semibold text-gray-800 text-sm min-h-[1.25rem] whitespace-pre-wrap">{value === '' || value === null || value === undefined ? '—' : value}</p>
            )}
        </div>
    );
};

type FamilyDraftRow = { id?: string; relationship: string; age: string };

const ProgramParticipationFields: React.FC<{
    isEditing: boolean;
    title: string;
    status: ProgramParticipation['status'];
    details: string;
    onStatus: (s: ProgramParticipation['status']) => void;
    onDetails: (d: string) => void;
}> = ({ isEditing, title, status, details, onStatus, onDetails }) => (
    <div className="space-y-2">
        {title ? <h4 className="font-bold text-gray-700 text-sm">{title}</h4> : null}
        {isEditing ? (
            <>
                <div>
                    <span className="text-xs text-gray-500 block mb-0.5">الحالة</span>
                    <select
                        value={status}
                        onChange={(e) => onStatus(e.target.value as ProgramParticipation['status'])}
                        className="min-h-[44px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                    >
                        {PROGRAM_STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <span className="text-xs text-gray-500 block mb-0.5">التفاصيل</span>
                    <textarea
                        value={details}
                        onChange={(e) => onDetails(e.target.value)}
                        rows={3}
                        className="min-h-[6rem] w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                    />
                </div>
            </>
        ) : (
            <div className="flex items-start gap-3 flex-wrap">
                <ProgramStatusPill status={status} />
                <p className="text-sm text-gray-600 flex-1 min-w-0">{details || '—'}</p>
            </div>
        )}
    </div>
);

const OrphanProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Use lightweight list hook only to map numeric ID to orphan UUID
  const { orphans: orphansIndex, loading: orphansLoading } = useOrphansBasic();
  const orphanFromIndex = useMemo(() => findById(orphansIndex, id || ''), [orphansIndex, id]);
  const orphanUuid = orphanFromIndex?.uuid || null;
  const {
    orphan,
    loading: orphanLoading,
    error: orphanError,
    updateOrphan,
    insertUpdateLog,
    updateUpdateLog,
    deleteUpdateLog,
    insertAchievement,
    updateAchievement,
    deleteAchievement,
    upsertProgramParticipation,
    insertFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
  } = useOrphanDetail(orphanUuid);
  const { occasions: allOccasions, addOccasion, updateOccasion, deleteOccasion } = useOccasions();
  const { sponsors: sponsorsData } = useSponsorsBasic();
  const { userProfile, permissions, canEditOrphans, isSystemAdmin } = useAuth();
  const isTeamMember = userProfile?.role === 'team_member';
  const hasEditPermission = isTeamMember && canEditOrphans();
  const financialAccessContext = {
    role: userProfile?.role ?? null,
    permissions,
    isSystemAdmin: isSystemAdmin(),
  };
  const canSeeFinancialTab = canAccessOrphanFinancials(financialAccessContext);
  const canOpenFinancialSystem = canAccessFinancialSystem(financialAccessContext);
  
  const sponsor = useMemo(() => orphan ? findById(sponsorsData, orphan.sponsorId) : undefined, [orphan, sponsorsData]);
  const profileRef = useRef<HTMLDivElement>(null);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<number>(new Date().getFullYear());
  const financialYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>([currentYear]);

    orphan?.payments.forEach((payment) => {
      const dueDate = coerceToDate(payment.dueDate);
      if (dueDate) {
        years.add(dueDate.getFullYear());
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [orphan?.payments]);

  useEffect(() => {
    if (!financialYears.includes(selectedFinancialYear)) {
      setSelectedFinancialYear(financialYears[0] ?? new Date().getFullYear());
    }
  }, [financialYears, selectedFinancialYear]);

  const paymentsSorted = useMemo(() => {
    if (!orphan) return [];

    return [...orphan.payments].sort((a, b) => {
      const timeB = coerceToDate(b.dueDate)?.getTime() ?? 0;
      const timeA = coerceToDate(a.dueDate)?.getTime() ?? 0;
      return timeB - timeA;
    });
  }, [orphan]);

  const selectedYearPayments = useMemo(
    () => paymentsSorted.filter((payment) => (payment.year ?? coerceToDate(payment.dueDate)?.getFullYear()) === selectedFinancialYear),
    [paymentsSorted, selectedFinancialYear]
  );

  const financialOverview = useMemo(() => {
    const outstandingNow = paymentsSorted
      .filter((payment) => payment.status === PaymentStatus.Due || payment.status === PaymentStatus.Overdue)
      .reduce((sum, payment) => sum + payment.amount, 0);

    const processingNow = paymentsSorted
      .filter((payment) => payment.status === PaymentStatus.Processing)
      .reduce((sum, payment) => sum + payment.amount, 0);

    const paidThisYear = selectedYearPayments
      .filter((payment) => payment.status === PaymentStatus.Paid)
      .reduce((sum, payment) => sum + payment.amount, 0);

    const latestPaidPayment = paymentsSorted.find((payment) => payment.status === PaymentStatus.Paid && payment.paidDate);
    const nextActionPayment = [...paymentsSorted]
      .filter((payment) =>
        payment.status === PaymentStatus.Overdue ||
        payment.status === PaymentStatus.Due ||
        payment.status === PaymentStatus.Processing
      )
      .sort((a, b) => {
        const priority = (status: PaymentStatus) =>
          status === PaymentStatus.Overdue ? 0 :
          status === PaymentStatus.Due ? 1 :
          2;

        const priorityDiff = priority(a.status) - priority(b.status);
        if (priorityDiff !== 0) return priorityDiff;

        const timeA = coerceToDate(a.dueDate)?.getTime() ?? 0;
        const timeB = coerceToDate(b.dueDate)?.getTime() ?? 0;
        return timeA - timeB;
      })[0];

    const referenceMonthlyAmount = paymentsSorted[0]?.amount ?? 0;

    return {
      outstandingNow,
      processingNow,
      paidThisYear,
      latestPaidPayment,
      nextActionPayment,
      referenceMonthlyAmount,
    };
  }, [paymentsSorted, selectedYearPayments]);

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
    hobbies: [] as string[],
    needsAndWishes: [] as string[],
    eduProgramStatus: 'غير ملتحق' as ProgramParticipation['status'],
    eduProgramDetails: '',
    psychChildStatus: 'غير ملتحق' as ProgramParticipation['status'],
    psychChildDetails: '',
    psychGuardianStatus: 'غير ملتحق' as ProgramParticipation['status'],
    psychGuardianDetails: '',
  });
  const [familyDraft, setFamilyDraft] = useState<FamilyDraftRow[]>([]);
  const [hobbyInput, setHobbyInput] = useState('');
  const [needInput, setNeedInput] = useState('');
  
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

  const [timelineEditKey, setTimelineEditKey] = useState<string | null>(null);
  const [timelineDraft, setTimelineDraft] = useState({
    note: '',
    title: '',
    description: '',
    date: '',
  });

  useEffect(() => {
    if (!canSeeFinancialTab && activeTab === 'financial') {
      setActiveTab('overview');
    }
  }, [activeTab, canSeeFinancialTab]);

  // Initialize edit form data when orphan loads or edit mode is enabled
  React.useEffect(() => {
    if (orphan && isEditMode) {
      setEditFormData({
        name: orphan.name,
        dateOfBirth: toDateInputString(orphan.dateOfBirth),
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
        hobbies: [...orphan.hobbies],
        needsAndWishes: [...orphan.needsAndWishes],
        eduProgramStatus: orphan.educationalProgram.status,
        eduProgramDetails: orphan.educationalProgram.details,
        psychChildStatus: orphan.psychologicalSupport.child.status,
        psychChildDetails: orphan.psychologicalSupport.child.details,
        psychGuardianStatus: orphan.psychologicalSupport.guardian.status,
        psychGuardianDetails: orphan.psychologicalSupport.guardian.details,
      });
      setFamilyDraft(
        orphan.familyMembers.map((m) => ({
          id: m.id,
          relationship: m.relationship,
          age: m.age != null ? String(m.age) : '',
        }))
      );
      setHobbyInput('');
      setNeedInput('');
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
        const { data: sponsorOrphan } = await supabase
          .from('sponsor_orphans')
          .select('orphan_id')
          .eq('sponsor_id', userProfile.id)
          .eq('orphan_id', orphan.uuid)
          .single();

        if (sponsorOrphan) {
          setIsSponsorOfOrphan(true);
          
          // Fetch existing note
          const { data: noteData } = await supabase
            .from('sponsor_notes')
            .select('note')
            .eq('sponsor_id', userProfile.id)
            .eq('orphan_id', orphan.uuid)
            .single();

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
        const { data: noteData } = await supabase
          .from('sponsor_notes')
          .select(`
            note,
            updated_at,
            sponsor:user_profiles!sponsor_notes_sponsor_id_fkey(name)
          `)
          .eq('orphan_id', orphan.uuid)
          .single();

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
      const { error } = await supabase
        .from('sponsor_notes')
        .upsert({
          orphan_id: orphan.uuid,
          sponsor_id: userProfile.id,
          note: sponsorNote,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'orphan_id,sponsor_id'
        });

      if (error) throw error;

      setIsNoteModalOpen(false);
      // Refresh display note
      const { data: noteData } = await supabase
        .from('sponsor_notes')
        .select(`
          note,
          updated_at,
          sponsor:user_profiles!sponsor_notes_sponsor_id_fkey(name)
        `)
        .eq('orphan_id', orphan.uuid)
        .single();

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
    return (
      <ResponsiveState
        variant="loading"
        title="جاري تحميل ملف اليتيم"
        description="نرتب البيانات الأساسية والتفاصيل المرتبطة بالشكل الأنسب للهاتف."
      />
    );
  }

  if (!orphan && !orphanLoading) {
    return (
      <ResponsiveState
        variant="error"
        title="تعذر العثور على اليتيم"
        description="قد يكون الرابط غير مكتمل أو أن السجل غير متاح حاليًا."
      />
    );
  }

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/orphans');
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingPaymentId(null);
  };

  const handleSaveEdit = async () => {
    if (!orphan?.uuid) return;

    setIsSaving(true);
    try {
      await updateOrphan({
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
        hobbies: editFormData.hobbies,
        needs_wishes: editFormData.needsAndWishes,
      });

      await upsertProgramParticipation({
        program_type: 'educational',
        status: editFormData.eduProgramStatus,
        details: editFormData.eduProgramDetails,
      });
      await upsertProgramParticipation({
        program_type: 'psychological_child',
        status: editFormData.psychChildStatus,
        details: editFormData.psychChildDetails,
      });
      await upsertProgramParticipation({
        program_type: 'psychological_guardian',
        status: editFormData.psychGuardianStatus,
        details: editFormData.psychGuardianDetails,
      });

      const originalIds = new Set(orphan.familyMembers.map((m) => m.id));
      const draftWithIds = familyDraft.filter((r): r is FamilyDraftRow & { id: string } => Boolean(r.id));
      const draftIdSet = new Set(draftWithIds.map((r) => r.id));
      for (const oid of originalIds) {
        if (!draftIdSet.has(oid)) {
          await deleteFamilyMember(oid);
        }
      }
      for (const row of familyDraft) {
        const rel = row.relationship.trim();
        const ageNum = row.age.trim() === '' ? null : parseInt(row.age, 10);
        const ageVal = ageNum != null && !Number.isNaN(ageNum) ? ageNum : null;
        if (!row.id) {
          if (rel) await insertFamilyMember(rel, ageVal);
        } else {
          const orig = orphan.familyMembers.find((m) => m.id === row.id);
          if (
            orig &&
            (orig.relationship !== rel || (orig.age ?? null) !== ageVal)
          ) {
            await updateFamilyMember(row.id, rel, ageVal);
          }
        }
      }

      setIsEditMode(false);
    } catch (error) {
      console.error('Error saving orphan:', error);
      alert('حدث خطأ أثناء حفظ التغييرات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAchievement = async (
    newAchievementData: Omit<Achievement, 'id'> & { mediaFile?: File | null }
  ) => {
    if (!orphan?.uuid) return;
    try {
      let mediaUrl: string | null = null;
      let mediaType: 'image' | 'video' | null = null;
      const desc = newAchievementData.description;
      const dateStr = newAchievementData.date.toISOString().split('T')[0];
      const file = newAchievementData.mediaFile;
      if (file) {
        const uploaded = await uploadOrphanAchievementMedia(file, orphan.uuid);
        mediaUrl = uploaded.publicUrl;
        mediaType = uploaded.mediaType;
      }
      await insertAchievement({
        title: newAchievementData.title,
        description: desc,
        date: dateStr,
        mediaUrl,
        mediaType,
      });
      setIsAddAchievementModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء حفظ الإنجاز');
    }
  };

  const handleAddUpdateLog = async (note: string) => {
    try {
      await insertUpdateLog(note);
      setIsAddLogModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء حفظ الملاحظة');
    }
  };

  const startTimelineEdit = (item: {
    type: 'log' | 'achievement' | 'occasion';
    id: string;
    note?: string;
    title?: string;
    description?: string;
    date: Date | string;
  }) => {
    setTimelineEditKey(`${item.type}:${item.id}`);
    if (item.type === 'log') {
      setTimelineDraft({
        note: item.note || '',
        title: '',
        description: '',
        date: toDateInputString(item.date),
      });
    } else if (item.type === 'achievement') {
      setTimelineDraft({
        note: '',
        title: item.title || '',
        description: item.description || '',
        date: toDateInputString(item.date),
      });
    } else {
      setTimelineDraft({
        note: '',
        title: item.title || '',
        description: '',
        date: toDateInputString(item.date),
      });
    }
  };

  const cancelTimelineEdit = () => setTimelineEditKey(null);

  const saveTimelineEdit = async (item: { type: 'log' | 'achievement' | 'occasion'; id: string }) => {
    try {
      if (item.type === 'log') {
        if (!timelineDraft.note.trim()) {
          alert('نص التحديث مطلوب');
          return;
        }
        if (!timelineDraft.date) {
          alert('التاريخ مطلوب');
          return;
        }
        await updateUpdateLog(item.id, {
          note: timelineDraft.note.trim(),
          date: new Date(timelineDraft.date + 'T12:00:00.000Z').toISOString(),
        });
      } else if (item.type === 'achievement') {
        if (!timelineDraft.title.trim()) {
          alert('عنوان الإنجاز مطلوب');
          return;
        }
        if (!timelineDraft.date) {
          alert('التاريخ مطلوب');
          return;
        }
        await updateAchievement(item.id, {
          title: timelineDraft.title.trim(),
          description: timelineDraft.description.trim() || null,
          date: timelineDraft.date,
        });
      } else {
        const d = coerceToDate(timelineDraft.date);
        if (!timelineDraft.title.trim() || !d) {
          alert('عنوان المناسبة والتاريخ مطلوبان');
          return;
        }
        await updateOccasion(item.id, { title: timelineDraft.title.trim(), date: d });
      }
      cancelTimelineEdit();
    } catch (e) {
      console.error(e);
      alert('تعذر حفظ التعديل');
    }
  };

  const removeTimelineItem = async (item: {
    type: 'log' | 'achievement' | 'occasion';
    id: string;
    title?: string;
    note?: string;
  }) => {
    const label = (item.note || item.title || 'هذا العنصر').slice(0, 80);
    if (!confirm(`حذف «${label}»؟`)) return;
    try {
      if (item.type === 'log') await deleteUpdateLog(item.id);
      else if (item.type === 'achievement') await deleteAchievement(item.id);
      else await deleteOccasion(item.id);
      if (timelineEditKey === `${item.type}:${item.id}`) cancelTimelineEdit();
    } catch (e) {
      console.error(e);
      alert('تعذر حذف العنصر');
    }
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
                payments: orphan.payments.map(p => ({ status: p.status, amount: `$${p.amount}`, dueDate: toDateInputString(p.dueDate) })),
                achievements: orphan.achievements.map(a => a.title),
            };

            const prompt = `
            بصفتك باحث اجتماعي في منظمة "يتيم"، قم بإعداد تقرير موجز عن حالة اليتيم "${orphan.name}" بناءً على البيانات التالية. 
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
                payments: orphan.payments.map(p => ({ status: p.status, amount: p.amount, dueDate: toDateInputString(p.dueDate) })),
                achievements: orphan.achievements.map(a => ({ ...a, date: toDateInputString(a.date) })),
                specialOccasions: orphanOccasions.map(o => ({ ...o, date: toDateInputString(o.date) })),
            };

            const prompt = `
            بصفتك خبير في التنمية الاجتماعية ورعاية الأطفال في منظمة "يتيم"، قم بتحليل البيانات الشاملة التالية لليتيم "${orphan.name}".
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
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4"
                onClick={() => setIsSummaryModalOpen(false)}
            >
                <div className="max-h-[92svh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white p-4 shadow-xl md:max-h-[80vh] md:max-w-lg md:rounded-xl md:p-6" onClick={e => e.stopPropagation()}>
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
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4"
                onClick={() => setIsNeedsModalOpen(false)}
            >
                <div className="max-h-[92svh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white p-4 shadow-xl md:max-h-[90vh] md:max-w-2xl md:rounded-xl md:p-6" onClick={e => e.stopPropagation()}>
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

    <div ref={profileRef} className="min-h-screen bg-bg-page pb-24 md:pb-20">
        {/* Header / Cover */}
        <div className="relative mb-16 h-40 rounded-b-[2.5rem] bg-gradient-to-r from-primary to-primary-hover shadow-lg sm:h-44 md:mb-16 md:h-48">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_white,_transparent_60%)]" />
            
            {/* Actions Toolbar — edit/save primary control is sticky bar below header */}
            <div className="absolute start-3 end-3 top-3 flex items-start justify-between gap-2 no-print md:start-4 md:end-4 md:top-4">
                <button
                    type="button"
                    onClick={handleBackNavigation}
                    className="flex min-h-[44px] items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    رجوع
                </button>
                <div className="flex max-w-[68%] flex-wrap justify-end gap-2 md:max-w-none">
                    {isSponsorOfOrphan && (
                        <button onClick={() => setIsNoteModalOpen(true)} className="min-h-[44px] rounded-full bg-white/20 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30">ملاحظة</button>
                    )}
                    <button id="export-button-desktop" onClick={handleExportPDF} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/30" title="طباعة">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    </button>
                    <button onClick={handleGenerateSummaryReport} className="flex min-h-[44px] items-center gap-1 rounded-full bg-white/20 px-3 py-2 text-white backdrop-blur-sm transition hover:bg-white/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        <span className="hidden text-sm sm:inline">تقرير ذكي</span>
                    </button>
                </div>
            </div>

            {/* Avatar + Name */}
            <div className="absolute -bottom-12 start-4 end-4 flex flex-col items-start gap-4 text-start md:-bottom-14 md:start-auto md:end-16 md:flex-row md:items-center md:gap-6">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-md md:h-40 md:w-40">
                    {orphan.uuid ? (
                        <AvatarUpload
                            currentAvatarUrl={orphan.photoUrl}
                            name={orphan.name}
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
                            className="!h-full !w-full !text-3xl md:!text-4xl"
                        />
                    )}
                </motion.div>
                <div className="max-w-full text-white drop-shadow-md md:-translate-y-12">
                    {isEditMode ? (
                        <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full max-w-xs rounded-lg border-2 border-primary bg-white/90 px-4 py-2 text-start text-xl font-bold text-gray-900 md:text-4xl"
                        />
                    ) : (
                        <h1 className="text-2xl font-bold md:text-4xl">{orphan.name}</h1>
                    )}
                    <p className="opacity-90 text-sm md:text-base font-medium">{(isEditMode ? editFormData.grade : orphan.grade) || '—'} • {orphan.age} سنوات</p>
                </div>
            </div>
        </div>

        <div className="mx-auto max-w-6xl px-3 sm:px-4 md:px-6">
            {hasEditPermission && (
                <div className="sticky top-14 z-20 -mx-3 mb-2 flex flex-col gap-3 border-b border-gray-200/80 bg-bg-page/95 px-3 py-3 backdrop-blur-sm no-print sm:-mx-4 sm:px-4 md:top-0 md:-mx-6 md:flex-row md:items-center md:justify-between md:px-6">
                    <span className="text-sm font-semibold text-gray-600">ملف اليتيم</span>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        {isEditMode ? (
                            <>
                                <button type="button" onClick={handleCancelEdit} className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                    إلغاء
                                </button>
                                <button type="button" onClick={handleSaveEdit} disabled={isSaving} className="min-h-[44px] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
                                    {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                </button>
                            </>
                        ) : (
                            <button type="button" onClick={handleEdit} className="min-h-[44px] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
                                تعديل الملف
                            </button>
                        )}
                    </div>
                </div>
            )}
            {/* Tabs Navigation */}
            <div className="-mx-3 mb-5 flex snap-x snap-mandatory overflow-x-auto border-b border-gray-200 px-3 no-print [scrollbar-width:none] sm:mx-0 sm:px-0 md:mb-6" style={{ scrollbarWidth: 'none' }}>
                <TabButton active={activeTab === 'overview'} label="نظرة عامة" onClick={() => setActiveTab('overview')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>} />
                <TabButton active={activeTab === 'education'} label="التعليم" onClick={() => setActiveTab('education')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>} />
                <TabButton active={activeTab === 'timeline'} label="الجدول الزمني" onClick={() => setActiveTab('timeline')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
                <TabButton active={activeTab === 'gallery'} label="المعرض" onClick={() => setActiveTab('gallery')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} />
                {canSeeFinancialTab && (
                    <TabButton active={activeTab === 'financial'} label="المالية" onClick={() => setActiveTab('financial')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
                )}
            </div>

            <div className="min-h-[400px]">
                {/* ==================== TAB 1: OVERVIEW ==================== */}
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Info Card */}
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="font-bold text-lg text-gray-800">البيانات الشخصية</h3>
                                {!isEditMode && (orphan.healthStatus || '').trim() !== '' && (
                                    <span className={`px-2 py-1 rounded text-xs ${(orphan.healthStatus || '').includes('جيدة') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {orphan.healthStatus}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="col-span-2">
                                    <EditableField
                                        label="الحالة الصحية"
                                        value={isEditMode ? editFormData.healthStatus : orphan.healthStatus}
                                        isEditing={isEditMode}
                                        onChange={(v) => setEditFormData({ ...editFormData, healthStatus: v })}
                                        type="textarea"
                                        textareaRows={2}
                                    />
                                    {isEditMode && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {HEALTH_STATUS_PRESETS.filter(Boolean).map((preset) => (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => setEditFormData({ ...editFormData, healthStatus: preset })}
                                                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 hover:bg-primary-light"
                                                >
                                                    {preset}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <EditableField label="تاريخ الميلاد" value={isEditMode ? editFormData.dateOfBirth : formatDateArEG(orphan.dateOfBirth)} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, dateOfBirth: v })} type="date" />
                                <EditableField label="الجنس" value={isEditMode ? editFormData.gender : orphan.gender} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, gender: v as 'ذكر' | 'أنثى' })} options={['ذكر', 'أنثى']} type="select" />
                                <EditableField label="الدولة" value={isEditMode ? editFormData.country : orphan.country} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, country: v })} />
                                <EditableField label="المحافظة" value={isEditMode ? editFormData.governorate : orphan.governorate} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, governorate: v })} />
                                <div className="col-span-2">
                                    <EditableField label="القائم بالرعاية" value={isEditMode ? editFormData.guardian : orphan.guardian} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, guardian: v })} />
                                </div>
                            </div>
                        </div>

                        {/* Sponsorship Info */}
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">تفاصيل الكفالة</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 md:h-10 md:w-10">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">الكافل</p>
                                        {sponsor ? <Link to={`/sponsor/${sponsor.id}`} className="font-semibold text-primary hover:underline">{sponsor.name}</Link> : <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600 md:h-10 md:w-10">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">نوع الكفالة</p>
                                        {isEditMode ? (
                                            <input type="text" value={editFormData.sponsorshipType} onChange={(e) => setEditFormData({ ...editFormData, sponsorshipType: e.target.value })} className="min-h-[44px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-primary" />
                                        ) : (
                                            <p className="font-semibold text-gray-800">{orphan.sponsorshipType}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social & Housing */}
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">الحالة الاجتماعية والسكن</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <EditableField label="العائلة" value={isEditMode ? editFormData.familyStatus : orphan.familyStatus} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, familyStatus: v })} />
                                <EditableField label="السكن" value={isEditMode ? editFormData.housingStatus : orphan.housingStatus} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, housingStatus: v })} />
                            </div>
                            <div className="mt-4 pt-3 border-t">
                                <h4 className="text-xs text-gray-500 mb-2">أفراد الأسرة</h4>
                                {isEditMode && hasEditPermission ? (
                                    <div className="space-y-3">
                                        {familyDraft.map((row, idx) => (
                                            <div key={row.id || `new-${idx}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                                <input
                                                    type="text"
                                                    className="min-h-[44px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                                    placeholder="صلة القرابة"
                                                    value={row.relationship}
                                                    onChange={(e) => {
                                                        const next = [...familyDraft];
                                                        next[idx] = { ...next[idx], relationship: e.target.value };
                                                        setFamilyDraft(next);
                                                    }}
                                                />
                                                <input
                                                    type="number"
                                                    min={0}
                                                    className="min-h-[44px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm sm:w-24"
                                                    placeholder="العمر"
                                                    value={row.age}
                                                    onChange={(e) => {
                                                        const next = [...familyDraft];
                                                        next[idx] = { ...next[idx], age: e.target.value };
                                                        setFamilyDraft(next);
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="min-h-[44px] rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-50 sm:px-2"
                                                    onClick={() => setFamilyDraft(familyDraft.filter((_, i) => i !== idx))}
                                                >
                                                    حذف
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            className="min-h-[44px] self-start rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-light"
                                            onClick={() => setFamilyDraft([...familyDraft, { relationship: '', age: '' }])}
                                        >
                                            + إضافة فرد
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {orphan.familyMembers.length > 0 ? (
                                            orphan.familyMembers.map((member) => (
                                                <p key={member.id} className="text-sm text-gray-700">
                                                    - {member.relationship} (العمر: {member.age ?? '—'})
                                                </p>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400">لا يوجد أفراد مسجلون</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Interests & Needs */}
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <svg className="text-yellow-500" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                        الهوايات والاهتمامات
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(isEditMode ? editFormData.hobbies : orphan.hobbies).length > 0 ? (
                                            (isEditMode ? editFormData.hobbies : orphan.hobbies).map((hobby, i) => (
                                                <span
                                                    key={`${hobby}-${i}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-800 rounded-full text-sm font-medium border border-yellow-100"
                                                >
                                                    {hobby}
                                                    {isEditMode && (
                                                        <button
                                                            type="button"
                                                            className="text-yellow-900 hover:text-red-600 font-bold leading-none"
                                                            aria-label="إزالة"
                                                            onClick={() =>
                                                                setEditFormData({
                                                                    ...editFormData,
                                                                    hobbies: editFormData.hobbies.filter((_, j) => j !== i),
                                                                })
                                                            }
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-400">لا توجد بيانات</span>
                                        )}
                                    </div>
                                    {isEditMode && (
                                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                            <input
                                                type="text"
                                                value={hobbyInput}
                                                onChange={(e) => setHobbyInput(e.target.value)}
                                                placeholder="أضف هواية..."
                                                className="min-h-[44px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const t = hobbyInput.trim();
                                                        if (t) {
                                                            setEditFormData({ ...editFormData, hobbies: [...editFormData.hobbies, t] });
                                                            setHobbyInput('');
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold hover:bg-gray-200"
                                                onClick={() => {
                                                    const t = hobbyInput.trim();
                                                    if (t) {
                                                        setEditFormData({ ...editFormData, hobbies: [...editFormData.hobbies, t] });
                                                        setHobbyInput('');
                                                    }
                                                }}
                                            >
                                                إضافة
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t pt-3">
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <svg className="text-red-500" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                        الاحتياجات والأمنيات
                                    </h4>
                                    <ul className="space-y-2">
                                        {(isEditMode ? editFormData.needsAndWishes : orphan.needsAndWishes).length > 0 ? (
                                            (isEditMode ? editFormData.needsAndWishes : orphan.needsAndWishes).map((need, i) => (
                                                <li key={`${need}-${i}`} className="flex items-center gap-2 text-sm text-gray-700">
                                                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></span>
                                                    <span className="flex-1">{need}</span>
                                                    {isEditMode && (
                                                        <button
                                                            type="button"
                                                            className="text-red-600 text-xs hover:underline"
                                                            onClick={() =>
                                                                setEditFormData({
                                                                    ...editFormData,
                                                                    needsAndWishes: editFormData.needsAndWishes.filter((_, j) => j !== i),
                                                                })
                                                            }
                                                        >
                                                            حذف
                                                        </button>
                                                    )}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-sm text-gray-400">لا توجد بيانات</li>
                                        )}
                                    </ul>
                                    {isEditMode && (
                                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                            <input
                                                type="text"
                                                value={needInput}
                                                onChange={(e) => setNeedInput(e.target.value)}
                                                placeholder="أضف احتياجاً أو أمنية..."
                                                className="min-h-[44px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const t = needInput.trim();
                                                        if (t) {
                                                            setEditFormData({
                                                                ...editFormData,
                                                                needsAndWishes: [...editFormData.needsAndWishes, t],
                                                            });
                                                            setNeedInput('');
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold hover:bg-gray-200"
                                                onClick={() => {
                                                    const t = needInput.trim();
                                                    if (t) {
                                                        setEditFormData({
                                                            ...editFormData,
                                                            needsAndWishes: [...editFormData.needsAndWishes, t],
                                                        });
                                                        setNeedInput('');
                                                    }
                                                }}
                                            >
                                                إضافة
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Yetim Programs - Full Width */}
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:col-span-2 md:p-6">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">برامج يتيم</h3>
                            <div className="space-y-4">
                                <ProgramParticipationFields
                                    isEditing={isEditMode && hasEditPermission}
                                    title="البرنامج التربوي"
                                    status={isEditMode ? editFormData.eduProgramStatus : orphan.educationalProgram.status}
                                    details={isEditMode ? editFormData.eduProgramDetails : orphan.educationalProgram.details}
                                    onStatus={(s) => setEditFormData({ ...editFormData, eduProgramStatus: s })}
                                    onDetails={(d) => setEditFormData({ ...editFormData, eduProgramDetails: d })}
                                />
                                <div className="border-t pt-4">
                                    <h4 className="font-bold text-gray-700 text-sm mb-3">الدعم النفسي</h4>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                            <p className="font-semibold text-gray-700 text-xs">للطفل ({orphan.name})</p>
                                            <ProgramParticipationFields
                                                isEditing={isEditMode && hasEditPermission}
                                                title=""
                                                status={isEditMode ? editFormData.psychChildStatus : orphan.psychologicalSupport.child.status}
                                                details={isEditMode ? editFormData.psychChildDetails : orphan.psychologicalSupport.child.details}
                                                onStatus={(s) => setEditFormData({ ...editFormData, psychChildStatus: s })}
                                                onDetails={(d) => setEditFormData({ ...editFormData, psychChildDetails: d })}
                                            />
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                            <p className="font-semibold text-gray-700 text-xs">للقائم بالرعاية ({isEditMode ? editFormData.guardian || orphan.guardian : orphan.guardian})</p>
                                            <ProgramParticipationFields
                                                isEditing={isEditMode && hasEditPermission}
                                                title=""
                                                status={isEditMode ? editFormData.psychGuardianStatus : orphan.psychologicalSupport.guardian.status}
                                                details={isEditMode ? editFormData.psychGuardianDetails : orphan.psychologicalSupport.guardian.details}
                                                onStatus={(s) => setEditFormData({ ...editFormData, psychGuardianStatus: s })}
                                                onDetails={(d) => setEditFormData({ ...editFormData, psychGuardianDetails: d })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sponsor Note (visible to sponsor only) */}
                        {userProfile?.role === 'sponsor' && displayNote && (
                            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 shadow-sm md:col-span-2 md:p-6">
                                <h3 className="font-bold text-lg text-gray-800 mb-3">ملاحظة الكافل</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600">من: <span className="font-semibold text-gray-800">{displayNote.sponsorName}</span></p>
                                        <p className="text-xs text-gray-500">آخر تحديث: {formatDateArShort(displayNote.updatedAt)}</p>
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
                        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
                            {/* Academic Performance Chart */}
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:col-span-2 md:p-6">
                                <h3 className="mb-4 text-lg font-bold text-gray-800 md:mb-6">تطور الأداء الدراسي</h3>
                                <div className="h-64 w-full md:h-[300px]" dir="ltr">
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
                                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                                    <h3 className="font-bold text-gray-800 mb-4">الملخص الأكاديمي</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <EditableField label="المرحلة" value={isEditMode ? editFormData.grade : orphan.grade} isEditing={isEditMode} onChange={(v) => setEditFormData({ ...editFormData, grade: v })} />
                                        </div>
                                        <EditableField
                                            label="الانتظام"
                                            value={isEditMode ? editFormData.attendance : orphan.attendance}
                                            isEditing={isEditMode}
                                            onChange={(v) => setEditFormData({ ...editFormData, attendance: v })}
                                            type="select"
                                            options={[...new Set([...ATTENDANCE_OPTIONS, orphan.attendance, editFormData.attendance].filter((x) => x !== undefined && x !== null))] as string[]}
                                        />
                                        <EditableField
                                            label="المستوى (الأداء)"
                                            value={isEditMode ? editFormData.performance : orphan.performance}
                                            isEditing={isEditMode}
                                            onChange={(v) => setEditFormData({ ...editFormData, performance: v })}
                                            type="select"
                                            options={[...new Set([...PERFORMANCE_OPTIONS, orphan.performance, editFormData.performance].filter((x) => x !== undefined && x !== null))] as string[]}
                                        />
                                        <div className="pt-2 border-t border-gray-100">
                                            <p className="text-sm text-gray-500 mb-1">ملاحظات المعلم</p>
                                            <p className="text-sm text-gray-400 italic">لا يوجد حقل مخصص لملاحظات المعلم في النظام حالياً.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                                    <h3 className="font-bold text-gray-800 mb-3">البرنامج التعليمي</h3>
                                    <ProgramParticipationFields
                                        isEditing={isEditMode && hasEditPermission}
                                        title=""
                                        status={isEditMode ? editFormData.eduProgramStatus : orphan.educationalProgram.status}
                                        details={isEditMode ? editFormData.eduProgramDetails : orphan.educationalProgram.details}
                                        onStatus={(s) => setEditFormData({ ...editFormData, eduProgramStatus: s })}
                                        onDetails={(d) => setEditFormData({ ...editFormData, eduProgramDetails: d })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Psychological Support */}
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                            <h3 className="font-bold text-lg text-gray-800 mb-4">الدعم النفسي</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    <p className="font-semibold text-gray-700 text-sm">للطفل ({orphan.name})</p>
                                    <ProgramParticipationFields
                                        isEditing={isEditMode && hasEditPermission}
                                        title=""
                                        status={isEditMode ? editFormData.psychChildStatus : orphan.psychologicalSupport.child.status}
                                        details={isEditMode ? editFormData.psychChildDetails : orphan.psychologicalSupport.child.details}
                                        onStatus={(s) => setEditFormData({ ...editFormData, psychChildStatus: s })}
                                        onDetails={(d) => setEditFormData({ ...editFormData, psychChildDetails: d })}
                                    />
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    <p className="font-semibold text-gray-700 text-sm">للقائم بالرعاية ({isEditMode ? editFormData.guardian || orphan.guardian : orphan.guardian})</p>
                                    <ProgramParticipationFields
                                        isEditing={isEditMode && hasEditPermission}
                                        title=""
                                        status={isEditMode ? editFormData.psychGuardianStatus : orphan.psychologicalSupport.guardian.status}
                                        details={isEditMode ? editFormData.psychGuardianDetails : orphan.psychologicalSupport.guardian.details}
                                        onStatus={(s) => setEditFormData({ ...editFormData, psychGuardianStatus: s })}
                                        onDetails={(d) => setEditFormData({ ...editFormData, psychGuardianDetails: d })}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ==================== TAB 3: TIMELINE ==================== */}
                {activeTab === 'timeline' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {/* Activity Timeline */}
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-lg font-bold text-gray-800">سجل النشاطات والأحداث</h3>
                                {hasEditPermission && (
                                <button type="button" onClick={() => setIsAddLogModalOpen(true)} className="flex min-h-[44px] w-full items-center justify-center gap-1 rounded-full bg-primary-light px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white sm:w-auto">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    إضافة تحديث
                                </button>
                                )}
                            </div>
                            <div className="relative ms-3 space-y-6 border-s-2 border-gray-200 md:space-y-8">
                                {[
                                    ...orphan.updateLogs.map((l) => ({ ...l, type: 'log' as const })),
                                    ...orphan.achievements.map((a) => ({ ...a, type: 'achievement' as const })),
                                    ...orphanOccasions.map((o) => ({ ...o, type: 'occasion' as const })),
                                ]
                                    .sort((a, b) => {
                                        const tb = coerceToDate(b.date)?.getTime() ?? 0;
                                        const ta = coerceToDate(a.date)?.getTime() ?? 0;
                                        return tb - ta;
                                    })
                                    .map((item) => {
                                        const rowKey = `${item.type}:${item.id}`;
                                        const isEditingRow = timelineEditKey === rowKey;
                                        return (
                                            <div key={rowKey} className="relative ps-6 md:ps-8">
                                                <div
                                                    className={`absolute start-0 top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white shadow-sm md:h-4 md:w-4
                                                ${item.type === 'achievement' ? 'bg-green-500' : item.type === 'occasion' ? 'bg-purple-500' : 'bg-blue-500'}
                                            `}
                                                ></div>
                                                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-400">
                                                            {formatDateArEG(item.date)}
                                                        </span>
                                                        {item.type === 'achievement' && (
                                                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                                                إنجاز
                                                            </span>
                                                        )}
                                                        {item.type === 'occasion' && (
                                                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                                                مناسبة
                                                            </span>
                                                        )}
                                                        {item.type === 'log' && (
                                                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                                                تحديث
                                                            </span>
                                                        )}
                                                    </div>
                                                    {hasEditPermission && !isEditingRow && (
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => startTimelineEdit(item)}
                                                                className="min-h-[36px] rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary-light"
                                                            >
                                                                تعديل
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeTimelineItem(item)}
                                                                className="min-h-[36px] rounded-lg px-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                                            >
                                                                حذف
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {isEditingRow ? (
                                                    <div className="mt-2 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                        {item.type === 'log' && (
                                                            <>
                                                                <label className="text-xs text-gray-500 block">نص التحديث</label>
                                                                <textarea
                                                                    value={timelineDraft.note}
                                                                    onChange={(e) =>
                                                                        setTimelineDraft({ ...timelineDraft, note: e.target.value })
                                                                    }
                                                                    rows={4}
                                                                    className="min-h-[6rem] w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                                                />
                                                            </>
                                                        )}
                                                        {(item.type === 'achievement' || item.type === 'occasion') && (
                                                            <>
                                                                <label className="text-xs text-gray-500 block">العنوان</label>
                                                                <input
                                                                    type="text"
                                                                    value={timelineDraft.title}
                                                                    onChange={(e) =>
                                                                        setTimelineDraft({ ...timelineDraft, title: e.target.value })
                                                                    }
                                                                    className="min-h-[44px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                                                />
                                                            </>
                                                        )}
                                                        {item.type === 'achievement' && (
                                                            <>
                                                                <label className="text-xs text-gray-500 block">الوصف</label>
                                                                <textarea
                                                                    value={timelineDraft.description}
                                                                    onChange={(e) =>
                                                                        setTimelineDraft({
                                                                            ...timelineDraft,
                                                                            description: e.target.value,
                                                                        })
                                                                    }
                                                                    rows={3}
                                                                    className="min-h-[6rem] w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                                                />
                                                            </>
                                                        )}
                                                        <label className="text-xs text-gray-500 block">التاريخ</label>
                                                        <input
                                                            type="date"
                                                            value={timelineDraft.date}
                                                            onChange={(e) =>
                                                                setTimelineDraft({ ...timelineDraft, date: e.target.value })
                                                            }
                                                            className="min-h-[44px] w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                                        />
                                                        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                                                            <button
                                                                type="button"
                                                                onClick={() => saveTimelineEdit(item)}
                                                                className="min-h-[44px] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                                                            >
                                                                حفظ
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelTimelineEdit}
                                                                className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                                            >
                                                                إلغاء
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h4 className="font-bold text-gray-800">
                                                            {item.title || item.note || 'تحديث'}
                                                        </h4>
                                                        {item.description && (
                                                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                                        )}
                                                        {item.author && (
                                                            <p className="text-xs text-gray-500 mt-1">بواسطة: {item.author}</p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                {orphan.updateLogs.length === 0 && orphan.achievements.length === 0 && orphanOccasions.length === 0 && (
                                    <p className="text-center text-gray-400 py-8">لا توجد أحداث مسجلة</p>
                                )}
                            </div>
                        </div>

                        {/* Interactive Calendar */}
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                            <h3 className="font-bold text-lg text-gray-800 mb-4">الرزنامة التفاعلية</h3>
                            <InteractiveCalendar orphan={orphan} occasions={orphanOccasions} onDayClick={handleDayClickForEvent} />
                        </div>

                        {/* Occasions & Gifts */}
                        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                                <h3 className="font-bold text-gray-800 mb-3">مناسبات خاصة</h3>
                                {orphanOccasions.length > 0 ? orphanOccasions.map(occ => (
                                    <div key={occ.id} className="flex items-center gap-2 py-2 border-b last:border-0">
                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                        <span className="font-semibold text-sm text-gray-800">{occ.title}</span>
                                        <span className="ms-auto text-xs text-gray-500">{formatDateArEG(occ.date)}</span>
                                    </div>
                                )) : <p className="text-sm text-gray-400">لا توجد مناسبات.</p>}
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                                <h3 className="font-bold text-gray-800 mb-3">الهدايا</h3>
                                {orphan.gifts.length > 0 ? orphan.gifts.map(gift => (
                                    <div key={gift.id} className="flex items-center gap-2 py-2 border-b last:border-0">
                                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                        <span className="font-semibold text-sm text-gray-800">{gift.item}</span>
                                        <span className="ms-auto text-xs text-gray-500">من {gift.from}</span>
                                    </div>
                                )) : <p className="text-sm text-gray-400">لا توجد هدايا مسجلة.</p>}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ==================== TAB 4: GALLERY ==================== */}
                {activeTab === 'gallery' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-lg font-bold text-gray-800">معرض الصور والإنجازات</h3>
                            {hasEditPermission && (
                            <button type="button" onClick={() => setIsAddAchievementModalOpen(true)} className="flex min-h-[44px] w-full items-center justify-center gap-1 rounded-full bg-primary-light px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white sm:w-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                إضافة إنجاز
                            </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
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
                        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                                <h3 className="font-bold text-gray-800 mb-4">قائمة الإنجازات</h3>
                                <div className="space-y-3">
                                    {orphan.achievements.map(ach => (
                                        <div key={ach.id} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3">
                                            <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{ach.title} <span className="font-normal text-gray-500">- {formatDateArEG(ach.date)}</span></p>
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
                {canSeeFinancialTab && activeTab === 'financial' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary-light via-white to-white p-5 shadow-sm md:p-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-primary">الملف المالي</p>
                                    <h3 className="text-xl font-bold text-gray-900 md:text-2xl">قراءة سريعة للوضع المالي لليتيم</h3>
                                    <p className="max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
                                        هذا التبويب مخصص للمتابعة والقراءة السريعة: حالة الأشهر، المبالغ المدفوعة والمستحقة، والحركات المالية المرتبطة. التعديلات التشغيلية تتم من النظام المالي.
                                    </p>
                                </div>
                                {canOpenFinancialSystem && (
                                    <Link
                                        to={buildFinancialSystemUrl(orphan.id)}
                                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                                    >
                                        فتح في النظام المالي
                                    </Link>
                                )}
                            </div>
                            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                                <p className="font-semibold">قاعدة العمل</p>
                                <p className="mt-1">
                                    حالات <span className="font-semibold">مستحق</span> و<span className="font-semibold">متأخر</span> و<span className="font-semibold">قيد المعالجة</span> تُدار من النظام المالي، أما <span className="font-semibold">مدفوع</span> فتُسجل فقط عند إضافة حركة مالية مرتبطة.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <FinancialMetricCard
                                title="الكافل الحالي"
                                value={sponsor?.name || 'غير محدد'}
                                helper={financialOverview.referenceMonthlyAmount > 0 ? `المبلغ المرجعي الشهري: $${financialOverview.referenceMonthlyAmount.toLocaleString()}` : 'لا يوجد مبلغ مرجعي بعد'}
                                tone="primary"
                            />
                            <FinancialMetricCard
                                title="المستحق الآن"
                                value={`$${financialOverview.outstandingNow.toLocaleString()}`}
                                helper={`قيد المعالجة: $${financialOverview.processingNow.toLocaleString()}`}
                                tone="yellow"
                            />
                            <FinancialMetricCard
                                title={`المدفوع في ${selectedFinancialYear}`}
                                value={`$${financialOverview.paidThisYear.toLocaleString()}`}
                                helper={financialOverview.latestPaidPayment ? `آخر دفعة: ${formatDateArShort(financialOverview.latestPaidPayment.paidDate)}` : 'لا توجد دفعات مدفوعة بعد'}
                                tone="green"
                            />
                            <FinancialMetricCard
                                title="الإجراء التالي"
                                value={financialOverview.nextActionPayment ? financialOverview.nextActionPayment.status : 'لا يوجد'}
                                helper={financialOverview.nextActionPayment ? `${formatDateArShort(financialOverview.nextActionPayment.dueDate)} • $${financialOverview.nextActionPayment.amount.toLocaleString()}` : 'لا توجد دفعات تحتاج متابعة حالياً'}
                                tone="slate"
                            />
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr),minmax(320px,1fr)]">
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">ملخص الأشهر</h3>
                                        <p className="mt-1 text-sm text-gray-500">عرض حالة كل شهر في السنة المحددة.</p>
                                    </div>
                                    <select
                                        value={selectedFinancialYear}
                                        onChange={(e) => setSelectedFinancialYear(parseInt(e.target.value, 10))}
                                        className="min-h-[44px] rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800"
                                    >
                                        {financialYears.map((year) => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                                {selectedYearPayments.length === 0 && (
                                    <div className="mb-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                                        لا توجد دفعات مسجلة في سنة {selectedFinancialYear} بعد. ستظهر الأشهر هنا تلقائياً عندما يبدأ تسجيل الحالات أو الدفعات.
                                    </div>
                                )}
                                <YearlyPaymentSummary payments={selectedYearPayments} year={selectedFinancialYear} />
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                                <h3 className="text-lg font-bold text-gray-800">قراءة تشغيلية سريعة</h3>
                                <div className="mt-4 space-y-3">
                                    <div className="rounded-2xl bg-gray-50 p-4">
                                        <p className="text-sm text-gray-500">آخر دفعة مدفوعة</p>
                                        <p className="mt-2 text-base font-bold text-gray-900">
                                            {financialOverview.latestPaidPayment ? formatDateArEG(financialOverview.latestPaidPayment.paidDate) : 'لا يوجد بعد'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-gray-50 p-4">
                                        <p className="text-sm text-gray-500">الشهر التالي الذي يحتاج متابعة</p>
                                        <p className="mt-2 text-base font-bold text-gray-900">
                                            {financialOverview.nextActionPayment ? formatDateArShort(financialOverview.nextActionPayment.dueDate) : 'لا يوجد حالياً'}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-600">
                                            {financialOverview.nextActionPayment ? `${financialOverview.nextActionPayment.status} • $${financialOverview.nextActionPayment.amount.toLocaleString()}` : 'جميع الدفعات الحالية مستقرة'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-gray-50 p-4">
                                        <p className="text-sm text-gray-500">عدد السجلات في السنة المحددة</p>
                                        <p className="mt-2 text-base font-bold text-gray-900">{selectedYearPayments.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">سجل الدفعات السنوي</h3>
                                    <p className="mt-1 text-sm text-gray-500">عرض تفصيلي لسجلات سنة {selectedFinancialYear}.</p>
                                </div>
                                <span className="text-sm font-medium text-gray-500">{selectedYearPayments.length} سجل</span>
                            </div>
                            {selectedYearPayments.length > 0 ? (
                                <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                                    <table className="w-full min-w-[640px] text-right text-sm">
                                        <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                                <th className="rounded-r-lg p-3">الشهر / الاستحقاق</th>
                                                <th className="p-3">المبلغ</th>
                                                <th className="p-3">الحالة</th>
                                                <th className="p-3">تاريخ الدفع</th>
                                                <th className="rounded-l-lg p-3">المصدر</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedYearPayments.map((payment) => (
                                                <tr key={payment.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                                    <td className="p-3">
                                                        <div className="font-semibold text-gray-800">{formatDateArShort(payment.dueDate)}</div>
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            {coerceToDate(payment.dueDate)?.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 font-bold text-gray-900">${payment.amount.toLocaleString()}</td>
                                                    <td className="p-3"><PaymentStatusBadge status={payment.status} /></td>
                                                    <td className="p-3 text-gray-500">{payment.paidDate ? formatDateArEG(payment.paidDate) : '—'}</td>
                                                    <td className="p-3 text-sm text-gray-600">
                                                        {payment.status === PaymentStatus.Paid
                                                            ? payment.paidTransactionId
                                                                ? 'مرتبطة بحركة مالية'
                                                                : 'سجل مدفوع'
                                                            : payment.status === PaymentStatus.Processing
                                                                ? 'بانتظار الإكمال'
                                                                : 'حالة شهرية'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                                    لا توجد سجلات دفع لعرضها في سنة {selectedFinancialYear}.
                                </div>
                            )}
                        </div>

                        <FinancialRecordCard
                            orphanId={orphan.id}
                            showOpenInFinancialSystem={canOpenFinancialSystem}
                        />

                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                                تقارير مساندة
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-bold text-gray-800">موجز سريع للحالة</h4>
                                    <p className="text-sm my-2 text-gray-600">ملخص سريع يربط بين الوضع المالي والأكاديمي ويعطي صورة عامة عن الحالة.</p>
                                    <button onClick={handleGenerateSummaryReport} className="text-sm font-semibold py-2 px-4 bg-primary-light text-primary rounded-lg hover:bg-primary hover:text-white transition-colors w-full">
                                        إنشاء موجز
                                    </button>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-bold text-gray-800">تقرير تقييم الاحتياجات</h4>
                                    <p className="text-sm my-2 text-gray-600">تحليل أوسع لبيانات اليتيم يساعد الفريق على فهم الأولويات القادمة.</p>
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
        allowManage={hasEditPermission}
    />

    {/* Sponsor Note Modal */}
    {isNoteModalOpen && (
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black bg-opacity-60 p-0 md:items-center md:p-4" onClick={() => setIsNoteModalOpen(false)}>
        <div className="w-full rounded-t-[1.75rem] bg-white p-4 shadow-xl md:max-w-2xl md:rounded-xl md:p-6" onClick={(e) => e.stopPropagation()}>
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
            className="mb-4 min-h-[200px] w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2"
            autoFocus
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button 
              type="button" 
              onClick={() => setIsNoteModalOpen(false)} 
              className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 font-semibold text-text-secondary hover:bg-gray-200"
            >
              إلغاء
            </button>
            <button 
              onClick={handleSaveNote}
              disabled={isNoteLoading}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
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
