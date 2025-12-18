import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrphans } from '../hooks/useOrphans';
import { Orphan } from '../types';
import Avatar from './Avatar';

const AddOrphanModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; age: number; grade: string; country: string }) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [grade, setGrade] = useState('');
    const [country, setCountry] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && age && grade && country) {
            onSave({ name, age: parseInt(age), grade, country });
            setName(''); setAge(''); setGrade(''); setCountry('');
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">إضافة يتيم جديد</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" required />
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="العمر" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" required />
                    <input type="text" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="المرحلة الدراسية" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" required />
                    <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="الدولة" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" required />
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 font-semibold">إلغاء</button>
                        <button type="submit" className="py-2 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold">إضافة</button>
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
        <div ref={popoverRef} className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-2xl z-20 border border-gray-200">
            <div className="p-4 border-b">
                <h4 className="font-bold text-gray-800">الفرز والتصفية</h4>
            </div>
            <div className="p-4 space-y-4">
                <fieldset>
                    <legend className="text-sm font-semibold text-gray-600 mb-2">ترتيب حسب</legend>
                    <div className="space-y-2">
                        {(['name-asc', 'age-asc', 'performance-desc'] as const).map(option => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer">
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
                            <label key={option} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="filter" value={option} checked={performanceFilter === option} onChange={e => setPerformanceFilter(e.target.value)} className="w-4 h-4 text-primary focus:ring-primary focus:ring-offset-0"/>
                                <span className="text-sm">{ option === 'all' ? 'كل المستويات' : option }</span>
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


const OrphansList: React.FC = () => {
    const { orphans: orphansData, loading } = useOrphans();
    const [orphanList, setOrphanList] = useState<Orphan[]>([]);
    
    useEffect(() => {
        if (orphansData) {
            setOrphanList(orphansData);
        }
    }, [orphansData]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const navigate = useNavigate();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [sortBy, setSortBy] = useState('name-asc');
    const [performanceFilter, setPerformanceFilter] = useState('all');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);


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

    const filteredOrphans = useMemo(() => {
        let sortedAndFiltered = [...orphanList];

        // Filtering
        if (performanceFilter !== 'all') {
            sortedAndFiltered = sortedAndFiltered.filter(o => o.performance === performanceFilter);
        }
        
        if (searchQuery) {
            sortedAndFiltered = sortedAndFiltered.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Sorting
        const performanceOrder: { [key: string]: number } = { 'ممتاز': 1, 'جيد جداً': 2, 'جيد': 3, 'مقبول': 4, 'ضعيف': 5 };
        switch (sortBy) {
            case 'age-asc':
                sortedAndFiltered.sort((a, b) => a.age - b.age);
                break;
            case 'performance-desc':
                sortedAndFiltered.sort((a, b) => (performanceOrder[a.performance] || 99) - (performanceOrder[b.performance] || 99));
                break;
            case 'name-asc':
            default:
                sortedAndFiltered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
                break;
        }

        return sortedAndFiltered;
    }, [searchQuery, orphanList, sortBy, performanceFilter]);


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
            setSelectedIds(new Set(filteredOrphans.map(o => o.id)));
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const handleSendMessage = (message: string) => {
        alert(`(محاكاة) تم إرسال الرسالة:\n"${message}"\nإلى ${selectedIds.size} من الأيتام.`);
        setIsMessageModalOpen(false);
        setSelectedIds(new Set());
    };
    
    const handleSaveNewOrphan = (data: { name: string; age: number; grade: string; country: string }) => {
        const newOrphan: Orphan = {
            id: Date.now(),
            name: data.name,
            age: data.age,
            grade: data.grade,
            country: data.country,
            governorate: 'غير محدد',
            photoUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
            dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - data.age)),
            gender: 'ذكر', 
            healthStatus: 'جيدة',
            attendance: 'منتظم',
            performance: 'جيد',
            familyStatus: 'غير محدد',
            housingStatus: 'غير محدد',
            guardian: 'غير محدد',
            sponsorId: -1,
            sponsorshipType: 'غير محدد',
            teamMemberId: 0, // Team members don't have direct relationships with orphans
            familyMembers: [],
            hobbies: [],
            needsAndWishes: [],
            updateLogs: [],
            educationalProgram: { status: 'غير ملتحق', details: '' },
            psychologicalSupport: { child: { status: 'غير ملتحق', details: '' }, guardian: { status: 'غير ملتحق', details: '' } },
            payments: [],
            achievements: [],
            specialOccasions: [],
            gifts: [],
        };
        setOrphanList(prev => [newOrphan, ...prev]);
        setIsAddModalOpen(false);
    };

    const handleExportExcel = () => {
        const headers = ['id', 'name', 'age', 'grade', 'country', 'performance'];
        const csvRows = [
            headers.join(','),
            ...filteredOrphans.map(o => [o.id, `"${o.name}"`, o.age, `"${o.grade}"`, `"${o.country}"`, `"${o.performance}"`].join(','))
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
        <div className="space-y-6 pb-24">
            <header className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">قائمة الأيتام</h1>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full flex-grow">
                        <div className="absolute pointer-events-none right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="ابحث عن يتيم..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
                            ref={searchInputRef}
                        />
                    </div>
                </div>
            </header>
            
            <div>
                 <div className="flex items-center justify-between border-b pb-3 mb-3">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                           <button 
                                onClick={() => setIsPopoverOpen(prev => !prev)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-primary"
                                aria-label="الفرز والتصفية"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                            </button>
                            {isPopoverOpen && (
                                <FilterSortPopover 
                                    onClose={() => setIsPopoverOpen(false)}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                    performanceFilter={performanceFilter}
                                    setPerformanceFilter={setPerformanceFilter}
                                    onReset={handleResetFilters}
                                />
                            )}
                        </div>
                        <div className="h-6 border-l border-gray-200"></div>
                        <div className="flex items-center gap-3">
                            <input 
                                type="checkbox" 
                                id="selectAllCheckbox"
                                checked={filteredOrphans.length > 0 && selectedIds.size === filteredOrphans.length}
                                onChange={handleSelectAll}
                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                disabled={filteredOrphans.length === 0}
                                aria-label="تحديد الكل"
                            />
                            <label htmlFor="selectAllCheckbox" className="text-sm font-medium text-gray-700 select-none cursor-pointer whitespace-nowrap">
                                تحديد الكل
                            </label>
                        </div>
                    </div>
                    <span className="text-sm text-text-secondary">
                        الإجمالي: {filteredOrphans.length}
                    </span>
                </div>
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredOrphans.map(orphan => {
                        const isSelected = selectedIds.has(orphan.id);
                        return (
                            <div key={orphan.id} className={`relative bg-white rounded-lg border p-4 flex flex-col items-center text-center transition-all duration-200 cursor-pointer ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md hover:border-gray-300'}`} onClick={() => navigate(`/orphan/${orphan.id}`)}>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelect(orphan.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute top-3 right-3 h-5 w-5 rounded border-gray-300 text-primary focus:ring-0 cursor-pointer"
                                    aria-label={`تحديد ${orphan.name}`}
                                />
                                <div className="absolute top-3 left-3">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(orphan.id === activeMenuId ? null : orphan.id); }} className="p-2 text-text-secondary hover:bg-gray-200 rounded-full" aria-label={`خيارات لـ ${orphan.name}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                    </button>
                                    {activeMenuId === orphan.id && (
                                        <div ref={menuRef} className="absolute top-full left-0 mt-2 w-32 bg-white rounded-lg shadow-xl z-10 border">
                                            <Link to={`/orphan/${orphan.id}`} onClick={(e) => e.stopPropagation()} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">عرض الملف</Link>
                                            <button onClick={(e) => e.stopPropagation()} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">تعديل</button>
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <Avatar src={orphan.photoUrl} name={orphan.name} size="xl" className="mb-3 border-4 border-gray-100 !w-28 !h-28 !text-3xl" />
                                     <div className="absolute bottom-4 -right-1">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${orphan.performance === 'ممتاز' ? 'bg-green-500' : orphan.performance === 'جيد جداً' ? 'bg-blue-500' : 'bg-yellow-500'}`}>{orphan.performance}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800">{orphan.name}</h3>
                                <p className="text-sm text-text-secondary">{orphan.age} سنوات - {orphan.country}</p>
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
                <button onClick={() => setIsAddModalOpen(true)} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    <span className="text-xs">إضافة</span>
                </button>
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
// FIX: Add default export
export default OrphansList;
