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
import { useAccountStatusesMap } from '../hooks/useAccountStatus';
import { AccountStatusBadge } from './account/AccountStatusBadge';
import { CreateLoginModal } from './account/CreateLoginModal';
import { useQueryClient } from '@tanstack/react-query';
import AddProfileWithLoginModal from './account/AddProfileWithLoginModal';
import { formatListDisplayName } from '../utils/displayNames';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const EditSponsorModal: React.FC<{
    sponsor: Sponsor;
    onClose: () => void;
    onSave: (updatedSponsor: Sponsor) => void;
}> = ({ sponsor, onClose, onSave }) => {
    const [name, setName] = useState(sponsor.name);
    useBodyScrollLock(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...sponsor, name });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 md:items-center md:p-4" onClick={onClose}>
            <div
                className="flex max-h-[70dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl md:h-auto md:max-h-[90vh] md:max-w-md md:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-center pt-2 md:hidden">
                    <span className="h-1 w-10 rounded-full bg-gray-300" />
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 md:px-6 md:py-4">
                    <h3 className="text-base font-bold text-gray-900 md:text-xl">تعديل بيانات الكافل</h3>
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
                    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">اسم الكافل</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:flex md:justify-end md:px-6 md:py-4 md:pb-4">
                        <button type="button" onClick={onClose} className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-gray-100 px-5 py-3 font-semibold text-text-secondary transition-colors hover:bg-gray-200">إلغاء</button>
                        <button type="submit" className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-hover">حفظ التغييرات</button>
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
                        />
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

