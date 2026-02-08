import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSponsorsBasic } from '../hooks/useSponsors';
import { useOrphansBasic } from '../hooks/useOrphans';
import { useAuth } from '../contexts/AuthContext';
import { Sponsor } from '../types';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import EntityCard, { EntityCardField } from './EntityCard';
import { DataTable } from './DataTable';
import { ColumnDef } from '@tanstack/react-table';

const AddSponsorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
            setName('');
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">إضافة كافل جديد</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">اسم الكافل</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required autoFocus/>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 transition-colors font-semibold">إلغاء</button>
                        <button type="submit" className="py-2 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold">إضافة</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditSponsorModal: React.FC<{
    sponsor: Sponsor;
    onClose: () => void;
    onSave: (updatedSponsor: Sponsor) => void;
}> = ({ sponsor, onClose, onSave }) => {
    const [name, setName] = useState(sponsor.name);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...sponsor, name });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">تعديل بيانات الكافل</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">اسم الكافل</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 transition-colors font-semibold">إلغاء</button>
                        <button type="submit" className="py-2 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold">حفظ التغييرات</button>
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

    if (!isOpen) return null;

    const handleSend = () => {
        if (message.trim()) {
            onSend(message.trim());
            setMessage('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="w-full h-32 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary resize-y"
                    autoFocus
                ></textarea>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 font-semibold">إلغاء</button>
                    <button onClick={handleSend} disabled={!message.trim()} className="py-2 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">إرسال</button>
                </div>
            </div>
        </div>
    );
};

const SortPopover: React.FC<{
    onClose: () => void;
    sortBy: string;
    setSortBy: (value: string) => void;
    onReset: () => void;
}> = ({ onClose, sortBy, setSortBy, onReset }) => {
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
        <div ref={popoverRef} className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-2xl z-20 border border-gray-200">
            <div className="p-4 border-b">
                <h4 className="font-bold text-gray-800">الفرز</h4>
            </div>
            <div className="p-4 space-y-4">
                <fieldset>
                    <legend className="text-sm font-semibold text-gray-600 mb-2">ترتيب حسب</legend>
                    <div className="space-y-2">
                        {(['name-asc', 'orphans-desc'] as const).map(option => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="sort" value={option} checked={sortBy === option} onChange={e => setSortBy(e.target.value)} className="w-4 h-4 text-primary focus:ring-primary focus:ring-offset-0"/>
                                <span className="text-sm">{ { 'name-asc': 'الاسم', 'orphans-desc': 'عدد الأيتام (الأكثر)' }[option] }</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
            </div>
            <div className="p-2 bg-gray-50 flex justify-between rounded-b-lg">
                <button onClick={onReset} className="text-sm font-semibold text-gray-600 hover:text-primary px-3 py-1 rounded-md">إعادة تعيين</button>
                <button onClick={onClose} className="text-sm font-semibold bg-primary-light text-primary px-4 py-1 rounded-md hover:bg-primary-hover hover:text-white transition-colors">تم</button>
            </div>
        </div>
    );
};


const SponsorsList: React.FC = () => {
    const { sponsors: sponsorsData, loading, refetch: refetchSponsors } = useSponsorsBasic();
    const { orphans: orphansData, refetch: refetchOrphans } = useOrphansBasic();
    const { userProfile, canEditSponsors, canEditOrphans, isManager } = useAuth();
    const hasEditPermission = userProfile?.role === 'team_member' && canEditSponsors();
    const canAssignOrphansToSponsors = useMemo(() => {
        return (isManager() || (canEditOrphans() && canEditSponsors()));
    }, [isManager, canEditOrphans, canEditSponsors]);
    const [sponsorList, setSponsorList] = useState<Sponsor[]>([]);
    
    useEffect(() => {
        if (!loading && sponsorsData) {
            setSponsorList(sponsorsData);
        }
    }, [sponsorsData, loading]);
    const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [showAssignOrphansModal, setShowAssignOrphansModal] = useState(false);
    const [selectedSponsorForAssignment, setSelectedSponsorForAssignment] = useState<Sponsor | null>(null);
    const [sponsorAssignedOrphanIds, setSponsorAssignedOrphanIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const navigate = useNavigate();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [sortBy, setSortBy] = useState('name-asc');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    // Column definitions for DataTable (list view)
    const tableColumns = useMemo<ColumnDef<Sponsor>[]>(() => [
        {
            id: 'select',
            header: ({ table }) => (
                <div className="px-1">
                    <input
                        type="checkbox"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={table.getToggleAllPageRowsSelectedHandler()}
                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
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
                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
            size: 40,
        },
        {
            accessorKey: 'name',
            header: 'الكافل',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
                        <Avatar src={row.original.avatarUrl} name={row.original.name} size="md" className="!w-full !h-full !text-sm" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-900">{row.original.name}</div>
                    </div>
                </div>
            ),
            size: 200,
        },
        {
            accessorKey: 'sponsoredOrphanIds',
            header: 'عدد الأيتام',
            cell: ({ row }) => (
                <span className="text-gray-600">{row.original.sponsoredOrphanIds.length} {row.original.sponsoredOrphanIds.length === 1 ? 'يتيم' : 'أيتام'}</span>
            ),
            sortingFn: (rowA, rowB) => rowA.original.sponsoredOrphanIds.length - rowB.original.sponsoredOrphanIds.length,
        },
    ], []);

    const renderBulkActions = (selectedRows: Sponsor[]) => {
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

    // Fetch assigned orphans for selected sponsor (when modal is open)
    useEffect(() => {
        const fetchSponsorAssignedOrphans = async () => {
            if (!selectedSponsorForAssignment?.uuid) {
                setSponsorAssignedOrphanIds([]);
                return;
            }

            try {
                const { data } = await supabase
                    .from('sponsor_orphans')
                    .select('orphan_id')
                    .eq('sponsor_id', selectedSponsorForAssignment.uuid);

                if (data) {
                    setSponsorAssignedOrphanIds(data.map(item => item.orphan_id));
                }
            } catch (err) {
                console.error('Error fetching sponsor assigned orphans:', err);
            }
        };

        if (showAssignOrphansModal) {
            fetchSponsorAssignedOrphans();
        }
    }, [selectedSponsorForAssignment, showAssignOrphansModal]);

    const filteredSponsors = useMemo(() => {
        let sortedAndFiltered = [...sponsorList];

        if (searchQuery) {
            sortedAndFiltered = sortedAndFiltered.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        switch (sortBy) {
            case 'orphans-desc':
                sortedAndFiltered.sort((a, b) => b.sponsoredOrphanIds.length - a.sponsoredOrphanIds.length);
                break;
            case 'name-asc':
            default:
                sortedAndFiltered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
                break;
        }

        return sortedAndFiltered;
    }, [searchQuery, sponsorList, sortBy]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy]);

    const totalPages = Math.ceil(filteredSponsors.length / ITEMS_PER_PAGE);
    const paginatedSponsors = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredSponsors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredSponsors, currentPage]);

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
            setSelectedIds(new Set(filteredSponsors.map(s => s.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSendMessage = (message: string) => {
        alert(`(محاكاة) تم إرسال الرسالة:\n"${message}"\nإلى ${selectedIds.size} من الكفلاء.`);
        setIsMessageModalOpen(false);
        setSelectedIds(new Set());
    };

    const handleExportExcel = () => {
        const headers = ['id', 'name', 'sponsored_orphans_count'];
        const csvRows = [
            headers.join(','),
            ...filteredSponsors.map(s => [s.id, `"${s.name}"`, s.sponsoredOrphanIds.length].join(','))
        ];
        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', 'malath-sponsors.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleSaveSponsor = (updatedSponsor: Sponsor) => {
        setSponsorList(prevList => prevList.map(s => s.id === updatedSponsor.id ? updatedSponsor : s));
        setEditingSponsor(null);
    };

    const handleSaveNewSponsor = (name: string) => {
        const newSponsor: Sponsor = {
            id: Date.now(),
            name,
            sponsoredOrphanIds: [],
        };
        setSponsorList(prev => [newSponsor, ...prev]);
        setIsAddModalOpen(false);
    };

    const handleResetSort = () => {
        setSortBy('name-asc');
        setIsPopoverOpen(false);
    };

    return (
        <>
        <div className="space-y-6 pb-24">
            <header className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">قائمة الكفلاء</h1>
                        <p className="text-sm text-text-secondary mt-0.5">
                            عرض وإدارة بيانات الكفلاء بتنسيق متقدم
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {hasEditPermission && (
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                إضافة كافل
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            تصدير
                        </button>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="relative w-full sm:w-72">
                        <div className="absolute pointer-events-none right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="ابحث باسم الكافل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white outline-none transition-colors"
                            ref={searchInputRef}
                        />
                    </div>
                </div>
            </header>
            
            <div>
                {/* Toolbar row: view toggle, sort, select all, assign, total */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-primary'}`}
                            aria-label="عرض قائمة"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-primary'}`}
                            aria-label="عرض شبكي"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                        </button>
                    </div>
                    <div className="relative">
                        <button 
                            onClick={() => setIsPopoverOpen(prev => !prev)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-primary"
                            aria-label="الفرز"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                        </button>
                        {isPopoverOpen && (
                            <SortPopover 
                                onClose={() => setIsPopoverOpen(false)}
                                sortBy={sortBy}
                                setSortBy={setSortBy}
                                onReset={handleResetSort}
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            id="selectAllCheckbox"
                            checked={filteredSponsors.length > 0 && selectedIds.size === filteredSponsors.length}
                            onChange={handleSelectAll}
                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            disabled={filteredSponsors.length === 0}
                            aria-label="تحديد الكل"
                        />
                        <label htmlFor="selectAllCheckbox" className="text-sm font-medium text-gray-700 select-none cursor-pointer whitespace-nowrap">
                            تحديد الكل
                        </label>
                    </div>
                    {canAssignOrphansToSponsors && (
                        <button
                            onClick={() => setShowAssignOrphansModal(true)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold text-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                            <span>تعيين أيتام لكافل</span>
                        </button>
                    )}
                    <span className="text-sm text-text-secondary">
                        تم العثور على {viewMode === 'grid' ? filteredSponsors.length : sponsorList.length} كافل
                    </span>
                </div>

                {viewMode === 'list' ? (
                    <DataTable
                        columns={tableColumns}
                        data={sponsorList}
                        onRowClick={(row) => navigate(`/sponsor/${row.id}`)}
                        renderBulkActions={renderBulkActions}
                        storageKey="sponsors_table"
                        filterPlaceholder="ابحث باسم الكافل..."
                    />
                ) : (
                    <>
                        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {paginatedSponsors.map(sponsor => {
                                const isSelected = selectedIds.has(sponsor.id);
                                const cardFields: EntityCardField[] = [
                                    { label: 'عدد الأيتام:', value: `${sponsor.sponsoredOrphanIds.length} ${sponsor.sponsoredOrphanIds.length === 1 ? 'يتيم' : 'أيتام'}` },
                                ];
                                return (
                                    <EntityCard
                                        key={sponsor.id}
                                        variant="card"
                                        title={sponsor.name}
                                        subtitle={`يكفل ${sponsor.sponsoredOrphanIds.length} ${sponsor.sponsoredOrphanIds.length === 1 ? 'يتيم' : 'أيتام'}`}
                                        imageUrl={sponsor.avatarUrl}
                                        imageAlt={sponsor.name}
                                        fields={cardFields}
                                        actionLabel="عرض الملف الكامل"
                                        onClick={() => navigate(`/sponsor/${sponsor.id}`)}
                                        selected={isSelected}
                                        onSelect={() => handleSelect(sponsor.id)}
                                        showCheckbox={true}
                                    />
                                );
                            })}
                        </section>

                        {/* Pagination - grid only */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                </button>
                                <span className="text-sm text-gray-600">
                                    صفحة {currentPage} من {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
        
        {selectedIds.size > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40 border-t">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-primary">{selectedIds.size} تم تحديده</span>
                            <button onClick={() => setSelectedIds(new Set())} className="text-sm font-semibold text-text-secondary hover:text-red-600">
                                إلغاء التحديد
                            </button>
                        </div>
                        <button onClick={() => setIsMessageModalOpen(true)} className="flex items-center gap-2 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <span>إرسال رسالة</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {selectedIds.size === 0 && (
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-2 flex justify-around items-center z-30">
                <button onClick={() => navigate(-1)} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    <span className="text-xs">رجوع</span>
                </button>
                <button onClick={() => searchInputRef.current?.focus()} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <span className="text-xs">بحث</span>
                </button>
                <button onClick={handleExportExcel} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    <span className="text-xs">تصدير</span>
                </button>
                {hasEditPermission && (
                    <button onClick={() => setIsAddModalOpen(true)} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        <span className="text-xs">إضافة</span>
                    </button>
                )}
            </div>
        )}

        {editingSponsor && (
            <EditSponsorModal
                sponsor={editingSponsor}
                onClose={() => setEditingSponsor(null)}
                onSave={handleSaveSponsor}
            />
        )}
        <AddSponsorModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleSaveNewSponsor}
        />
        <SendMessageModal
            isOpen={isMessageModalOpen}
            onClose={() => setIsMessageModalOpen(false)}
            onSend={handleSendMessage}
            title={`إرسال رسالة إلى ${selectedIds.size} من الكفلاء`}
        />

        {/* Assign Orphans Modal */}
        {showAssignOrphansModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => {
                setShowAssignOrphansModal(false);
                setSelectedSponsorForAssignment(null);
            }}>
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    {!selectedSponsorForAssignment ? (
                        <>
                            <div className="flex justify-between items-center mb-4 border-b pb-3">
                                <h3 className="text-xl font-bold">اختر كافل</h3>
                                <button onClick={() => {
                                    setShowAssignOrphansModal(false);
                                    setSelectedSponsorForAssignment(null);
                                }} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                            </div>
                            <div className="overflow-y-auto space-y-2 flex-1">
                                {filteredSponsors.map(sponsor => (
                                    <button
                                        key={sponsor.id}
                                        onClick={() => setSelectedSponsorForAssignment(sponsor)}
                                        className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 text-right"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar src={sponsor.avatarUrl} name={sponsor.name} size="md" />
                                            <div>
                                                <p className="font-semibold">{sponsor.name}</p>
                                                <p className="text-sm text-gray-500">يكفل {sponsor.sponsoredOrphanIds.length} {sponsor.sponsoredOrphanIds.length === 1 ? 'يتيم' : 'أيتام'}</p>
                                            </div>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m9 18 6-6-6-6"/></svg>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-4 border-b pb-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedSponsorForAssignment(null)}
                                        className="p-1 hover:bg-gray-100 rounded-lg"
                                        title="رجوع"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                    </button>
                                    <h3 className="text-xl font-bold">تعيين أيتام لـ {selectedSponsorForAssignment.name}</h3>
                                </div>
                                <button onClick={() => {
                                    setShowAssignOrphansModal(false);
                                    setSelectedSponsorForAssignment(null);
                                }} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                            </div>
                            <div className="overflow-y-auto space-y-2 flex-1">
                                {orphansData.map(orphan => {
                                    const isAssigned = orphan.uuid && sponsorAssignedOrphanIds.includes(orphan.uuid);
                                    return (
                                        <div 
                                            key={orphan.id}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar src={orphan.photoUrl} name={orphan.name} size="md" />
                                                <div>
                                                    <p className="font-semibold">{orphan.name}</p>
                                                    <p className="text-sm text-gray-500">{orphan.age} سنوات</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (!selectedSponsorForAssignment.uuid || !orphan.uuid) return;
                                                    
                                                    try {
                                                        if (isAssigned) {
                                                            // Remove assignment
                                                            const { error } = await supabase
                                                                .from('sponsor_orphans')
                                                                .delete()
                                                                .eq('sponsor_id', selectedSponsorForAssignment.uuid)
                                                                .eq('orphan_id', orphan.uuid);
                                                            
                                                            if (!error) {
                                                                setSponsorAssignedOrphanIds(prev => prev.filter(id => id !== orphan.uuid));
                                                                refetchSponsors();
                                                            }
                                                        } else {
                                                            // Add assignment
                                                            const { error } = await supabase
                                                                .from('sponsor_orphans')
                                                                .insert({
                                                                    sponsor_id: selectedSponsorForAssignment.uuid,
                                                                    orphan_id: orphan.uuid
                                                                });
                                                            
                                                            if (!error) {
                                                                setSponsorAssignedOrphanIds(prev => [...prev, orphan.uuid!]);
                                                                refetchSponsors();
                                                            }
                                                        }
                                                    } catch (err) {
                                                        console.error('Error updating orphan-to-sponsor assignment:', err);
                                                    }
                                                }}
                                                className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                                                    isAssigned 
                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                                        : 'bg-primary text-white hover:bg-primary-hover'
                                                }`}
                                            >
                                                {isAssigned ? 'إلغاء التعيين' : 'تعيين'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
        </>
    );
};

export default SponsorsList;