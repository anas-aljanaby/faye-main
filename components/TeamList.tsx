import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { usePermissions, TeamMemberWithPermissions, UserPermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { TeamMember } from '../types';

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
        className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
            enabled ? 'bg-green-500' : 'bg-gray-300'
        } ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
    >
        <span 
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                enabled ? 'right-0.5' : 'left-0.5'
            } ${loading ? 'animate-pulse' : ''}`}
        />
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
                        <button onClick={() => setErrorMessage(null)} className="mr-auto text-red-500 hover:text-red-700">×</button>
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
                                className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                                    selectedMember === member.id 
                                        ? 'border-primary bg-primary-light' 
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                            >
                                <img 
                                    src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=32`}
                                    alt={member.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
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
                                    <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                                        <img 
                                            src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=48`}
                                            alt={member.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div>
                                            <h3 className="font-bold text-lg">{member.name}</h3>
                                            <p className="text-sm text-text-secondary">
                                                {isActualManager ? 'مدير - صلاحيات كاملة' : 'عضو فريق'}
                                            </p>
                                        </div>
                                        {isActualManager && (
                                            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full mr-auto">
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
                                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary-hover p-4">
                    <div className="flex items-center gap-3">
                        <img 
                            src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=48`} 
                            alt={member.name} 
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                        />
                        <div>
                            <h3 className="text-xl font-bold text-white">{member.name}</h3>
                            <p className="text-white/80 text-sm">
                                {isActualManager ? 'مدير - صلاحيات كاملة' : 'إدارة الصلاحيات'}
                            </p>
                        </div>
                        {isActualManager && (
                            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                المدير الرئيسي
                            </span>
                        )}
                        <button 
                            onClick={onClose}
                            className="mr-auto text-white/80 hover:text-white transition-colors"
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
                <div className="p-4 overflow-y-auto max-h-[60vh]">
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
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
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
                <div className="border-t p-4 bg-gray-50">
                    <button 
                        onClick={onClose} 
                        className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddTeamMemberModal: React.FC<{
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
                <h3 className="text-xl font-bold mb-4">إضافة عضو فريق جديد</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">اسم العضو</label>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">تعديل بيانات عضو الفريق</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">اسم العضو</label>
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
                    <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 transition-colors font-semibold">إلغاء</button>
                    <button onClick={handleSend} disabled={!message.trim()} className="py-2 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">إرسال</button>
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


const TeamList: React.FC = () => {
    const { teamMembers: teamMembersData, loading } = useTeamMembers();
    const { teamMembers: teamMembersWithPermissions, togglePermission, isManager, loading: permissionsLoading, refetch: refetchPermissions } = usePermissions();
    const { isManager: checkIsManager } = useAuth();
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

        switch (sortBy) {
            case 'name-asc':
            default:
                sortedAndFiltered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
                break;
        }

        return sortedAndFiltered;
    }, [searchQuery, teamList, sortBy]);

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
    
    const handleSendMessage = (message: string) => {
        alert(`(محاكاة) تم إرسال الرسالة:\n"${message}"\nإلى ${selectedIds.size} من أعضاء الفريق.`);
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

     const handleSaveNewMember = (name: string) => {
        const newMember: TeamMember = {
            id: Date.now(),
            name,
            avatarUrl: `https://picsum.photos/seed/${Date.now()}/100/100`,
            assignedOrphanIds: [], // Team members don't have direct relationships with orphans
            tasks: [],
        };
        setTeamList(prev => [newMember, ...prev]);
        setIsAddModalOpen(false);
    };

    const handleResetSort = () => {
        setSortBy('name-asc');
        setIsPopoverOpen(false);
    };

    return (
        <>
        <div className="space-y-6 pb-24">
            {/* Permissions Panel for Managers */}
            {isManager && (
                <PermissionsPanel
                    teamMembers={teamMembersWithPermissions}
                    loading={permissionsLoading}
                    onTogglePermission={handleTogglePermission}
                />
            )}

            <header className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">فريق العمل</h1>
                </div>
                 <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full flex-grow">
                        <div className="absolute pointer-events-none right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="ابحث عن عضو..."
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
                                checked={filteredTeamMembers.length > 0 && selectedIds.size === filteredTeamMembers.length}
                                onChange={handleSelectAll}
                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                disabled={filteredTeamMembers.length === 0}
                                aria-label="تحديد الكل"
                            />
                            <label htmlFor="selectAllCheckbox" className="text-sm font-medium text-gray-700 select-none cursor-pointer whitespace-nowrap">
                               تحديد الكل
                            </label>
                        </div>
                    </div>
                     <span className="text-sm text-text-secondary">
                        الإجمالي: {filteredTeamMembers.length}
                    </span>
                </div>
                
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTeamMembers.map(member => {
                        const isSelected = selectedIds.has(member.id);
                        return (
                            <div key={member.id} className={`relative bg-white rounded-lg border p-4 flex items-center gap-4 transition-all duration-200 cursor-pointer ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md hover:border-gray-300'}`} onClick={() => navigate(`/team/${member.id}`)}>
                                 <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelect(member.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-0 cursor-pointer flex-shrink-0"
                                    aria-label={`تحديد ${member.name}`}
                                />
                                <img src={member.avatarUrl} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-800">{member.name}</h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {(() => {
                                            const memberPerms = getMemberPermissions(member.id);
                                            if (!memberPerms?.permissions) {
                                                return <p className="text-sm text-text-secondary">عضو فريق</p>;
                                            }
                                            const p = memberPerms.permissions;
                                            const badges = [];
                                            
                                            if (p.is_manager) {
                                                badges.push(<span key="manager" className="text-xs px-2 py-0.5 bg-primary text-white rounded-full">مدير</span>);
                                            } else {
                                                if (p.can_approve_expense) {
                                                    badges.push(<span key="approve" className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">موافقة</span>);
                                                }
                                                if (p.can_view_financials) {
                                                    badges.push(<span key="finance" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">مالية</span>);
                                                }
                                            }
                                            
                                            if (badges.length === 0) {
                                                return <p className="text-sm text-text-secondary">عضو فريق</p>;
                                            }
                                            return badges;
                                        })()}
                                    </div>
                                </div>
                                <div className="relative">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(member.id === activeMenuId ? null : member.id); }} className="p-2 text-text-secondary hover:bg-gray-200 rounded-full" aria-label={`خيارات لـ ${member.name}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                    </button>
                                    {activeMenuId === member.id && (
                                        <div ref={menuRef} className="absolute top-full left-0 mt-2 w-40 bg-white rounded-lg shadow-xl z-10 border">
                                            <Link to={`/team/${member.id}`} onClick={(e) => e.stopPropagation()} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">عرض الملف</Link>
                                            <button onClick={(e) => { e.stopPropagation(); setEditingMember(member); setActiveMenuId(null); }} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">تعديل</button>
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    const memberPerms = getMemberPermissions(member.id);
                                                    if (memberPerms) {
                                                        setPermissionsMember(memberPerms);
                                                    }
                                                    setActiveMenuId(null); 
                                                }} 
                                                className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                الصلاحيات
                                            </button>
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
                <button onClick={() => setIsAddModalOpen(true)} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    <span className="text-xs">إضافة</span>
                </button>
            </div>
        )}

        {editingMember && (
            <EditTeamMemberModal
                member={editingMember}
                onClose={() => setEditingMember(null)}
                onSave={handleSaveMember}
            />
        )}
        <AddTeamMemberModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleSaveNewMember}
        />
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
        </>
    );
};

export default TeamList;