import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useOrphansPaginated, createOrphan } from '../hooks/useOrphans';
import { Orphan } from '../types';
import EntityCard, { EntityCardField } from './EntityCard';
import { DataTable } from './DataTable';
import { ColumnDef } from '@tanstack/react-table';
import Avatar from './Avatar';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { formatListDisplayName } from '../utils/displayNames';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const AddOrphanModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; age: number; grade: string; country: string }) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [grade, setGrade] = useState('');
    const [country, setCountry] = useState('');
    useBodyScrollLock(isOpen);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && age && grade && country) {
            onSave({ name, age: parseInt(age), grade, country });
            setName(''); setAge(''); setGrade(''); setCountry('');
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 md:items-center md:p-4" onClick={onClose}>
            <div
                className="flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl md:h-auto md:max-h-[90vh] md:max-w-md md:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-center pt-2 md:hidden">
                    <span className="h-1 w-10 rounded-full bg-gray-300" />
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 md:px-6 md:py-4">
                    <h3 className="text-base font-bold text-gray-900 md:text-xl">إضافة يتيم جديد</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 md:h-11 md:w-11"
                        aria-label="إغلاق"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 md:space-y-4 md:px-6">
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" required />
                        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="العمر" className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" required />
                        <input type="text" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="المرحلة الدراسية" className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" required />
                        <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="الدولة" className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:flex md:justify-end md:px-6 md:py-4 md:pb-4">
                        <button type="button" onClick={onClose} className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-gray-100 px-5 py-3 font-semibold text-text-secondary transition-colors hover:bg-gray-200">إلغاء</button>
                        <button type="submit" className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-hover">إضافة</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SendMessageModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string) => void;
    title: string;
}> = ({ isOpen, onClose, onSend, title }) => {
    const [message, setMessage] = useState('');
    useBodyScrollLock(isOpen);

    if (!isOpen) return null;

    const handleSend = () => {
        if (message.trim()) {
            onSend(message.trim());
            setMessage('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 md:items-center md:p-4" onClick={onClose}>
            <div
                className="flex max-h-[75dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-center pt-2 md:hidden">
                    <span className="h-1 w-10 rounded-full bg-gray-300" />
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 md:px-6 md:py-4">
                    <h3 className="text-base font-bold text-gray-900 md:text-xl">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 md:h-11 md:w-11"
                        aria-label="إغلاق"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="اكتب رسالتك هنا..."
                            className="h-36 w-full resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 md:h-auto md:min-h-[200px]"
                            autoFocus
                        ></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:flex md:justify-end md:px-6 md:py-4 md:pb-4">
                        <button type="button" onClick={onClose} className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-gray-100 px-5 py-3 font-semibold text-text-secondary transition-colors hover:bg-gray-200">إلغاء</button>
                        <button onClick={handleSend} disabled={!message.trim()} className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-400">إرسال</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FilterSortPopover: React.FC<{
    onClose: () => void;
    sortBy: string;
    setSortBy: (value: string) => void;
    performanceFilter: string;
    setPerformanceFilter: (value: string) => void;
    onReset: () => void;
}> = ({ onClose, sortBy, setSortBy, performanceFilter, setPerformanceFilter, onReset }) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={popoverRef} className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-2xl md:absolute md:inset-x-auto md:bottom-auto md:end-0 md:top-full md:mt-2 md:w-72 md:rounded-2xl">
            <div className="border-b border-gray-100 px-4 py-4">
                <h4 className="font-bold text-gray-800">الفرز والتصفية</h4>
            </div>
            <div className="max-h-[min(60vh,28rem)] space-y-4 overflow-y-auto px-4 py-4">
                <fieldset>
                    <legend className="text-sm font-semibold text-gray-600 mb-2">ترتيب حسب</legend>
                    <div className="space-y-2">
                        {(['name-asc', 'age-asc', 'performance-desc'] as const).map(option => (
                            <label key={option} className="flex min-h-[44px] items-center gap-3 rounded-xl border border-transparent px-2 transition-colors hover:border-gray-100 hover:bg-gray-50 cursor-pointer">
                                <input type="radio" name="sort" value={option} checked={sortBy === option} onChange={e => setSortBy(e.target.value)} className="w-4 h-4 text-primary focus:ring-primary focus:ring-offset-0"/>
                                <span className="text-sm">{ { 'name-asc': 'الاسم', 'age-asc': 'العمر (الأصغر)', 'performance-desc': 'الأداء (الأفضل)' }[option] }</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                <fieldset>
                    <legend className="text-sm font-semibold text-gray-600 mb-2">تصفية حسب المستوى</legend>
                     <div className="space-y-2">
                        {(['all', 'ممتاز', 'جيد جداً', 'جيد'] as const).map(option => (
                            <label key={option} className="flex min-h-[44px] items-center gap-3 rounded-xl border border-transparent px-2 transition-colors hover:border-gray-100 hover:bg-gray-50 cursor-pointer">
                                <input type="radio" name="filter" value={option} checked={performanceFilter === option} onChange={e => setPerformanceFilter(e.target.value)} className="w-4 h-4 text-primary focus:ring-primary focus:ring-offset-0"/>
                                <span className="text-sm">{ option === 'all' ? 'كل المستويات' : option }</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
            </div>
            <div className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-3">
                <button onClick={onReset} className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold text-gray-600 transition-colors hover:text-primary">إعادة تعيين</button>
                <button onClick={onClose} className="inline-flex min-h-[44px] items-center rounded-xl bg-primary-light px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary-hover hover:text-white">تم</button>
            </div>
        </div>
    );
};

const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="rounded-[1.75rem] border border-dashed border-gray-300 bg-white px-6 py-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
    </div>
);

const ResponsivePagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPrevious: () => void;
    onNext: () => void;
}> = ({ currentPage, totalPages, onPrevious, onNext }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm sm:flex-row">
            <button
                onClick={onPrevious}
                disabled={currentPage === 1}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="الصفحة السابقة"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <span className="text-sm font-medium text-gray-600">
                صفحة <span className="font-bold text-gray-900">{currentPage}</span> من <span className="font-bold text-gray-900">{totalPages}</span>
            </span>
            <button
                onClick={onNext}
                disabled={currentPage === totalPages}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="الصفحة التالية"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
        </div>
    );
};

const MobileSelectControl: React.FC<{
    title: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
}> = ({ title, checked, onChange, className = '' }) => (
    <span
        role="checkbox"
        tabIndex={0}
        onClick={(event) => {
            event.stopPropagation();
            onChange(!checked);
        }}
        onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                onChange(!checked);
            }
        }}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm transition-colors ${
            checked ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 text-gray-500'
        } ${className}`}
        aria-label={`تحديد ${title}`}
        aria-checked={checked}
    >
        {checked ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6-11 11-5-5"/></svg>
        ) : (
            <span className="h-4 w-4 rounded border border-current" />
        )}
    </span>
);

const MobileOrphanListRow: React.FC<{
    orphan: Orphan;
    displayName: string;
    selected: boolean;
    onSelect: () => void;
    onOpen: () => void;
}> = ({ orphan, displayName, selected, onSelect, onOpen }) => (
    <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpen();
            }
        }}
        className={`flex min-h-[86px] items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 shadow-sm transition-colors ${
            selected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100 active:bg-gray-50'
        }`}
    >
        <MobileSelectControl title={displayName} checked={selected} onChange={onSelect} />
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-primary-light">
            <Avatar src={orphan.photoUrl} name={orphan.name} size="md" className="!h-full !w-full !text-sm" />
        </div>
        <div className="min-w-0 flex-1">
            <div className="line-clamp-1 break-words text-sm font-bold leading-5 text-gray-900">{displayName}</div>
            <div className="mt-0.5 truncate text-xs text-gray-500">
                {orphan.age} سنوات{orphan.gender ? ` • ${orphan.gender}` : ''}{orphan.grade ? ` • ${orphan.grade}` : ''}
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-gray-500">
                <span className="truncate">{[orphan.country, orphan.governorate].filter(Boolean).join('، ') || 'غير محدد'}</span>
                {orphan.performance ? (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-600">{orphan.performance}</span>
                ) : null}
            </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </div>
);

const MobileOrphanGridTile: React.FC<{
    orphan: Orphan;
    displayName: string;
    selected: boolean;
    onSelect: () => void;
    onOpen: () => void;
}> = ({ orphan, displayName, selected, onSelect, onOpen }) => (
    <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpen();
            }
        }}
        className={`relative min-h-[158px] rounded-2xl border bg-white p-3 shadow-sm transition-colors ${
            selected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100 active:bg-gray-50'
        }`}
    >
        <MobileSelectControl title={displayName} checked={selected} onChange={onSelect} className="absolute end-2 top-2" />
        <div className="flex flex-col items-center text-center">
            <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-primary-light">
                <Avatar src={orphan.photoUrl} name={orphan.name} size="md" className="!h-full !w-full !text-sm" />
            </div>
            <h3 className="mt-2 line-clamp-2 min-h-[40px] break-words text-sm font-bold leading-5 text-gray-900">{displayName}</h3>
            <p className="mt-0.5 text-xs text-gray-500">{orphan.age} سنوات</p>
            <div className="mt-2 flex max-w-full items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-[11px] text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="truncate">{orphan.country || 'غير محدد'}</span>
            </div>
        </div>
    </div>
);


const ITEMS_PER_PAGE = 12;

interface OrphansListProps {
    isSidebarCollapsed?: boolean;
}

const OrphansList: React.FC<OrphansListProps> = ({ isSidebarCollapsed = false }) => {
    const { isOnline } = useNetworkStatus();
    const { userProfile } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const navigate = useNavigate();
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const actionsMenuRef = useRef<HTMLDivElement>(null);
    const [sortBy, setSortBy] = useState('name-asc');
    const [performanceFilter, setPerformanceFilter] = useState('all');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const displayNameParts = isSidebarCollapsed ? 3 : 2;

    const { orphans: orphanList, totalCount, loading, refetch } = useOrphansPaginated({
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
        search: searchQuery,
        performanceFilter,
        sortBy,
    });

    // Column definitions for DataTable (list view)
    const tableColumns = useMemo<ColumnDef<Orphan>[]>(() => [
        {
            accessorKey: 'name',
            header: 'اليتيم',
            cell: ({ row }) => {
                const displayName = formatListDisplayName(row.original.name, displayNameParts);

                return (
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 shadow-sm">
                            <Avatar src={row.original.photoUrl} name={row.original.name} size="md" className="!h-full !w-full !text-sm" />
                        </div>
                        <div className="min-w-0">
                            <div className="line-clamp-2 break-words font-bold leading-snug text-gray-900">{displayName}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{row.original.age} سنوات</div>
                        </div>
                    </div>
                );
            },
            size: 220,
        },
        {
            id: 'select',
            header: ({ table }) => (
                <div className="px-1">
                    <input
                        type="checkbox"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={table.getToggleAllPageRowsSelectedHandler()}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="px-1">
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        onChange={row.getToggleSelectedHandler()}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
            size: 40,
        },
        {
            accessorKey: 'country',
            header: 'الموقع',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>{row.original.country}، {row.original.governorate}</span>
                </div>
            ),
        },
        {
            accessorKey: 'grade',
            header: 'المرحلة الدراسية',
            cell: ({ getValue }) => <span className="text-gray-700">{getValue() as string}</span>,
        },
        {
            accessorKey: 'performance',
            header: 'الأداء',
            cell: ({ row }) => {
                const p = row.original.performance;
                const color = p === 'ممتاز'
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : p === 'جيد جداً'
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-yellow-100 text-yellow-700 border-yellow-200';
                return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}>{p}</span>;
            },
        },
        {
            accessorKey: 'attendance',
            header: 'الحضور',
            cell: ({ getValue }) => <span className="text-gray-600">{getValue() as string}</span>,
        },
    ], [displayNameParts]);

    const renderBulkActions = (_selectedRows: Orphan[]) => {
        return (
            <button
                onClick={() => setIsMessageModalOpen(true)}
                className="text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-2 shadow-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                مراسلة المحدد
            </button>
        );
    };


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
                setIsActionsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy, performanceFilter]);

    useEffect(() => {
        setSelectedIds(new Set());
    }, [viewMode]);

    useEffect(() => {
        setSelectedIds((previous) => {
            if (previous.size === 0) return previous;
            const visibleIds = new Set(orphanList.map((orphan) => orphan.id));
            const next = new Set(Array.from(previous).filter((id) => visibleIds.has(id)));
            return next.size === previous.size ? previous : next;
        });
    }, [orphanList]);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;
    const paginatedOrphans = orphanList;
    const activeFiltersCount = Number(sortBy !== 'name-asc') + Number(performanceFilter !== 'all');


    const handleSelect = (id: number) => {
        const newSelectedIds = new Set(selectedIds);
        if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
        } else {
            newSelectedIds.add(id);
        }
        setSelectedIds(newSelectedIds);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(orphanList.map(o => o.id)));
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const handleSendMessage = (_message: string) => {
        alert('الإرسال المباشر للأيتام غير متاح من هذه الشاشة حالياً. يمكنك استخدام قنوات المتابعة المعتمدة لإرسال هذه الرسالة.');
        setIsMessageModalOpen(false);
        setSelectedIds(new Set());
    };

    const createOrphanMutation = useMutation({
        mutationFn: async (data: { name: string; age: number; grade: string; country: string }) => {
            if (!userProfile) {
                throw new Error('User not authenticated');
            }

            // Derive approximate date of birth from age input
            const birthDate = new Date();
            birthDate.setFullYear(birthDate.getFullYear() - data.age);

            return createOrphan({
                organizationId: userProfile.organization_id,
                name: data.name,
                dateOfBirth: birthDate,
                gender: 'ذكر', // Default; could be extended in modal later
                grade: data.grade,
                country: data.country,
            });
        },
        onSuccess: () => {
            // Reload current page so the newly created orphan appears in the list
            refetch();
        },
    });

    const handleSaveNewOrphan = (data: { name: string; age: number; grade: string; country: string }) => {
        if (!isOnline) {
            alert('لا يمكن إضافة يتيم أثناء انقطاع الإنترنت. يرجى الاتصال ثم إعادة المحاولة.');
            return;
        }
        createOrphanMutation.mutate(data);
        setIsAddModalOpen(false);
    };

    const handleExportExcel = () => {
        const headers = ['id', 'name', 'age', 'grade', 'country', 'performance'];
        const csvRows = [
            headers.join(','),
            ...orphanList.map(o => [o.id, `"${o.name}"`, o.age, `"${o.grade}"`, `"${o.country}"`, `"${o.performance}"`].join(','))
        ];
        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', 'fay-orphans.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleResetFilters = () => {
        setSortBy('name-asc');
        setPerformanceFilter('all');
        setIsPopoverOpen(false);
    };

    return (
        <>
        <div className={`space-y-4 sm:space-y-6 ${selectedIds.size > 0 ? 'pb-40' : 'pb-24'}`}>
            {!isOnline ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    لا يمكن تنفيذ عمليات الإضافة أثناء عدم الاتصال بالإنترنت.
                </div>
            ) : null}
            <header className="space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between gap-3 sm:items-center">
                    <div className="min-w-0">
                        <h1 className="text-[1.65rem] font-bold leading-tight text-gray-800 sm:text-3xl">سجل الأيتام المركزي</h1>
                        <p className="mt-0.5 text-sm text-text-secondary sm:mt-1">
                            عرض وإدارة بيانات الأيتام بتنسيق متقدم
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <div ref={actionsMenuRef} className="relative sm:hidden">
                            <button
                                type="button"
                                onClick={() => setIsActionsMenuOpen((prev) => !prev)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-primary"
                                aria-label="إجراءات الصفحة"
                                aria-expanded={isActionsMenuOpen}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                            </button>
                            {isActionsMenuOpen && (
                                <div className="absolute end-0 top-full z-20 mt-2 w-44 rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAddModalOpen(true);
                                            setIsActionsMenuOpen(false);
                                        }}
                                        disabled={!isOnline}
                                        className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-primary-light hover:text-primary"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                        إضافة يتيم
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleExportExcel();
                                            setIsActionsMenuOpen(false);
                                        }}
                                        className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-primary-light hover:text-primary"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                        تصدير
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="hidden items-center gap-2 sm:flex">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            disabled={!isOnline}
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-hover"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                            إضافة يتيم
                        </button>
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            تصدير
                        </button>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm sm:p-4">
                    <div className="relative w-full">
                        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="ابحث باسم اليتيم أو الموقع..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="min-h-[46px] w-full rounded-xl border border-gray-200 bg-gray-50 pe-10 ps-4 text-sm outline-none transition-colors focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary sm:min-h-[48px]"
                        />
                    </div>
                    <div className="mt-2 flex items-center gap-2 sm:hidden">
                        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                                aria-label="عرض قائمة"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                                aria-label="عرض شبكي"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                            </button>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsPopoverOpen(prev => !prev)}
                                className={`relative inline-flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${isPopoverOpen || activeFiltersCount > 0 ? 'border-primary/30 bg-primary-light text-primary' : 'border-gray-200 text-gray-600'}`}
                                aria-label="الفرز والتصفية"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -end-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                            {isPopoverOpen && (
                                <>
                                    <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setIsPopoverOpen(false)} />
                                    <FilterSortPopover
                                        onClose={() => setIsPopoverOpen(false)}
                                        sortBy={sortBy}
                                        setSortBy={setSortBy}
                                        performanceFilter={performanceFilter}
                                        setPerformanceFilter={setPerformanceFilter}
                                        onReset={handleResetFilters}
                                    />
                                </>
                            )}
                        </div>
                        <label htmlFor="mobileSelectAllCheckbox" className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700">
                            <input
                                type="checkbox"
                                id="mobileSelectAllCheckbox"
                                checked={orphanList.length > 0 && selectedIds.size === orphanList.length}
                                onChange={handleSelectAll}
                                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary"
                                disabled={orphanList.length === 0}
                                aria-label="تحديد الكل"
                            />
                            <span>الكل</span>
                        </label>
                        <span className="ms-auto inline-flex h-11 min-w-11 items-center justify-center rounded-xl bg-gray-100 px-2 text-xs font-semibold text-text-secondary">
                            {totalCount}
                        </span>
                    </div>
                </div>
            </header>
            
            <div>
                <div className="mb-4 hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:block sm:p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
                                    aria-label="عرض قائمة"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
                                    aria-label="عرض شبكي"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                                </button>
                            </div>
                            <div className="relative">
                                <button 
                                    onClick={() => setIsPopoverOpen(prev => !prev)}
                                    className={`relative inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${isPopoverOpen || activeFiltersCount > 0 ? 'border-primary/30 bg-primary-light text-primary' : 'border-gray-200 text-gray-600 hover:border-primary/30 hover:text-primary'}`}
                                    aria-label="الفرز والتصفية"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                                    <span className="hidden sm:inline">الفرز والتصفية</span>
                                    {activeFiltersCount > 0 && (
                                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </button>
                                {isPopoverOpen && (
                                    <>
                                        <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setIsPopoverOpen(false)} />
                                        <FilterSortPopover 
                                            onClose={() => setIsPopoverOpen(false)}
                                            sortBy={sortBy}
                                            setSortBy={setSortBy}
                                            performanceFilter={performanceFilter}
                                            setPerformanceFilter={setPerformanceFilter}
                                            onReset={handleResetFilters}
                                        />
                                    </>
                                )}
                            </div>
                            <label htmlFor="selectAllCheckbox" className={`inline-flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:border-primary/30 hover:bg-primary-light/40 ${viewMode === 'list' ? 'md:hidden' : ''}`}>
                                <input 
                                    type="checkbox" 
                                    id="selectAllCheckbox"
                                    checked={orphanList.length > 0 && selectedIds.size === orphanList.length}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    disabled={orphanList.length === 0}
                                    aria-label="تحديد الكل"
                                />
                                <span className="select-none whitespace-nowrap">
                                    تحديد الكل
                                </span>
                            </label>
                        </div>
                        <span className="inline-flex min-h-[40px] items-center rounded-xl bg-gray-100 px-3 text-sm text-text-secondary">
                            تم العثور على {totalCount} يتيم
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-[1.75rem] border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                        <p className="text-sm font-medium text-gray-600">جاري تحميل بيانات الأيتام...</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="space-y-4">
                        <section className="space-y-3 md:hidden">
                            {paginatedOrphans.length > 0 ? (
                                paginatedOrphans.map(orphan => {
                                    const isSelected = selectedIds.has(orphan.id);
                                    const displayName = formatListDisplayName(orphan.name, displayNameParts);

                                    return (
                                        <MobileOrphanListRow
                                            key={orphan.id}
                                            orphan={orphan}
                                            displayName={displayName}
                                            selected={isSelected}
                                            onSelect={() => handleSelect(orphan.id)}
                                            onOpen={() => navigate(`/orphan/${orphan.id}`)}
                                        />
                                    );
                                })
                            ) : (
                                <EmptyState title="لا توجد نتائج مطابقة" description="جرّب تعديل البحث أو إعادة تعيين التصفية لعرض مزيد من الأيتام." />
                            )}
                        </section>
                        <div className="hidden md:block">
                            <DataTable
                                columns={tableColumns}
                                data={orphanList}
                                onRowClick={(row) => navigate(`/orphan/${row.id}`)}
                                renderBulkActions={renderBulkActions}
                                storageKey="orphans_table"
                                filterPlaceholder="ابحث باسم اليتيم..."
                                disablePagination
                            />
                        </div>
                        <ResponsivePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPrevious={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            onNext={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        />
                    </div>
                ) : (
                    <>
                        {paginatedOrphans.length > 0 ? (
                            <>
                                <section className="grid grid-cols-2 gap-3 md:hidden">
                                    {paginatedOrphans.map(orphan => {
                                        const isSelected = selectedIds.has(orphan.id);
                                        const displayName = formatListDisplayName(orphan.name, displayNameParts);
                                        return (
                                            <MobileOrphanGridTile
                                                key={orphan.id}
                                                orphan={orphan}
                                                displayName={displayName}
                                                selected={isSelected}
                                                onSelect={() => handleSelect(orphan.id)}
                                                onOpen={() => navigate(`/orphan/${orphan.id}`)}
                                            />
                                        );
                                    })}
                                </section>
                                <section className="hidden grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid lg:grid-cols-3 xl:grid-cols-4">
                                    {paginatedOrphans.map(orphan => {
                                        const isSelected = selectedIds.has(orphan.id);
                                        const displayName = formatListDisplayName(orphan.name, displayNameParts);
                                        const cardFields: EntityCardField[] = [
                                            { label: 'المرحلة:', value: orphan.grade || 'غير محدد' },
                                            { label: 'الأداء:', value: orphan.performance || 'غير متوفر', type: orphan.performance ? 'pill' : 'text' },
                                        ];
                                        return (
                                            <EntityCard
                                                key={orphan.id}
                                                variant="card"
                                                title={displayName}
                                                subtitle={`${orphan.age} سنوات${orphan.gender ? ` • ${orphan.gender}` : ''}`}
                                                imageUrl={orphan.photoUrl}
                                                imageAlt={orphan.name}
                                                fields={cardFields}
                                                location={[orphan.country, orphan.governorate].filter(Boolean).join('، ')}
                                                actionLabel="عرض الملف الكامل"
                                                onClick={() => navigate(`/orphan/${orphan.id}`)}
                                                selected={isSelected}
                                                onSelect={() => handleSelect(orphan.id)}
                                                showCheckbox={true}
                                            />
                                        );
                                    })}
                                </section>
                            </>
                        ) : (
                            <EmptyState title="لا توجد نتائج مطابقة" description="جرّب تعديل البحث أو إعادة تعيين التصفية لعرض مزيد من الأيتام." />
                        )}

                        <ResponsivePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPrevious={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            onNext={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        />
                    </>
                )}
            </div>
        </div>
        
        {selectedIds.size > 0 && (
            <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] border-t bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40 md:bottom-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex min-h-[72px] flex-col justify-center gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-primary">{selectedIds.size} تم تحديده</span>
                            <button onClick={() => setSelectedIds(new Set())} className="text-sm font-semibold text-text-secondary transition-colors hover:text-red-600">
                                إلغاء التحديد
                            </button>
                        </div>
                        <button onClick={() => setIsMessageModalOpen(true)} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <span>إرسال رسالة</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        <AddOrphanModal 
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleSaveNewOrphan}
        />
        <SendMessageModal
            isOpen={isMessageModalOpen}
            onClose={() => setIsMessageModalOpen(false)}
            onSend={handleSendMessage}
            title={`إرسال رسالة إلى ${selectedIds.size} من الأيتام`}
        />
        </>
    );
};
export default OrphansList;