const SortPopover: React.FC<{
    onClose: () => void;
    sortBy: string;
    setSortBy: (value: string) => void;
    filterOnlyNoAccount: boolean;
    setFilterOnlyNoAccount: (value: boolean) => void;
    isSysAdmin: boolean;
    onReset: () => void;
}> = ({ onClose, sortBy, setSortBy, filterOnlyNoAccount, setFilterOnlyNoAccount, isSysAdmin, onReset }) => {
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
                    <legend className="mb-2 text-sm font-semibold text-gray-600">ترتيب حسب</legend>
                    <div className="space-y-2">
                        {(['name-asc', 'orphans-desc'] as const).map(option => (
                            <label key={option} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-transparent px-2 transition-colors hover:border-gray-100 hover:bg-gray-50">
                                <input type="radio" name="sort" value={option} checked={sortBy === option} onChange={e => setSortBy(e.target.value)} className="h-4 w-4 text-primary focus:ring-primary focus:ring-offset-0" />
                                <span className="text-sm">{ { 'name-asc': 'الاسم', 'orphans-desc': 'عدد الأيتام (الأكثر)' }[option] }</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                {isSysAdmin && (
                    <fieldset>
                        <legend className="mb-2 text-sm font-semibold text-gray-600">الحسابات</legend>
                        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-transparent px-2 transition-colors hover:border-gray-100 hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={filterOnlyNoAccount}
                                onChange={(e) => setFilterOnlyNoAccount(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm">بدون حساب دخول فقط</span>
                        </label>
                    </fieldset>
                )}
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

type SponsorAccountStatus = 'no_login' | 'pending_first_login' | 'active' | undefined;

const getAccountStatusLabel = (status: SponsorAccountStatus, loading: boolean) => {
    if (loading) return '...';
    if (status === 'active') return 'حساب فعال';
    if (status === 'pending_first_login') return 'بانتظار الدخول';
    if (status === 'no_login') return 'بدون حساب';
    return 'غير محدد';
};

const getAccountStatusClass = (status: SponsorAccountStatus) => {
    if (status === 'active') return 'bg-emerald-100 text-emerald-800';
    if (status === 'pending_first_login') return 'bg-amber-100 text-amber-800';
    if (status === 'no_login') return 'bg-gray-100 text-gray-700';
    return 'bg-gray-50 text-gray-500';
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

const MobileSponsorListRow: React.FC<{
    sponsor: Sponsor;
    displayName: string;
    selected: boolean;
    onSelect: () => void;
    onOpen: () => void;
    accountStatus?: SponsorAccountStatus;
    accountsLoading: boolean;
    showAccountStatus: boolean;
    canQuickCreate: boolean;
    onCreateLogin: () => void;
}> = ({
    sponsor,
    displayName,
    selected,
    onSelect,
    onOpen,
    accountStatus,
    accountsLoading,
    showAccountStatus,
    canQuickCreate,
    onCreateLogin,
}) => (
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
            <Avatar src={sponsor.avatarUrl} name={sponsor.name} size="md" className="!h-full !w-full !text-sm" />
        </div>
        <div className="min-w-0 flex-1">
            <div className="line-clamp-1 break-words text-sm font-bold leading-5 text-gray-900">{displayName}</div>
            <div className="mt-0.5 truncate text-xs text-gray-500">
                يكفل {sponsor.sponsoredOrphanIds.length} {sponsor.sponsoredOrphanIds.length === 1 ? 'يتيم' : 'أيتام'}
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-2">
                {showAccountStatus ? (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getAccountStatusClass(accountStatus)}`}>
                        {getAccountStatusLabel(accountStatus, accountsLoading)}
                    </span>
                ) : null}
                {canQuickCreate ? (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onCreateLogin();
                        }}
                        className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-bold text-primary"
                    >
                        إنشاء حساب
                    </button>
                ) : null}
            </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </div>
);

const MobileSponsorGridTile: React.FC<{
    sponsor: Sponsor;
    displayName: string;
    selected: boolean;
    onSelect: () => void;
    onOpen: () => void;
    accountStatus?: SponsorAccountStatus;
    accountsLoading: boolean;
    showAccountStatus: boolean;
}> = ({ sponsor, displayName, selected, onSelect, onOpen, accountStatus, accountsLoading, showAccountStatus }) => (
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
                <Avatar src={sponsor.avatarUrl} name={sponsor.name} size="md" className="!h-full !w-full !text-sm" />
            </div>
            <h3 className="mt-2 line-clamp-2 min-h-[40px] break-words text-sm font-bold leading-5 text-gray-900">{displayName}</h3>
            <p className="mt-0.5 text-xs text-gray-500">
                {sponsor.sponsoredOrphanIds.length} {sponsor.sponsoredOrphanIds.length === 1 ? 'يتيم' : 'أيتام'}
            </p>
            {showAccountStatus ? (
                <span className={`mt-2 max-w-full truncate rounded-full px-2 py-1 text-[11px] font-semibold ${getAccountStatusClass(accountStatus)}`}>
                    {getAccountStatusLabel(accountStatus, accountsLoading)}
                </span>
            ) : null}
        </div>
    </div>
);

const ITEMS_PER_PAGE = 12;

interface SponsorsListProps {
    isSidebarCollapsed?: boolean;
}

const SponsorsList: React.FC<SponsorsListProps> = ({ isSidebarCollapsed = false }) => {
    const { sponsors: sponsorsData, loading, refetch: refetchSponsors } = useSponsorsBasic();
    const { orphans: orphansData } = useOrphansBasic();
    const { userProfile, canEditSponsors, canEditOrphans, isManager } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const isSysAdmin = userProfile?.is_system_admin === true;
    const hasEditPermission = userProfile?.role === 'team_member' && canEditSponsors();
    const canAssignOrphansToSponsors = useMemo(() => {
        return isManager() || (canEditOrphans() && canEditSponsors());
    }, [isManager, canEditOrphans, canEditSponsors]);

    const [sponsorList, setSponsorList] = useState<Sponsor[]>([]);
    const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [showAssignOrphansModal, setShowAssignOrphansModal] = useState(false);
    const [selectedSponsorForAssignment, setSelectedSponsorForAssignment] = useState<Sponsor | null>(null);
    const [sponsorAssignedOrphanIds, setSponsorAssignedOrphanIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const actionsMenuRef = useRef<HTMLDivElement>(null);
    const [sortBy, setSortBy] = useState('name-asc');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [filterOnlyNoAccount, setFilterOnlyNoAccount] = useState(false);
    const [createLoginTarget, setCreateLoginTarget] = useState<{ profileId: string; name: string } | null>(null);
    const [assignmentSponsorSearchQuery, setAssignmentSponsorSearchQuery] = useState('');
    const [assignmentOrphanSearchQuery, setAssignmentOrphanSearchQuery] = useState('');
    const displayNameParts = isSidebarCollapsed ? 3 : 2;
    useBodyScrollLock(showAssignOrphansModal);

    useEffect(() => {
        if (!loading && sponsorsData) {
            setSponsorList(sponsorsData);
        }
    }, [sponsorsData, loading]);

    const sponsorProfileIds = useMemo(
        () => sponsorList.map((s) => s.uuid).filter(Boolean) as string[],
        [sponsorList]
    );

    const { data: accountsMap = {}, isLoading: accountsLoading } = useAccountStatusesMap(
        sponsorProfileIds,
        isSysAdmin
    );

    const tableColumns = useMemo<ColumnDef<Sponsor>[]>(() => {
        const cols: ColumnDef<Sponsor>[] = [
            {
                accessorKey: 'name',
                header: 'الكافل',
                cell: ({ row }) => {
                    const displayName = formatListDisplayName(row.original.name, displayNameParts);

                    return (
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 shadow-sm">
                                <Avatar src={row.original.avatarUrl} name={row.original.name} size="md" className="!h-full !w-full !text-sm" />
                            </div>
                            <div className="min-w-0">
                                <div className="line-clamp-2 break-words font-bold leading-snug text-gray-900">{displayName}</div>
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
                accessorKey: 'sponsoredOrphanIds',
                header: 'عدد الأيتام',
                cell: ({ row }) => (
                    <span className="text-gray-600">
                        {row.original.sponsoredOrphanIds.length}{' '}
                        {row.original.sponsoredOrphanIds.length === 1 ? 'يتيم' : 'أيتام'}
                    </span>
                ),
                sortingFn: (rowA, rowB) =>
                    rowA.original.sponsoredOrphanIds.length - rowB.original.sponsoredOrphanIds.length,
            },
        ];

        if (isSysAdmin) {
            cols.push({
                id: 'platform_account',
                header: 'حساب الدخول',
                cell: ({ row }) => {
                    const uuid = row.original.uuid;
                    if (!uuid) {
                        return <span className="text-xs text-gray-400">—</span>;
                    }
                    return (
                        <AccountStatusBadge
                            status={accountsMap[uuid]?.status}
                            loading={accountsLoading}
                            className="!text-[10px]"
                        />
                    );
                },
                enableSorting: false,
            });
            cols.push({
                id: 'create_login_shortcut',
                header: '',
                cell: ({ row }) => {
                    const uuid = row.original.uuid;
                    if (!uuid || accountsMap[uuid]?.status !== 'no_login') {
                        return null;
                    }
                    return (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCreateLoginTarget({ profileId: uuid, name: row.original.name });
                            }}
                            className="inline-flex min-h-[36px] items-center rounded-lg px-2 text-xs font-bold text-primary transition-colors hover:bg-primary-light hover:text-primary-hover"
                        >
                            إنشاء حساب
                        </button>
                    );
                },
                enableSorting: false,
                size: 100,
            });
        }

        return cols;
    }, [accountsLoading, accountsMap, displayNameParts, isSysAdmin]);

    const renderBulkActions = (_selectedRows: Sponsor[]) => {
        return (
            <button
                onClick={() => setIsMessageModalOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-primary"
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
        if (!showAssignOrphansModal) {
            setAssignmentSponsorSearchQuery('');
            setAssignmentOrphanSearchQuery('');
            return;
        }

        if (!selectedSponsorForAssignment) {
            setAssignmentOrphanSearchQuery('');
        }
    }, [selectedSponsorForAssignment, showAssignOrphansModal]);

    const filteredSponsors = useMemo(() => {
        let sortedAndFiltered = [...sponsorList];

        if (searchQuery) {
            sortedAndFiltered = sortedAndFiltered.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
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

        if (isSysAdmin && filterOnlyNoAccount) {
            sortedAndFiltered = sortedAndFiltered.filter((s) => {
                if (!s.uuid) return true;
                return accountsMap[s.uuid]?.status === 'no_login';
            });
        }

        return sortedAndFiltered;
    }, [accountsMap, filterOnlyNoAccount, isSysAdmin, searchQuery, sortBy, sponsorList]);

    const assignmentSponsors = useMemo(() => {
        const normalizedQuery = assignmentSponsorSearchQuery.trim().toLowerCase();
        const sortedSponsors = [...sponsorList].sort((a, b) => a.name.localeCompare(b.name, 'ar'));

        if (!normalizedQuery) {
            return sortedSponsors;
        }

        return sortedSponsors.filter((sponsor) => sponsor.name.toLowerCase().includes(normalizedQuery));
    }, [assignmentSponsorSearchQuery, sponsorList]);

    const assignmentOrphans = useMemo(() => {
        const normalizedQuery = assignmentOrphanSearchQuery.trim().toLowerCase();

        if (!normalizedQuery) {
            return orphansData;
        }

        return orphansData.filter((orphan) => orphan.name.toLowerCase().includes(normalizedQuery));
    }, [assignmentOrphanSearchQuery, orphansData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy, filterOnlyNoAccount]);

    useEffect(() => {
        setSelectedIds(new Set());
    }, [viewMode]);

    const totalPages = Math.max(1, Math.ceil(filteredSponsors.length / ITEMS_PER_PAGE));
    const paginatedSponsors = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredSponsors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, filteredSponsors]);

    useEffect(() => {
        setSelectedIds((previous) => {
            if (previous.size === 0) return previous;
            const visibleIds = new Set(paginatedSponsors.map((sponsor) => sponsor.id));
            const next = new Set(Array.from(previous).filter((id) => visibleIds.has(id)));
            return next.size === previous.size ? previous : next;
        });
    }, [paginatedSponsors]);

    const activeFiltersCount = Number(sortBy !== 'name-asc') + Number(isSysAdmin && filterOnlyNoAccount);

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
            setSelectedIds(new Set(paginatedSponsors.map((sponsor) => sponsor.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSendMessage = (_message: string) => {
        alert('ميزة الإرسال الجماعي للكفلاء ليست مفعلة بعد. افتح صفحة الرسائل لإرسال محادثة مباشرة.');
        setIsMessageModalOpen(false);
        setSelectedIds(new Set());
    };

    const handleExportExcel = () => {
        const headers = ['id', 'name', 'sponsored_orphans_count'];
        const csvRows = [
            headers.join(','),
            ...filteredSponsors.map((sponsor) => [sponsor.id, `"${sponsor.name}"`, sponsor.sponsoredOrphanIds.length].join(','))
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
        setSponsorList(prevList => prevList.map((sponsor) => sponsor.id === updatedSponsor.id ? updatedSponsor : sponsor));
        setEditingSponsor(null);
    };

    const handleResetFilters = () => {
        setSortBy('name-asc');
        setFilterOnlyNoAccount(false);
        setIsPopoverOpen(false);
    };

    const closeAssignOrphansModal = () => {
        setShowAssignOrphansModal(false);
        setSelectedSponsorForAssignment(null);
        setAssignmentSponsorSearchQuery('');
        setAssignmentOrphanSearchQuery('');
    };

    return (
        <>
            <div className={`space-y-4 sm:space-y-6 ${selectedIds.size > 0 ? 'pb-40' : 'pb-24'}`}>
                <header className="space-y-3 sm:space-y-4">
                    <div className="flex items-start justify-between gap-3 sm:items-center">
                        <div className="min-w-0">
                            <h1 className="text-[1.65rem] font-bold leading-tight text-gray-800 sm:text-3xl">قائمة الكفلاء</h1>
                            <p className="mt-0.5 text-sm text-text-secondary sm:mt-1">
                                عرض وإدارة بيانات الكفلاء بتنسيق متقدم
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
                                    <div className="absolute end-0 top-full z-20 mt-2 w-48 rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl">
                                        {hasEditPermission && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsAddModalOpen(true);
                                                    setIsActionsMenuOpen(false);
                                                }}
                                                className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-primary-light hover:text-primary"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                                إضافة كافل
                                            </button>
                                        )}
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
                                        {canAssignOrphansToSponsors && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAssignOrphansModal(true);
                                                    setIsActionsMenuOpen(false);
                                                }}
                                                className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-primary-light hover:text-primary"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                                تعيين أيتام
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="hidden items-center gap-2 sm:flex">
                                {hasEditPermission && (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-hover"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                        إضافة كافل
                                    </button>
                                )}
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="ابحث باسم الكافل..."
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
                                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                                    {activeFiltersCount > 0 && (
                                        <span className="absolute -end-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </button>
                                {isPopoverOpen && (
                                    <>
                                        <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setIsPopoverOpen(false)} />
                                        <SortPopover
                                            onClose={() => setIsPopoverOpen(false)}
                                            sortBy={sortBy}
                                            setSortBy={setSortBy}
                                            filterOnlyNoAccount={filterOnlyNoAccount}
                                            setFilterOnlyNoAccount={setFilterOnlyNoAccount}
                                            isSysAdmin={isSysAdmin}
                                            onReset={handleResetFilters}
                                        />
                                    </>
                                )}
                            </div>
                            <label htmlFor="mobileSponsorSelectAllCheckbox" className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700">
                                <input
                                    type="checkbox"
                                    id="mobileSponsorSelectAllCheckbox"
                                    checked={paginatedSponsors.length > 0 && selectedIds.size === paginatedSponsors.length}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary"
                                    disabled={paginatedSponsors.length === 0}
                                    aria-label="تحديد الكل"
                                />
                                <span>الكل</span>
                            </label>
                            <span className="ms-auto inline-flex h-11 min-w-11 items-center justify-center rounded-xl bg-gray-100 px-2 text-xs font-semibold text-text-secondary">
                                {filteredSponsors.length}
                            </span>
                        </div>
                    </div>
                </header>

                <div>
                    <div className="mb-4 hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:block sm:p-4">
                        <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="-mx-1 flex w-full items-center gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 lg:w-auto">
                                <div className="flex shrink-0 items-center gap-1 rounded-xl bg-gray-100 p-1">
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
                                <div className="relative shrink-0">
                                    <button
                                        onClick={() => setIsPopoverOpen(prev => !prev)}
                                        className={`relative inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${isPopoverOpen || activeFiltersCount > 0 ? 'border-primary/30 bg-primary-light text-primary' : 'border-gray-200 text-gray-600 hover:border-primary/30 hover:text-primary'}`}
                                        aria-label="الفرز والتصفية"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
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
                                            <SortPopover
                                                onClose={() => setIsPopoverOpen(false)}
                                                sortBy={sortBy}
                                                setSortBy={setSortBy}
                                                filterOnlyNoAccount={filterOnlyNoAccount}
                                                setFilterOnlyNoAccount={setFilterOnlyNoAccount}
                                                isSysAdmin={isSysAdmin}
                                                onReset={handleResetFilters}
                                            />
                                        </>
                                    )}
                                </div>
                                <label htmlFor="selectAllCheckbox" className={`inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:border-primary/30 hover:bg-primary-light/40 ${viewMode === 'list' ? 'md:hidden' : ''}`}>
                                    <input
                                        type="checkbox"
                                        id="selectAllCheckbox"
                                        checked={paginatedSponsors.length > 0 && selectedIds.size === paginatedSponsors.length}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary"
                                        disabled={paginatedSponsors.length === 0}
                                        aria-label="تحديد الكل"
                                    />
                                    <span className="select-none whitespace-nowrap">تحديد الكل</span>
                                </label>
                                {canAssignOrphansToSponsors && (
                                    <button
                                        onClick={() => setShowAssignOrphansModal(true)}
                                        className="hidden min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:inline-flex"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                        <span>تعيين أيتام لكافل</span>
                                    </button>
                                )}
                            </div>
                            <span className="inline-flex min-h-[40px] self-start rounded-xl bg-gray-100 px-3 text-sm text-text-secondary lg:self-auto">
                                تم العثور على {filteredSponsors.length} كافل
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="rounded-[1.75rem] border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
                            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                            <p className="text-sm font-medium text-gray-600">جاري تحميل بيانات الكفلاء...</p>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="space-y-4">
                            <section className="space-y-3 md:hidden">
                                {paginatedSponsors.length > 0 ? (
                                    paginatedSponsors.map((sponsor) => {
                                        const isSelected = selectedIds.has(sponsor.id);
                                        const displayName = formatListDisplayName(sponsor.name, displayNameParts);
                                        const acc = sponsor.uuid ? accountsMap[sponsor.uuid] : undefined;
                                        const canQuickCreate = isSysAdmin && sponsor.uuid && acc?.status === 'no_login';

                                        return (
                                            <MobileSponsorListRow
                                                key={sponsor.id}
                                                sponsor={sponsor}
                                                displayName={displayName}
                                                selected={isSelected}
                                                onSelect={() => handleSelect(sponsor.id)}
                                                onOpen={() => navigate(`/sponsor/${sponsor.id}`)}
                                                accountStatus={acc?.status}
                                                accountsLoading={accountsLoading}
                                                showAccountStatus={isSysAdmin && Boolean(sponsor.uuid)}
                                                canQuickCreate={Boolean(canQuickCreate)}
                                                onCreateLogin={() =>
                                                    setCreateLoginTarget({
                                                        profileId: sponsor.uuid!,
                                                        name: sponsor.name,
                                                    })
                                                }
                                            />
                                        );
                                    })
                                ) : (
                                    <EmptyState title="لا توجد نتائج مطابقة" description="جرّب تعديل البحث أو إعادة تعيين التصفية لعرض مزيد من الكفلاء." />
                                )}
                            </section>
                            <div className="hidden md:block">
                                <DataTable
                                    columns={tableColumns}
                                    data={filteredSponsors}
                                    onRowClick={(row) => navigate(`/sponsor/${row.id}`)}
                                    renderBulkActions={renderBulkActions}
                                    storageKey="sponsors_table"
                                    filterPlaceholder="ابحث باسم الكافل..."
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
                            {paginatedSponsors.length > 0 ? (
                                <>
                                    <section className="grid grid-cols-2 gap-3 md:hidden">
                                        {paginatedSponsors.map((sponsor) => {
                                            const isSelected = selectedIds.has(sponsor.id);
                                            const displayName = formatListDisplayName(sponsor.name, displayNameParts);
                                            const acc = sponsor.uuid ? accountsMap[sponsor.uuid] : undefined;
                                            return (
                                                <MobileSponsorGridTile
                                                    key={sponsor.id}
                                                    sponsor={sponsor}
                                                    displayName={displayName}
                                                    selected={isSelected}
                                                    onSelect={() => handleSelect(sponsor.id)}
                                                    onOpen={() => navigate(`/sponsor/${sponsor.id}`)}
                                                    accountStatus={acc?.status}
                                                    accountsLoading={accountsLoading}
                                                    showAccountStatus={isSysAdmin && Boolean(sponsor.uuid)}
                                                />
                                            );
                                        })}
                                    </section>
                                    <section className="hidden grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid lg:grid-cols-3 xl:grid-cols-4">
                                        {paginatedSponsors.map((sponsor) => {
                                            const isSelected = selectedIds.has(sponsor.id);
                                            const displayName = formatListDisplayName(sponsor.name, displayNameParts);
                                            const acc = sponsor.uuid ? accountsMap[sponsor.uuid] : undefined;
                                            const canQuickCreate = isSysAdmin && sponsor.uuid && acc?.status === 'no_login';
                                            const cardFields: EntityCardField[] = [
                                                {
                                                    label: 'عدد الأيتام:',
                                                    value: `${sponsor.sponsoredOrphanIds.length} ${sponsor.sponsoredOrphanIds.length === 1 ? 'يتيم' : 'أيتام'}`
                                                },
                                            ];

                                            if (isSysAdmin && sponsor.uuid) {
                                                const statusLabel = getAccountStatusLabel(acc?.status, accountsLoading);
                                                cardFields.push({
                                                    label: 'حساب المنصة:',
                                                    value: statusLabel,
                                                    type: 'pill',
                                                    pillClass:
                                                        acc?.status === 'active'
                                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                            : acc?.status === 'pending_first_login'
                                                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                                                              : 'bg-gray-100 text-gray-700 border-gray-200',
                                                });
                                            }

                                            return (
                                                <EntityCard
                                                    key={sponsor.id}
                                                    variant="card"
                                                    title={displayName}
                                                    subtitle={`يكفل ${sponsor.sponsoredOrphanIds.length} ${sponsor.sponsoredOrphanIds.length === 1 ? 'يتيم' : 'أيتام'}`}
                                                    imageUrl={sponsor.avatarUrl}
                                                    imageAlt={sponsor.name}
                                                    fields={cardFields}
                                                    actionLabel="عرض الملف الكامل"
                                                    onClick={() => navigate(`/sponsor/${sponsor.id}`)}
                                                    secondaryAction={
                                                        canQuickCreate
                                                            ? {
                                                                  label: 'إنشاء حساب دخول',
                                                                  onClick: () =>
                                                                      setCreateLoginTarget({
                                                                          profileId: sponsor.uuid!,
                                                                          name: sponsor.name,
                                                                      }),
                                                              }
                                                            : undefined
                                                    }
                                                    selected={isSelected}
                                                    onSelect={() => handleSelect(sponsor.id)}
                                                    showCheckbox={true}
                                                />
                                            );
                                        })}
                                    </section>
                                </>
                            ) : (
                                <EmptyState title="لا توجد نتائج مطابقة" description="جرّب تعديل البحث أو إعادة تعيين التصفية لعرض مزيد من الكفلاء." />
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
                <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 border-t bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] md:bottom-0">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

            {editingSponsor && (
                <EditSponsorModal
                    sponsor={editingSponsor}
                    onClose={() => setEditingSponsor(null)}
                    onSave={handleSaveSponsor}
                />
            )}

            <AddProfileWithLoginModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                role="sponsor"
                onSuccess={() => {
                    void refetchSponsors();
                    void queryClient.invalidateQueries({ queryKey: ['sponsors-basic'] });
                    void queryClient.invalidateQueries({ queryKey: ['sponsors'] });
                    void queryClient.invalidateQueries({ queryKey: ['account-statuses'] });
                    void queryClient.invalidateQueries({ queryKey: ['account-status'] });
                }}
            />

            <SendMessageModal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                onSend={handleSendMessage}
                title={`إرسال رسالة إلى ${selectedIds.size} من الكفلاء`}
            />

            {createLoginTarget && (
                <CreateLoginModal
                    isOpen
                    onClose={() => setCreateLoginTarget(null)}
                    profileId={createLoginTarget.profileId}
                    displayName={createLoginTarget.name}
                    onSuccess={() => {
                        void queryClient.invalidateQueries({ queryKey: ['account-statuses'] });
                        void queryClient.invalidateQueries({ queryKey: ['account-status'] });
                    }}
                />
            )}

            {showAssignOrphansModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 md:items-center md:p-4" onClick={closeAssignOrphansModal}>
                    <div
                        className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-2 md:hidden">
                            <span className="h-1 w-10 rounded-full bg-gray-300" />
                        </div>
                        {!selectedSponsorForAssignment ? (
                            <>
                                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 md:px-6 md:py-4">
                                    <h3 className="text-base font-bold text-gray-900 md:text-xl">اختر كافل</h3>
                                    <button
                                        type="button"
                                        onClick={closeAssignOrphansModal}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 md:h-11 md:w-11"
                                        aria-label="إغلاق"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                    </button>
                                </div>
                                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-6">
                                    <div className="sticky top-0 z-10 -mx-4 space-y-2 border-b border-gray-100 bg-white/95 px-4 pb-3 backdrop-blur md:-mx-6 md:space-y-3 md:px-6">
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                            </div>
                                            <input
                                                type="text"
                                                value={assignmentSponsorSearchQuery}
                                                onChange={(e) => setAssignmentSponsorSearchQuery(e.target.value)}
                                                placeholder="ابحث عن كافل للتعيين..."
                                                className="min-h-[46px] w-full rounded-xl border border-gray-200 bg-gray-50 pe-10 ps-4 text-sm outline-none transition-colors focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary md:min-h-[48px]"
                                            />
                                        </div>
                                        <p className="text-xs font-medium text-gray-500">
                                            عرض {assignmentSponsors.length} من أصل {sponsorList.length} كافل
                                        </p>
                                    </div>

                                    {assignmentSponsors.length > 0 ? (
                                        assignmentSponsors.map((sponsor) => (
                                            <button
                                                key={sponsor.id}
                                                onClick={() => setSelectedSponsorForAssignment(sponsor)}
                                                className="flex min-h-[68px] w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 px-3 py-2.5 text-right transition-colors hover:bg-gray-50 md:min-h-[72px] md:px-4 md:py-3"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <Avatar src={sponsor.avatarUrl} name={sponsor.name} size="md" />
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-gray-900">{sponsor.name}</p>
                                                        <p className="text-sm text-gray-500">يكفل {sponsor.sponsoredOrphanIds.length} {sponsor.sponsoredOrphanIds.length === 1 ? 'يتيم' : 'أيتام'}</p>
                                                    </div>
                                                </div>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400"><path d="m9 18 6-6-6-6"/></svg>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                                            لا يوجد كافل مطابق لعبارة البحث الحالية.
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 md:px-6 md:py-4">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <button
                                            onClick={() => setSelectedSponsorForAssignment(null)}
                                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 md:h-11 md:w-11"
                                            title="رجوع"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                        </button>
                                        <div className="min-w-0">
                                            <h3 className="truncate text-base font-bold text-gray-900 md:text-xl">تعيين أيتام لـ {selectedSponsorForAssignment.name}</h3>
                                            <p className="truncate text-xs text-gray-500">يمكنك البحث داخل قائمة الأيتام قبل التعيين</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeAssignOrphansModal}
                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 md:h-11 md:w-11"
                                        aria-label="إغلاق"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                    </button>
                                </div>
                                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-6">
                                    <div className="sticky top-0 z-10 -mx-4 space-y-2 border-b border-gray-100 bg-white/95 px-4 pb-3 backdrop-blur md:-mx-6 md:space-y-3 md:px-6">
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                            </div>
                                            <input
                                                type="text"
                                                value={assignmentOrphanSearchQuery}
                                                onChange={(e) => setAssignmentOrphanSearchQuery(e.target.value)}
                                                placeholder="ابحث باسم اليتيم..."
                                                className="min-h-[46px] w-full rounded-xl border border-gray-200 bg-gray-50 pe-10 ps-4 text-sm outline-none transition-colors focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary md:min-h-[48px]"
                                            />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                                            <span className="rounded-full bg-primary-light px-3 py-1 text-primary">
                                                {sponsorAssignedOrphanIds.length} أيتام معيّنين
                                            </span>
                                            <span>يعرض {assignmentOrphans.length} من أصل {orphansData.length} يتيم</span>
                                        </div>
                                    </div>

                                    {assignmentOrphans.length > 0 ? assignmentOrphans.map((orphan) => {
                                        const isAssigned = orphan.uuid ? sponsorAssignedOrphanIds.includes(orphan.uuid) : false;

                                        return (
                                            <div
                                                key={orphan.id}
                                                className="flex flex-row items-center justify-between gap-3 rounded-2xl border border-gray-200 px-3 py-3 sm:px-4 sm:py-4"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <Avatar src={orphan.photoUrl} name={orphan.name} size="md" />
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-gray-900">{orphan.name}</p>
                                                        <p className="text-sm text-gray-500">{orphan.age} سنوات</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        if (!selectedSponsorForAssignment.uuid || !orphan.uuid) return;

                                                        try {
                                                            if (isAssigned) {
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
                                                    className={`inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:min-h-[44px] sm:px-4 sm:text-sm ${
                                                        isAssigned
                                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                            : 'bg-primary text-white hover:bg-primary-hover'
                                                    }`}
                                                >
                                                    {isAssigned ? 'إلغاء التعيين' : 'تعيين'}
                                                </button>
                                            </div>
                                        );
                                    }) : (
                                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                                            لا يوجد يتيم مطابق لعبارة البحث الحالية.
                                        </div>
                                    )}
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
