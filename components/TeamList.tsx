import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeamMembersBasic } from '../hooks/useTeamMembers';
import { usePermissions, TeamMemberWithPermissions, UserPermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { TeamMember } from '../types';
import Avatar from './Avatar';
import { useAccountStatusesMap } from '../hooks/useAccountStatus';
import { AccountStatusBadge } from './account/AccountStatusBadge';
import { CreateLoginModal } from './account/CreateLoginModal';
import { useQueryClient } from '@tanstack/react-query';
import AddProfileWithLoginModal from './account/AddProfileWithLoginModal';

// Permission labels and descriptions for display
const PERMISSION_CONFIG: Record<string, { label: string; description: string; icon: JSX.Element }> = {
    can_view_financials: { 
        label: 'عرض المالية', 
        description: 'عرض الحركات المالية والتقارير',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
    },
    can_edit_orphans: { 
        label: 'تعديل الأيتام', 
        description: 'إضافة وتعديل وحذف بيانات الأيتام',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
    },
    can_edit_sponsors: { 
        label: 'تعديل الكفلاء', 
        description: 'إضافة وتعديل بيانات الكفلاء',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    },
    can_create_expense: { 
        label: 'إنشاء مصروفات مباشرة', 
        description: 'إنشاء مصروفات بدون الحاجة للموافقة',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
    },
    can_approve_expense: { 
        label: 'الموافقة على المصروفات', 
        description: 'الموافقة أو رفض طلبات الصرف',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
    },
    can_edit_transactions: { 
        label: 'تعديل المعاملات', 
        description: 'تعديل وحذف المعاملات المالية',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z"/></svg>
    },
    can_manage_permissions: { 
        label: 'إدارة صلاحيات الفريق', 
        description: 'يمكنه تعديل صلاحيات أعضاء الفريق الآخرين',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    },
};

const PERMISSION_KEYS = [
    'can_view_financials',
    'can_edit_orphans',
    'can_edit_sponsors', 
    'can_create_expense',
    'can_approve_expense',
    'can_edit_transactions',
    'can_manage_permissions', // Maps to is_manager in the database
] as const;

// Map display key to database key
const PERMISSION_KEY_MAP: Record<string, string> = {
    'can_manage_permissions': 'is_manager',
};

// Get the database key for a permission
const getDbKey = (key: string): string => PERMISSION_KEY_MAP[key] || key;

// Permission Toggle Switch Component
const PermissionToggle: React.FC<{
    enabled: boolean;
    loading: boolean;
    disabled: boolean;
    onToggle: () => void;
}> = ({ enabled, loading, disabled, onToggle }) => (
    <button
        onClick={onToggle}
        disabled={disabled || loading}
        className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-1 transition-all duration-200 ${
            (disabled || loading) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-90'
        }`}
    >
        <span
            className={`relative h-6 w-11 rounded-full transition-all duration-200 ${
                enabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
        >
            <span 
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
                    enabled ? 'end-0.5' : 'start-0.5'
                } ${loading ? 'animate-pulse' : ''}`}
            />
        </span>
    </button>
);

// Permissions Management Panel (shown for managers)
const PermissionsPanel: React.FC<{
    teamMembers: TeamMemberWithPermissions[];
    loading: boolean;
    onTogglePermission: (userId: string, permissionKey: string) => Promise<{ success: boolean; error?: string }>;
}> = ({ teamMembers, loading, onTogglePermission }) => {
    const [loadingState, setLoadingState] = useState<{userId: string; key: string} | null>(null);
    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleToggle = async (userId: string, key: string) => {
        setLoadingState({ userId, key });
        setErrorMessage(null);
        setSuccessMessage(null);
        
        const result = await onTogglePermission(userId, key);
        
        if (result.success) {
            setSuccessMessage('تم تحديث الصلاحية بنجاح');
            setTimeout(() => setSuccessMessage(null), 2000);
        } else {
            setErrorMessage(result.error || 'حدث خطأ أثناء تحديث الصلاحية');
        }
        
        setLoadingState(null);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-32 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary-hover p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">إدارة الصلاحيات</h2>
                        <p className="text-white/80 text-sm">تحكم في صلاحيات أعضاء الفريق</p>
                    </div>
                </div>
            </div>
            
            <div className="p-4">
                {/* Error/Success Messages */}
                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {errorMessage}
                        <button onClick={() => setErrorMessage(null)} className="mr-auto inline-flex h-11 w-11 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-100 hover:text-red-700">×</button>
                    </div>
                )}
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        {successMessage}
                    </div>
                )}

                {/* Member Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">اختر عضو الفريق</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {teamMembers.map(member => (
                            <button
                                key={member.id}
                                onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                                className={`flex min-h-[48px] items-center gap-2 rounded-lg border-2 px-3 py-3 transition-all ${
                                    selectedMember === member.id 
                                        ? 'border-primary bg-primary-light' 
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                            >
                                <Avatar src={member.avatar_url} name={member.name} size="sm" />
                                <div className="flex-1 text-right min-w-0">
                                    <p className="font-medium text-sm truncate">{member.name}</p>
                                    {member.permissions?.is_manager && (
                                        <span className="text-xs text-primary">مدير</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Permissions Grid */}
                {selectedMember && (
                    <div className="border-t pt-4">
                        {(() => {
                            const member = teamMembers.find(m => m.id === selectedMember);
                            if (!member) return null;
                            
                            // Check if this member is the actual manager (their permissions cannot be edited)
                            const isActualManager = member.permissions?.is_manager === true;
                            
                            return (
                                <>
                                    <div className="mb-4 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center">
                                        <Avatar src={member.avatar_url} name={member.name} size="lg" />
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-lg">{member.name}</h3>
                                            <p className="text-sm text-text-secondary">
                                                {isActualManager ? 'مدير - صلاحيات كاملة' : 'عضو فريق'}
                                            </p>
                                        </div>
                                        {isActualManager && (
                                            <span className="rounded-full bg-primary px-2.5 py-1 text-xs text-white sm:me-auto">
                                                المدير الرئيسي
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Warning for manager */}
                                    {isActualManager && (
                                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                            لا يمكن تعديل صلاحيات المدير الرئيسي
                                        </div>
                                    )}
                                    
                                    <div className="grid gap-3">
                                        {PERMISSION_KEYS.map(key => {
                                            const config = PERMISSION_CONFIG[key];
                                            // Get the database key for this permission
                                            const dbKey = getDbKey(key);
                                            const value = (member.permissions as any)?.[dbKey] ?? false;
                                            const isLoading = loadingState?.userId === member.id && loadingState?.key === key;
                                            
                                            // Disable toggle if this is the manager
                                            const isDisabled = isActualManager;
                                            
                                            return (
                                                <div 
                                                    key={key}
                                                    className={`flex flex-col gap-3 rounded-lg border p-3 transition-all sm:flex-row sm:items-center sm:justify-between ${
                                                        value ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                                    } ${isDisabled ? 'opacity-60' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                            value ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
                                                        }`}>
                                                            {config.icon}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{config.label}</p>
                                                            <p className="text-xs text-text-secondary">{config.description}</p>
                                                        </div>
                                                    </div>
                                                    <PermissionToggle
                                                        enabled={value}
                                                        loading={isLoading}
                                                        disabled={isDisabled}
                                                        onToggle={() => handleToggle(member.id, dbKey)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                {!selectedMember && (
                    <div className="text-center py-8 text-text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <p>اختر عضو فريق لإدارة صلاحياته</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Permission management modal (for individual member view)
const PermissionsModal: React.FC<{
    isOpen: boolean;
    member: TeamMemberWithPermissions | null;
    onClose: () => void;
    onToggle: (userId: string, permissionKey: string) => Promise<void>;
    isManager: boolean;
}> = ({ isOpen, member, onClose, onToggle, isManager }) => {
    const [loading, setLoading] = useState<string | null>(null);

    if (!isOpen || !member) return null;

    const permissions = member.permissions;
    // Check if this is the actual manager (cannot edit their permissions)
    const isActualManager = permissions?.is_manager === true;

    const handleToggle = async (key: string) => {
        if (!isManager || isActualManager) return;
        setLoading(key);
        const dbKey = getDbKey(key);
        await onToggle(member.id, dbKey);
        setLoading(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4" onClick={onClose}>
            <div className="flex h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-xl md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary-hover p-4 md:p-5">
                    <div className="flex items-start gap-3">
                        <Avatar src={member.avatar_url} name={member.name} size="lg" className="border-2 border-white/30" />
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-lg font-bold text-white md:text-xl">{member.name}</h3>
                            <p className="text-white/80 text-sm">
                                {isActualManager ? 'مدير - صلاحيات كاملة' : 'إدارة الصلاحيات'}
                            </p>
                        </div>
                        {isActualManager && (
                            <span className="hidden rounded-full bg-white/20 px-2 py-1 text-xs text-white sm:inline-flex">
                                المدير الرئيسي
                            </span>
                        )}
                        <button 
                            onClick={onClose}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label="إغلاق"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                </div>
                
                {/* Warning for manager */}
                {isActualManager && (
                    <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        لا يمكن تعديل صلاحيات المدير الرئيسي
                    </div>
                )}
                
                {/* Permissions List */}
                <div className="flex-1 overflow-y-auto p-4 md:max-h-[60vh]">
                    <div className="space-y-3">
                        {PERMISSION_KEYS.map(key => {
                            const config = PERMISSION_CONFIG[key];
                            const dbKey = getDbKey(key);
                            const value = (permissions as any)?.[dbKey] ?? false;
                            const isLoading = loading === key;
                            const isDisabled = isActualManager;
                            
                            return (
                                <div 
                                    key={key} 
                                    className={`flex flex-col gap-3 rounded-lg border p-3 transition-all sm:flex-row sm:items-center sm:justify-between ${
                                        value ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                    } ${isDisabled ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                            value ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
                                        }`}>
                                            {config.icon}
                                        </div>
                                        <div>
                                            <p className="font-medium">{config.label}</p>
                                            <p className="text-xs text-text-secondary">{config.description}</p>
                                        </div>
                                    </div>
                                    {isManager && !isDisabled ? (
                                        <PermissionToggle
                                            enabled={value}
                                            loading={isLoading}
                                            disabled={isDisabled}
                                            onToggle={() => handleToggle(key)}
                                        />
                                    ) : (
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            value ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            {value ? 'مفعّل' : 'معطّل'}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:px-4 md:py-4 md:pb-4">
                    <button 
                        onClick={onClose} 
                        className="min-h-[48px] w-full rounded-xl bg-gray-100 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

const EditTeamMemberModal: React.FC<{
    member: TeamMember;
    onClose: () => void;
    onSave: (updatedMember: TeamMember) => void;
}> = ({ member, onClose, onSave }) => {
    const [name, setName] = useState(member.name);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...member, name });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4" onClick={onClose}>
            <div className="flex h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-xl md:h-auto md:max-w-md md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 md:px-6">
                    <h3 className="text-lg font-bold text-gray-900 md:text-xl">تعديل بيانات عضو الفريق</h3>
                    <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800" aria-label="إغلاق">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
                    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">اسم العضو</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="block min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary"/>
                        </div>
                    </div>
                    <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:flex-row md:justify-end md:px-6 md:pb-4">
                        <button type="button" onClick={onClose} className="min-h-[48px] rounded-xl bg-gray-100 px-5 py-2 font-semibold text-text-secondary transition-colors hover:bg-gray-200">إلغاء</button>
                        <button type="submit" className="min-h-[48px] rounded-xl bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary-hover">حفظ التغييرات</button>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4" onClick={onClose}>
            <div className="flex h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-xl md:h-auto md:max-w-lg md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 md:px-6">
                    <h3 className="text-lg font-bold text-gray-900 md:text-xl">{title}</h3>
                    <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800" aria-label="إغلاق">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="اكتب رسالتك هنا..."
                        className="h-40 w-full resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary md:h-32"
                        autoFocus
                    ></textarea>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:flex-row md:justify-end md:px-6 md:pb-4">
                    <button type="button" onClick={onClose} className="min-h-[48px] rounded-xl bg-gray-100 px-5 py-2 font-semibold text-text-secondary transition-colors hover:bg-gray-200">إلغاء</button>
                    <button onClick={handleSend} disabled={!message.trim()} className="min-h-[48px] rounded-xl bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-400">إرسال</button>
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
                        {(['name-asc'] as const).map(option => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="sort" value={option} checked={sortBy === option} onChange={e => setSortBy(e.target.value)} className="w-4 h-4 text-primary focus:ring-primary focus:ring-offset-0"/>
                                <span className="text-sm">{ { 'name-asc': 'الاسم' }[option] }</span>
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


interface TeamListProps {
    embedded?: boolean;
}

const MobileTeamMemberCard: React.FC<{
    member: TeamMember;
    roleLabel: string;
    showAdminDetails: boolean;
    accountsLoading: boolean;
    accountStatus?: string;
    canQuickCreate: boolean;
    onQuickCreate: () => void;
}> = ({ member, roleLabel, showAdminDetails, accountsLoading, accountStatus, canQuickCreate, onQuickCreate }) => (
    <div className="rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
            <Avatar src={member.avatar_url} name={member.name} size="lg" />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-bold text-gray-800">{member.name}</h3>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                        {roleLabel}
                    </span>
                </div>
                {showAdminDetails && (
                    <div className="mt-2">
                        {member.uuid ? (
                            <AccountStatusBadge
                                status={accountStatus as any}
                                loading={accountsLoading}
                                className="!text-[10px]"
                            />
                        ) : (
                            <span className="text-xs text-gray-400">لا يوجد ملف مرتبط</span>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
            <Link
                to={`/team/${member.id}`}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
            >
                عرض الملف
            </Link>
            {canQuickCreate && (
                <button
                    type="button"
                    onClick={onQuickCreate}
                    className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50"
                >
                    إنشاء حساب دخول
                </button>
            )}
        </div>
    </div>
);

const TeamList: React.FC<TeamListProps> = ({ embedded = false }) => {
    const { teamMembers: teamMembersData, loading, refetch: refetchTeamMembers } = useTeamMembersBasic();
    const { teamMembers: teamMembersWithPermissions, togglePermission, isManager, loading: permissionsLoading, refetch: refetchPermissions } = usePermissions();
    const { userProfile } = useAuth();
    const queryClient = useQueryClient();
    const isSysAdmin = userProfile?.is_system_admin === true;
    const [teamList, setTeamList] = useState<TeamMember[]>([]);
    
    useEffect(() => {
        if (teamMembersData) {
            setTeamList(teamMembersData);
        }
    }, [teamMembersData]);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [permissionsMember, setPermissionsMember] = useState<TeamMemberWithPermissions | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [sortBy, setSortBy] = useState('name-asc');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [memberFilter, setMemberFilter] = useState<'all' | 'employees' | 'volunteers' | 'delegates'>('all');
    const [teamViewMode, setTeamViewMode] = useState<'table' | 'grid'>('grid');
    const [filterOnlyNoAccount, setFilterOnlyNoAccount] = useState(false);
    const [createLoginTarget, setCreateLoginTarget] = useState<{ profileId: string; name: string } | null>(null);

    const teamProfileIds = useMemo(
        () => teamList.map((m) => m.uuid).filter(Boolean) as string[],
        [teamList]
    );
    const { data: accountsMap = {}, isLoading: accountsLoading } = useAccountStatusesMap(
        teamProfileIds,
        isSysAdmin
    );

    const handleTogglePermission = async (userId: string, permissionKey: string): Promise<{ success: boolean; error?: string }> => {
        const result = await togglePermission(userId, permissionKey as any);
        // Refresh to get updated permissions
        if (result.success) {
            await refetchPermissions();
        }
        return result;
    };

    // Get permissions for a member by matching UUIDs
    const getMemberPermissions = (memberId: number): TeamMemberWithPermissions | undefined => {
        // Find by matching member in teamMembersWithPermissions
        return teamMembersWithPermissions.find(m => {
            // Try to match by name since IDs might be different formats
            const teamMember = teamList.find(t => t.id === memberId);
            return teamMember && m.name === teamMember.name;
        });
    };

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
    
    const filteredTeamMembers = useMemo(() => {
        let sortedAndFiltered = [...teamList];

        if (searchQuery) {
            sortedAndFiltered = sortedAndFiltered.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Sort: current user first, then others
        sortedAndFiltered.sort((a, b) => {
            const aIsCurrentUser = a.uuid === userProfile?.id;
            const bIsCurrentUser = b.uuid === userProfile?.id;
            
            if (aIsCurrentUser && !bIsCurrentUser) return -1;
            if (!aIsCurrentUser && bIsCurrentUser) return 1;
            
            // If both are current user or both are not, sort by name
        switch (sortBy) {
            case 'name-asc':
            default:
                    return a.name.localeCompare(b.name, 'ar');
        }
        });

        if (isSysAdmin && filterOnlyNoAccount) {
            sortedAndFiltered = sortedAndFiltered.filter((m) => {
                if (!m.uuid) return true;
                return accountsMap[m.uuid]?.status === 'no_login';
            });
        }

        return sortedAndFiltered;
    }, [searchQuery, teamList, sortBy, userProfile, isSysAdmin, filterOnlyNoAccount, accountsMap]);

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
            setSelectedIds(new Set(filteredTeamMembers.map(m => m.id)));
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const handleSendMessage = (_message: string) => {
        alert('ميزة الإرسال الجماعي لأعضاء الفريق ليست مفعلة بعد. افتح صفحة الرسائل لإرسال محادثة مباشرة.');
        setIsMessageModalOpen(false);
        setSelectedIds(new Set());
    };

    const handleExportExcel = () => {
        const headers = ['id', 'name'];
        const csvRows = [
            headers.join(','),
            ...filteredTeamMembers.map(m => [m.id, `"${m.name}"`].join(','))
        ];
        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', 'malath-team.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleSaveMember = (updatedMember: TeamMember) => {
        setTeamList(prevList => prevList.map(m => m.id === updatedMember.id ? updatedMember : m));
        setEditingMember(null);
    };

    const handleResetSort = () => {
        setSortBy('name-asc');
        setIsPopoverOpen(false);
    };

    if (loading && teamList.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 w-40 rounded bg-gray-200" />
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="h-28 rounded-2xl bg-gray-100" />
                        <div className="h-28 rounded-2xl bg-gray-100" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="space-y-6 pb-24">
            {/* Permissions Panel for Managers */}
            {isSysAdmin && isManager && (
                <PermissionsPanel
                    teamMembers={teamMembersWithPermissions}
                    loading={permissionsLoading}
                    onTogglePermission={handleTogglePermission}
                />
            )}

            {!embedded && (
                <header>
                    <h1 className="text-3xl font-bold text-gray-800">فريق العمل</h1>
                </header>
            )}

            {/* Toolbar */}
            <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-80 group">
                    <input 
                        type="text" 
                        placeholder="البحث في الموظفين..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 pe-4 ps-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary"
                        ref={searchInputRef}
                    />
                </div>
                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end">
                    {isSysAdmin && (
                        <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 cursor-pointer whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={filterOnlyNoAccount}
                                onChange={(e) => setFilterOnlyNoAccount(e.target.checked)}
                                className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                            />
                            بدون حساب دخول فقط
                        </label>
                    )}
                    <div className="hidden rounded-xl bg-gray-100 p-1 md:flex">
                        <button onClick={() => setTeamViewMode('table')} className={`px-3 py-2 rounded-lg transition-all ${teamViewMode === 'table' ? 'bg-white text-primary shadow-sm font-bold' : 'text-gray-500'}`}>جدول</button>
                        <button onClick={() => setTeamViewMode('grid')} className={`px-3 py-2 rounded-lg transition-all ${teamViewMode === 'grid' ? 'bg-white text-primary shadow-sm font-bold' : 'text-gray-500'}`}>بطاقات</button>
                    </div>
                    {isSysAdmin && (
                        <button className="min-h-[48px] w-full rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg md:w-auto" onClick={() => setIsAddModalOpen(true)}>إضافة موظف</button>
                    )}
                </div>
            </div>

            {filteredTeamMembers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center text-sm text-text-secondary shadow-sm">
                    لا يوجد أعضاء فريق مطابقون لنتائج البحث الحالية.
                </div>
            ) : (
                <>
                    <div className="space-y-3 md:hidden">
                        {filteredTeamMembers.map(member => {
                            const memberPerms = getMemberPermissions(member.id);
                            const roleLabel = isSysAdmin && memberPerms?.permissions?.is_manager ? 'مدير' : 'عضو فريق';
                            const acc = member.uuid ? accountsMap[member.uuid] : undefined;
                            const canQuickCreate =
                                isSysAdmin && member.uuid && acc?.status === 'no_login';

                            return (
                                <MobileTeamMemberCard
                                    key={member.id}
                                    member={member}
                                    roleLabel={roleLabel}
                                    showAdminDetails={isSysAdmin}
                                    accountsLoading={accountsLoading}
                                    accountStatus={acc?.status}
                                    canQuickCreate={Boolean(canQuickCreate)}
                                    onQuickCreate={() => setCreateLoginTarget({ profileId: member.uuid!, name: member.name })}
                                />
                            );
                        })}
                    </div>

                    <div className="hidden md:block">
                        <AnimatePresence mode="wait">
                            {teamViewMode === 'table' ? (
                                <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                                    <table className="w-full text-right border-collapse">
                                        <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
                                            <tr>
                                                <th className="p-4 border-b">الاسم</th>
                                                <th className="p-4 border-b">الدور</th>
                                                {isSysAdmin && <th className="p-4 border-b">حساب الدخول</th>}
                                                <th className="p-4 border-b text-center">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredTeamMembers.map(member => {
                                                const memberPerms = getMemberPermissions(member.id);
                                                const role = isSysAdmin && memberPerms?.permissions?.is_manager ? 'مدير' : 'عضو فريق';
                                                const memberPermissions = memberPerms?.permissions;
                                                const hasNoPermissions = isSysAdmin && (!memberPermissions || (
                                                    !memberPermissions.can_view_financials &&
                                                    !memberPermissions.can_edit_orphans &&
                                                    !memberPermissions.can_edit_sponsors &&
                                                    !memberPermissions.can_create_expense &&
                                                    !memberPermissions.can_approve_expense &&
                                                    !memberPermissions.can_edit_transactions &&
                                                    !memberPermissions.is_manager
                                                ));
                                                const acc = member.uuid ? accountsMap[member.uuid] : undefined;
                                                const canQuickCreate =
                                                    isSysAdmin && member.uuid && acc?.status === 'no_login';
                                                return (
                                                    <tr key={member.id} className="hover:bg-gray-50 transition-all text-sm cursor-pointer" onClick={() => navigate(`/team/${member.id}`)}>
                                                        <td className="p-4 font-bold">{member.name}</td>
                                                        <td className="p-4 text-gray-600">
                                                            <div className="flex items-center gap-2">
                                                                <span>{role}</span>
                                                                {hasNoPermissions ? (
                                                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                                                        بدون صلاحيات
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                        {isSysAdmin && (
                                                            <td className="p-4">
                                                                {member.uuid ? (
                                                                    <AccountStatusBadge
                                                                        status={acc?.status}
                                                                        loading={accountsLoading}
                                                                        className="!text-[10px]"
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">—</span>
                                                                )}
                                                            </td>
                                                        )}
                                                        <td className="p-4 text-center">
                                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                                <Link to={`/team/${member.id}`} onClick={(e) => e.stopPropagation()} className="text-gray-400 hover:text-primary transition-colors">عرض</Link>
                                                                {canQuickCreate && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setCreateLoginTarget({ profileId: member.uuid!, name: member.name });
                                                                        }}
                                                                        className="text-xs font-bold text-primary hover:text-primary-hover"
                                                                    >
                                                                        إنشاء حساب
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </motion.div>
                            ) : (
                                <motion.div key="grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                                    {filteredTeamMembers.map(member => {
                                        const memberPerms = getMemberPermissions(member.id);
                                        const role = isSysAdmin && memberPerms?.permissions?.is_manager ? 'مدير' : 'عضو فريق';
                                        const memberPermissions = memberPerms?.permissions;
                                        const hasNoPermissions = isSysAdmin && (!memberPermissions || (
                                            !memberPermissions.can_view_financials &&
                                            !memberPermissions.can_edit_orphans &&
                                            !memberPermissions.can_edit_sponsors &&
                                            !memberPermissions.can_create_expense &&
                                            !memberPermissions.can_approve_expense &&
                                            !memberPermissions.can_edit_transactions &&
                                            !memberPermissions.is_manager
                                        ));
                                        const acc = member.uuid ? accountsMap[member.uuid] : undefined;
                                        const canQuickCreate =
                                            isSysAdmin && member.uuid && acc?.status === 'no_login';
                                        return (
                                            <div key={member.id} className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/team/${member.id}`)}>
                                                <Avatar src={member.avatar_url} name={member.name} size="xl" className="mb-3 !h-16 !w-16 !text-2xl" />
                                                <h4 className="font-bold text-gray-800">{member.name}</h4>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <p className="text-xs text-gray-500">{role}</p>
                                                    {hasNoPermissions ? (
                                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                                            بدون صلاحيات
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {isSysAdmin && member.uuid && (
                                                    <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                                                        <AccountStatusBadge
                                                            status={acc?.status}
                                                            loading={accountsLoading}
                                                            className="!text-[10px]"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex flex-col sm:flex-row gap-2 w-full mt-auto">
                                                    <Link
                                                        to={`/team/${member.id}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex-1 min-w-0 px-3 py-2.5 bg-primary-light text-primary rounded-xl text-xs font-bold text-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                                                    >
                                                        عرض
                                                    </Link>
                                                    {canQuickCreate && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCreateLoginTarget({ profileId: member.uuid!, name: member.name });
                                                            }}
                                                            className="flex-1 min-w-0 py-2.5 px-2 border-2 border-slate-300 bg-white text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm"
                                                        >
                                                            إنشاء حساب
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}
        </div>

        {selectedIds.size > 0 && (
            <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] border-t bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40 md:bottom-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-primary">{selectedIds.size} تم تحديده</span>
                            <button onClick={() => setSelectedIds(new Set())} className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600">
                                إلغاء التحديد
                            </button>
                        </div>
                        <button onClick={() => setIsMessageModalOpen(true)} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <span>إرسال رسالة</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {selectedIds.size === 0 && (
                <div className="hidden sm:hidden fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] items-center justify-around bg-white/80 p-2 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] backdrop-blur-sm z-30">
                <button onClick={() => navigate(-1)} className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-gray-600 transition-colors hover:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
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
                {isSysAdmin && (
                    <button onClick={() => setIsAddModalOpen(true)} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        <span className="text-xs">إضافة</span>
                    </button>
                )}
            </div>
        )}

        {editingMember && (
            <EditTeamMemberModal
                member={editingMember}
                onClose={() => setEditingMember(null)}
                onSave={handleSaveMember}
            />
        )}
        {isSysAdmin && (
            <AddProfileWithLoginModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                role="team_member"
                onSuccess={() => {
                    void refetchTeamMembers();
                    void refetchPermissions();
                    void queryClient.invalidateQueries({ queryKey: ['team-members-basic'] });
                    void queryClient.invalidateQueries({ queryKey: ['team-members'] });
                    void queryClient.invalidateQueries({ queryKey: ['account-statuses'] });
                    void queryClient.invalidateQueries({ queryKey: ['account-status'] });
                }}
            />
        )}
         <SendMessageModal
            isOpen={isMessageModalOpen}
            onClose={() => setIsMessageModalOpen(false)}
            onSend={handleSendMessage}
            title={`إرسال رسالة إلى ${selectedIds.size} من أعضاء الفريق`}
        />
        <PermissionsModal
            isOpen={!!permissionsMember}
            member={permissionsMember}
            onClose={() => setPermissionsMember(null)}
            onToggle={handleTogglePermission}
            isManager={isManager}
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
        </>
    );
};

export default TeamList;
