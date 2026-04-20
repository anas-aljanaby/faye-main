import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { messageTemplates, MessageTemplate } from '../data';
import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';
import { Conversation, Message } from '../types';
import { findOrCreateConversation, formatTimestamp } from '../utils/messaging';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import ResponsiveState from './ResponsiveState';

const TemplatesModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (body: string) => void;
    templates: MessageTemplate[];
    onUpdateTemplates: (templates: MessageTemplate[]) => void;
}> = ({ isOpen, onClose, onSelectTemplate, templates, onUpdateTemplates }) => {
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editBody, setEditBody] = useState('');

    if (!isOpen) return null;

    const closeModal = () => {
        setEditingTemplate(null);
        setIsAddingNew(false);
        setEditTitle('');
        setEditBody('');
        onClose();
    };

    const handleSelect = (body: string) => {
        onSelectTemplate(body);
        closeModal();
    };

    const handleEdit = (template: MessageTemplate) => {
        setEditingTemplate(template);
        setEditTitle(template.title);
        setEditBody(template.body);
        setIsAddingNew(false);
    };

    const handleAddNew = () => {
        setEditingTemplate(null);
        setEditTitle('');
        setEditBody('');
        setIsAddingNew(true);
    };

    const handleSave = () => {
        if (!editTitle.trim() || !editBody.trim()) return;

        if (isAddingNew) {
            const newId = Math.max(...templates.map(t => t.id), 0) + 1;
            const newTemplate: MessageTemplate = {
                id: newId,
                title: editTitle.trim(),
                body: editBody.trim()
            };
            onUpdateTemplates([...templates, newTemplate]);
        } else if (editingTemplate) {
            const updated = templates.map(t =>
                t.id === editingTemplate.id
                    ? { ...t, title: editTitle.trim(), body: editBody.trim() }
                    : t
            );
            onUpdateTemplates(updated);
        }

        setEditingTemplate(null);
        setIsAddingNew(false);
        setEditTitle('');
        setEditBody('');
    };

    const handleDelete = (templateId: number) => {
        if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
            onUpdateTemplates(templates.filter(t => t.id !== templateId));
        }
    };

    const handleCancel = () => {
        setEditingTemplate(null);
        setIsAddingNew(false);
        setEditTitle('');
        setEditBody('');
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center md:justify-center md:p-4"
            onClick={closeModal}
        >
            <div
                className="flex h-[calc(100dvh-1rem)] w-full flex-col rounded-t-[1.75rem] bg-white shadow-xl md:h-auto md:max-h-[80vh] md:max-w-2xl md:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="قوالب الرسائل"
            >
                <div className="flex shrink-0 flex-col gap-3 border-b px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] md:flex-row md:items-center md:justify-between md:px-6 md:py-5">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">قوالب الرسائل</h3>
                        <p className="mt-1 text-sm text-gray-500">اختر قالبًا جاهزًا أو عدّل القوالب الحالية.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAddNew}
                            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover md:flex-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                            إضافة قالب جديد
                        </button>
                        <button
                            onClick={closeModal}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-2xl font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                            aria-label="إغلاق"
                        >
                            &times;
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
                    {(isAddingNew || editingTemplate) ? (
                        <div className="mb-4 rounded-2xl border-2 border-primary bg-gray-50 p-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">عنوان القالب</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        placeholder="عنوان القالب..."
                                        className="min-h-11 w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">محتوى القالب</label>
                                    <textarea
                                        value={editBody}
                                        onChange={(e) => setEditBody(e.target.value)}
                                        placeholder="محتوى القالب..."
                                        rows={6}
                                        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary resize-y"
                                    />
                                </div>
                                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                    <button
                                        onClick={handleCancel}
                                        className="min-h-11 rounded-xl bg-gray-200 px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={!editTitle.trim() || !editBody.trim()}
                                        className="min-h-11 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-300"
                                    >
                                        حفظ
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                    <div className="space-y-3">
                    {templates.map(template => (
                        <div key={template.id} className="rounded-2xl border p-4 transition-colors hover:bg-gray-50">
                            <div className="flex items-start justify-between gap-3">
                                <div 
                                    onClick={() => handleSelect(template.body)} 
                                    className="flex-1 cursor-pointer"
                                >
                            <h4 className="font-bold text-primary">{template.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">{template.body}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                        title="تعديل"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-red-600 transition-colors hover:bg-red-50"
                                        title="حذف"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


const MessageComposer: React.FC<{ 
    onSendMessage: (content: string) => Promise<void>;
    templates: MessageTemplate[];
    onUpdateTemplates: (templates: MessageTemplate[]) => void;
}> = ({ onSendMessage, templates, onUpdateTemplates }) => {
    const [messageText, setMessageText] = useState('');
    const [error, setError] = useState('');
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim()) return;

        try {
            await onSendMessage(messageText.trim());
            setMessageText('');
        setError('');
        } catch (err) {
            setError('حدث خطأ أثناء إرسال الرسالة.');
        }
    };

    const handleSelectTemplate = (body: string) => {
        setMessageText(body);
        setIsTemplatesModalOpen(false);
    };

    return (
        <>
            <form onSubmit={handleSendMessage} className="space-y-3">
                 {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700 break-words">{error}</div>}
                 
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="اكتب رسالتك هنا..."
                        rows={2}
                        className="min-h-[6rem] w-full flex-1 rounded-2xl border border-gray-300 bg-white px-3 py-3 text-sm leading-6 focus:border-primary focus:ring-2 focus:ring-primary resize-y sm:min-h-[5.5rem]"
                    />
                    <div className="flex items-center gap-2 sm:shrink-0">
                    <button
                            type="button"
                            onClick={() => setIsTemplatesModalOpen(true)}
                            title="استخدام قالب"
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-gray-100 p-2.5 text-gray-600 transition-colors hover:bg-gray-200"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        </button>
                    <button
                        type="submit"
                        disabled={!messageText.trim()}
                        className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-300 sm:flex-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                        إرسال
                    </button>
                    </div>
                    </div>
            </form>
            <TemplatesModal 
                isOpen={isTemplatesModalOpen}
                onClose={() => setIsTemplatesModalOpen(false)}
                onSelectTemplate={handleSelectTemplate}
                templates={templates}
                onUpdateTemplates={onUpdateTemplates}
            />
        </>
    );
};


const Messages: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [showNewConversationModal, setShowNewConversationModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; avatar_url?: string; role: string }>>([]);
    const [templates, setTemplates] = useState<MessageTemplate[]>(messageTemplates);
    const [searchParams, setSearchParams] = useSearchParams();
    
    const { conversations, loading: conversationsLoading, refetch: refetchConversations } = useConversations();
    const { messages, loading: messagesLoading, sendMessage } = useMessages(selectedConversationId);
    const { userProfile, user } = useAuth();
    const selectedConversationFromUrl = searchParams.get('conversation');

    useEffect(() => {
        if (!selectedConversationFromUrl || !conversations.some(c => c.id === selectedConversationFromUrl)) {
            return;
        }

        setSelectedConversationId(prev => prev === selectedConversationFromUrl ? prev : selectedConversationFromUrl);
    }, [conversations, selectedConversationFromUrl]);

    useEffect(() => {
        const currentConversation = searchParams.get('conversation');
        if (!selectedConversationId) {
            if (!currentConversation) return;
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('conversation');
            setSearchParams(nextParams, { replace: true });
            return;
        }

        if (currentConversation === selectedConversationId) {
            return;
        }

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('conversation', selectedConversationId);
        setSearchParams(nextParams, { replace: true });
    }, [searchParams, selectedConversationId, setSearchParams]);

    // Fetch available users for starting new conversations
    useEffect(() => {
        const fetchAvailableUsers = async () => {
            if (!userProfile || !user) return;

            const { data, error } = await supabase
                .from('user_profiles')
                .select('id, name, avatar_url, role')
                .eq('organization_id', userProfile.organization_id)
                .eq('is_system_admin', false)
                .neq('id', user.id);

            if (!error && data) {
                setAvailableUsers(data);
            }
        };

        if (showNewConversationModal) {
            fetchAvailableUsers();
        }
    }, [showNewConversationModal, userProfile, user]);

    const filteredConversations = useMemo(() => {
        if (!conversations) return [];
        return conversations
            .filter(c => {
                const participantName = c.participant?.name || '';
                return participantName.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .sort((a, b) => {
                // Sort by unread count first, then by last_message_at
                const aUnread = a.unread_count || 0;
                const bUnread = b.unread_count || 0;
                if (aUnread !== bUnread) return bUnread - aUnread;
                const aTime = a.last_message_at?.getTime() || 0;
                const bTime = b.last_message_at?.getTime() || 0;
                return bTime - aTime;
            });
    }, [conversations, searchQuery]);

    const selectedConversation = useMemo(() => {
        if (!selectedConversationId || !conversations) return null;
        return conversations.find(c => c.id === selectedConversationId);
    }, [selectedConversationId, conversations]);

    const handleStartConversation = async (otherUserId: string) => {
        if (!userProfile || !user) return;

        const { conversation, error } = await findOrCreateConversation(
            user.id,
            otherUserId,
            userProfile.organization_id
        );

        if (error || !conversation) {
            alert('حدث خطأ أثناء إنشاء المحادثة');
            return;
        }

        setSelectedConversationId(conversation.id);
        setShowNewConversationModal(false);
        refetchConversations();
    };

    const handleSendMessage = async (content: string) => {
        if (!selectedConversationId) return;
        const { error } = await sendMessage(content);
        if (error) {
            throw error;
        }
        // Refetch conversations to update last_message_at
        refetchConversations();
    };
    
    const renderAvatar = (conv: Conversation) => {
        return <Avatar src={conv.participant?.avatar_url} name={conv.participant?.name || '?'} size="lg" />;
    };
    
    return (
        <>
        <div className="flex h-[calc(100dvh-10rem-env(safe-area-inset-bottom))] min-h-[30rem] flex-col overflow-hidden rounded-2xl border bg-bg-card shadow-md md:h-full md:max-h-[calc(100vh-120px)] md:flex-row">
            <div className={`min-h-0 w-full flex-col border-b border-gray-200 md:w-2/5 md:border-b-0 md:border-s lg:w-1/3 ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                <div className="border-b p-3 md:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                         <div className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="بحث في الرسائل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="min-h-11 w-full rounded-xl border border-gray-300 bg-white pe-4 ps-10 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary"
                        />
                    </div>
                        <button
                        onClick={() => setShowNewConversationModal(true)}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:w-auto sm:flex-none"
                        title="بدء محادثة جديدة"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        <span>بدء محادثة جديدة</span>
                    </button>
                    </div>
                </div>
                <div className="overflow-y-auto flex-1">
                    {conversationsLoading ? (
                        <div className="p-3 md:p-4">
                            <ResponsiveState
                                variant="loading"
                                compact
                                title="جاري تحميل المحادثات"
                                description="نجهز أحدث المحادثات والرسائل غير المقروءة."
                            >
                                <div className="mt-5 w-full space-y-3">
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <div key={index} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-3">
                                            <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-gray-200" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 w-32 animate-pulse rounded-full bg-gray-200" />
                                                <div className="h-3 w-full animate-pulse rounded-full bg-gray-100" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ResponsiveState>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-3 md:p-4">
                            <ResponsiveState
                                compact
                                title="لا توجد محادثات"
                                description="ابدأ محادثة جديدة وسيظهر سجل الرسائل هنا."
                            />
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                        <div 
                            key={conv.id}
                            onClick={() => setSelectedConversationId(conv.id)}
                            className={`flex cursor-pointer items-start gap-3 border-b px-3 py-4 transition-colors md:px-4 ${selectedConversationId === conv.id ? 'bg-primary-light' : 'hover:bg-gray-50'}`}
                        >
                           {renderAvatar(conv)}
                            <div className="flex-1 overflow-hidden">
                                <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                        <h3 className="truncate font-bold text-gray-800">{conv.participant?.name || 'مستخدم'}</h3>
                                        {conv.last_message_at && (
                                            <p className="mt-1 text-xs text-gray-400 md:hidden">
                                                {formatTimestamp(conv.last_message_at)}
                                            </p>
                                        )}
                                        </div>
                                        {conv.unread_count && conv.unread_count > 0 && (
                                            <span className="ms-2 flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-blue-500 px-1 text-xs font-semibold text-white">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                        {conv.last_message?.content || 'لا توجد رسائل'}
                                    </p>
                                    {conv.last_message_at && (
                                        <p className="mt-1 hidden text-xs text-gray-400 md:block">
                                            {formatTimestamp(conv.last_message_at)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div className={`min-h-0 flex-1 flex-col ${selectedConversationId ? 'flex' : 'hidden md:flex'}`}>
                {selectedConversation ? (
                    <>
                        <div className="flex shrink-0 items-center gap-3 border-b px-3 py-3 md:px-4">
                           <button 
                                onClick={() => setSelectedConversationId(null)}
                                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary md:hidden"
                                aria-label="الرجوع إلى قائمة المحادثات"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                           </button>
                           {renderAvatar(selectedConversation)}
                            <div className="min-w-0 flex-1">
                                <h2 className="truncate text-base font-bold text-gray-900 md:text-lg">{selectedConversation.participant?.name || 'مستخدم'}</h2>
                                <p className="text-sm text-gray-600">{selectedConversation.participant?.role === 'sponsor' ? 'كافل' : 'عضو فريق'}</p>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 px-3 py-4 md:px-6 md:py-6">
                            <div className="space-y-4 md:space-y-6">
                            {messagesLoading ? (
                                <ResponsiveState
                                    variant="loading"
                                    compact
                                    title="جاري تحميل الرسائل"
                                    description="نستعيد الرسائل الأخيرة داخل هذه المحادثة."
                                >
                                    <div className="mt-5 w-full space-y-3">
                                        <div className="ms-auto h-20 w-[72%] animate-pulse rounded-[1.5rem] bg-primary/10" />
                                        <div className="h-24 w-[82%] animate-pulse rounded-[1.5rem] bg-white shadow-sm" />
                                        <div className="ms-auto h-16 w-[64%] animate-pulse rounded-[1.5rem] bg-primary/10" />
                                    </div>
                                </ResponsiveState>
                            ) : messages.length === 0 ? (
                                <ResponsiveState
                                    compact
                                    title="لا توجد رسائل بعد"
                                    description="اكتب أول رسالة لبدء المحادثة من هنا."
                                />
                            ) : (
                                messages.map((msg: Message) => {
                                    const isCurrentUser = msg.sender_id === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex items-end gap-2 md:gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                           {!isCurrentUser && (
                                               <Avatar src={msg.sender?.avatar_url} name={msg.sender?.name || '?'} size="sm" className="md:h-10 md:w-10 md:text-base" />
                                           )}
                                            <div className={`max-w-[85%] rounded-2xl p-3 md:max-w-lg ${isCurrentUser ? 'bg-primary text-white' : 'border bg-white'}`}>
                                                <p className="mb-1 text-sm font-bold">{msg.sender?.name || 'مستخدم'}</p>
                                                <p className="text-sm leading-7 md:text-base">{msg.content}</p>
                                                <p className={`mt-2 text-xs opacity-70 ${isCurrentUser ? 'text-left' : 'text-right'}`}>
                                                    {formatTimestamp(msg.created_at)}
                                                </p>
                                    </div>
                                </div>
                                    );
                                })
                            )}
                            </div>
                        </div>
                        <div className="shrink-0 border-t bg-white px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-4 md:py-4 md:pb-4">
                           <MessageComposer 
                               key={selectedConversation.id} 
                               onSendMessage={handleSendMessage}
                               templates={templates}
                               onUpdateTemplates={setTemplates}
                           />
                        </div>
                    </>
                ) : (
                    <div className="hidden h-full flex-col items-center justify-center p-8 text-center text-gray-500 md:flex">
                        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mb-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <h2 className="text-xl font-semibold mb-1">حدد محادثة</h2>
                        <p>اختر محادثة من القائمة لعرض الرسائل هنا.</p>
                    </div>
                )}
            </div>
        </div>

        {/* New Conversation Modal */}
        {showNewConversationModal && (
            <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center md:justify-center md:p-4" onClick={() => setShowNewConversationModal(false)}>
                <div
                    className="flex h-[calc(100dvh-1rem)] w-full flex-col rounded-t-[1.75rem] bg-white shadow-xl md:h-auto md:max-h-[80vh] md:max-w-md md:rounded-2xl"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label="بدء محادثة جديدة"
                >
                    <div className="flex shrink-0 items-center justify-between border-b px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] md:px-6 md:py-5">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">بدء محادثة جديدة</h3>
                            <p className="mt-1 text-sm text-gray-500">اختر مستخدمًا لبدء محادثة مباشرة.</p>
                        </div>
                        <button
                            onClick={() => setShowNewConversationModal(false)}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-2xl font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                            aria-label="إغلاق"
                        >
                            &times;
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
                        {availableUsers.length === 0 ? (
                            <ResponsiveState
                                compact
                                title="لا يوجد مستخدمون متاحون"
                                description="عند توفر مستلمين جدد ستتمكن من بدء محادثة مباشرة من هذه النافذة."
                            />
                        ) : (
                            <div className="space-y-2">
                                {availableUsers.map(user => (
                                    <div 
                                        key={user.id} 
                                        onClick={() => handleStartConversation(user.id)}
                                        className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors hover:border-primary hover:bg-primary-light"
                                    >
                                        <Avatar src={user.avatar_url} name={user.name} size="md" />
                                        <div>
                                            <p className="font-semibold">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.role === 'sponsor' ? 'كافل' : 'عضو فريق'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default Messages;
