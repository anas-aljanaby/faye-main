import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSponsors } from '../hooks/useSponsors';
import { useOrphans } from '../hooks/useOrphans';
import { useAuth } from '../contexts/AuthContext';
import { Sponsor } from '../types';
import { supabase } from '../lib/supabase';

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
    const { sponsors: sponsorsData, loading, refetch: refetchSponsors } = useSponsors();
    const { orphans: orphansData, refetch: refetchOrphans } = useOrphans();
    const { userProfile, canEditSponsors, canEditOrphans, isManager } = useAuth();
    const hasEditPermission = userProfile?.role === 'team_member' && canEditSponsors();
    const canAssignOrphansToSponsors = useMemo(() => {
        return (isManager() || (canEditOrphans() && canEditSponsors()));
    }, [isManager, canEditOrphans, canEditSponsors]);
    const [sponsorList, setSponsorList] = useState<Sponsor[]>([]);
    
    useEffect(() => {
        if (sponsorsData) {
            setSponsorList(sponsorsData);
        }
    }, [sponsorsData]);
    const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [showAssignOrphansModal, setShowAssignOrphansModal] = useState(false);
    const [selectedSponsorForAssignment, setSelectedSponsorForAssignment] = useState<Sponsor | null>(null);
    const [sponsorAssignedOrphanIds, setSponsorAssignedOrphanIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [sortBy, setSortBy] = useState('name-asc');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
                    <h1 className="text-3xl font-bold text-gray-800">قائمة الكفلاء</h1>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full flex-grow">
                        <div className="absolute pointer-events-none right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="ابحث عن كافل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
                            ref={searchInputRef}
                        />
                    </div>
                </div>
            </header>
            
            <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 mb-3">
                    <div className="flex items-center gap-4 flex-wrap">
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
                        <div className="h-6 border-l border-gray-200"></div>
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
                            <>
                                <div className="h-6 border-l border-gray-200"></div>
                                <button
                                    onClick={() => setShowAssignOrphansModal(true)}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold text-sm flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                    <span>تعيين أيتام لكافل</span>
                                </button>
                            </>
                        )}
                    </div>
                    <span className="text-sm text-text-secondary">
                        الإجمالي: {filteredSponsors.length}
                    </span>
                </div>
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredSponsors.map(sponsor => {
                        const isSelected = selectedIds.has(sponsor.id);
                        return (
                            <div key={sponsor.id} className={`relative bg-white rounded-lg border p-4 flex items-center gap-4 transition-all duration-200 cursor-pointer ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md hover:border-gray-300'}`} onClick={() => navigate(`/sponsor/${sponsor.id}`)}>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelect(sponsor.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-0 cursor-pointer flex-shrink-0"
                                    aria-label={`تحديد ${sponsor.name}`}
                                />
                                {sponsor.avatarUrl ? (
                                  <img src={sponsor.avatarUrl} alt={sponsor.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-primary-text font-bold text-2xl flex-shrink-0">
                                    {sponsor.name.charAt(0)}
                                  </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-800">{sponsor.name}</h3>
                                    <p className="text-sm text-text-secondary">يكفل {sponsor.sponsoredOrphanIds.length} {sponsor.sponsoredOrphanIds.length === 1 ? 'يتيم' : 'أيتام'}</p>
                                </div>
                                <div className="relative">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(sponsor.id === activeMenuId ? null : sponsor.id); }} className="p-2 text-text-secondary hover:bg-gray-200 rounded-full" aria-label={`خيارات لـ ${sponsor.name}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                    </button>
                                    {activeMenuId === sponsor.id && (
                                        <div ref={menuRef} className="absolute top-full left-0 mt-2 w-32 bg-white rounded-lg shadow-xl z-10 border">
                                            <Link to={`/sponsor/${sponsor.id}`} onClick={(e) => e.stopPropagation()} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">عرض الملف</Link>
                                            {hasEditPermission && (
                                                <button onClick={(e) => { e.stopPropagation(); setEditingSponsor(sponsor); setActiveMenuId(null); }} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">تعديل</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </section>
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
                                            {sponsor.avatarUrl ? (
                                                <img src={sponsor.avatarUrl} alt={sponsor.name} className="w-10 h-10 rounded-full" />
                                            ) : (
                                                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold">
                                                    {sponsor.name.charAt(0)}
                                                </div>
                                            )}
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
                                                <img src={orphan.photoUrl} alt={orphan.name} className="w-10 h-10 rounded-full" />
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