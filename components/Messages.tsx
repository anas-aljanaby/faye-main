import React, { useState, useMemo, useEffect } from 'react';
import { messageTemplates, MessageTemplate } from '../data';
import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';
import { Conversation, Message } from '../types';
import { findOrCreateConversation, formatTimestamp } from '../utils/messaging';
import { supabase } from '../lib/supabase';

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

    const handleSelect = (body: string) => {
        onSelectTemplate(body);
        onClose();
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold">قوالب الرسائل</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAddNew}
                            className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold text-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                            إضافة قالب جديد
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                    </div>
                </div>
                <div className="overflow-y-auto space-y-3 flex-1">
                    {(isAddingNew || editingTemplate) ? (
                        <div className="p-4 border-2 border-primary rounded-lg bg-gray-50">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">عنوان القالب</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        placeholder="عنوان القالب..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">محتوى القالب</label>
                                    <textarea
                                        value={editBody}
                                        onChange={(e) => setEditBody(e.target.value)}
                                        placeholder="محتوى القالب..."
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-y"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={handleCancel}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={!editTitle.trim() || !editBody.trim()}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        حفظ
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                    {templates.map(template => (
                        <div key={template.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
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
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="تعديل"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
    );
};


const MessageComposer: React.FC<{ 
    conversation: Conversation | null;
    onSendMessage: (content: string) => Promise<void>;
    templates: MessageTemplate[];
    onUpdateTemplates: (templates: MessageTemplate[]) => void;
}> = ({ conversation, onSendMessage, templates, onUpdateTemplates }) => {
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
                {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</div>}
                
                <div className="flex items-center gap-2">
                    <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="اكتب رسالتك هنا..."
                        rows={3}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-y"
                    />
                    <button
                        type="button"
                        onClick={() => setIsTemplatesModalOpen(true)}
                        title="استخدام قالب"
                        className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex-shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </button>
                    <button
                        type="submit"
                        disabled={!messageText.trim()}
                        className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold flex-shrink-0 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                        إرسال
                    </button>
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
    
    const { conversations, loading: conversationsLoading, refetch: refetchConversations } = useConversations();
    const { messages, loading: messagesLoading, sendMessage } = useMessages(selectedConversationId);
    const { userProfile, user } = useAuth();

    // Fetch available users for starting new conversations
    useEffect(() => {
        const fetchAvailableUsers = async () => {
            if (!userProfile || !user) return;

            const { data, error } = await supabase
                .from('user_profiles')
                .select('id, name, avatar_url, role')
                .eq('organization_id', userProfile.organization_id)
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
        if (conv.participant?.avatar_url) {
            return <img src={conv.participant.avatar_url} alt={conv.participant.name} className="w-12 h-12 rounded-full object-cover" />;
        }
        return (
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold text-xl">
                {conv.participant?.name?.charAt(0) || '?'}
            </div>
        );
    }
    
    return (
        <>
        <div className="flex h-full max-h-[calc(100vh-120px)] bg-bg-card rounded-xl shadow-md overflow-hidden border">
            <div className={`w-full md:w-2/5 lg:w-1/3 border-l border-gray-200 flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b flex items-center gap-2">
                    <div className="relative flex-1">
                         <div className="absolute pointer-events-none right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="بحث في الرسائل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <button
                        onClick={() => setShowNewConversationModal(true)}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                        title="بدء محادثة جديدة"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </button>
                </div>
                <div className="overflow-y-auto flex-1">
                    {conversationsLoading ? (
                        <div className="p-4 text-center text-gray-500">جاري التحميل...</div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">لا توجد محادثات</div>
                    ) : (
                        filteredConversations.map(conv => (
                            <div 
                                key={conv.id}
                                onClick={() => setSelectedConversationId(conv.id)}
                                className={`p-4 flex items-start gap-4 cursor-pointer border-b transition-colors ${selectedConversationId === conv.id ? 'bg-primary-light' : 'hover:bg-gray-50'}`}
                            >
                               {renderAvatar(conv)}
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-gray-800 truncate">{conv.participant?.name || 'مستخدم'}</h3>
                                        {conv.unread_count && conv.unread_count > 0 && (
                                            <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ml-2">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        {conv.last_message?.content || 'لا توجد رسائل'}
                                    </p>
                                    {conv.last_message_at && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatTimestamp(conv.last_message_at)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div className={`flex-1 flex-col ${selectedConversationId ? 'flex' : 'hidden md:flex'}`}>
                {selectedConversation ? (
                    <>
                        <div className="p-4 border-b flex items-center gap-3">
                           <button 
                                onClick={() => setSelectedConversationId(null)}
                                className="md:hidden p-1 text-gray-600 hover:text-primary rounded-full hover:bg-gray-100"
                                aria-label="الرجوع إلى قائمة المحادثات"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                           </button>
                           {renderAvatar(selectedConversation)}
                            <div>
                                <h2 className="font-bold text-lg">{selectedConversation.participant?.name || 'مستخدم'}</h2>
                                <p className="text-sm text-gray-600">{selectedConversation.participant?.role === 'sponsor' ? 'كافل' : 'عضو فريق'}</p>
                            </div>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50/50">
                            {messagesLoading ? (
                                <div className="text-center text-gray-500">جاري تحميل الرسائل...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-gray-500">لا توجد رسائل بعد</div>
                            ) : (
                                messages.map((msg: Message) => {
                                    const isCurrentUser = msg.sender_id === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                           {!isCurrentUser && (
                                               msg.sender?.avatar_url ? (
                                                   <img src={msg.sender.avatar_url} alt={msg.sender.name} className="w-10 h-10 rounded-full" />
                                               ) : (
                                                   <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold text-lg">
                                                       {msg.sender?.name?.charAt(0) || '?'}
                                                   </div>
                                               )
                                           )}
                                            <div className={`max-w-lg p-3 rounded-xl ${isCurrentUser ? 'bg-primary text-white' : 'bg-white border'}`}>
                                                <p className="font-bold text-sm mb-1">{msg.sender?.name || 'مستخدم'}</p>
                                                <p className="text-base leading-relaxed">{msg.content}</p>
                                                <p className={`text-xs mt-2 opacity-70 ${isCurrentUser ? 'text-left' : 'text-right'}`}>
                                                    {formatTimestamp(msg.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="p-4 border-t bg-white">
                           <MessageComposer 
                               key={selectedConversation.id} 
                               conversation={selectedConversation}
                               onSendMessage={handleSendMessage}
                               templates={templates}
                               onUpdateTemplates={setTemplates}
                           />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mb-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <h2 className="text-xl font-semibold mb-1">حدد محادثة</h2>
                        <p>اختر محادثة من القائمة لعرض الرسائل هنا.</p>
                    </div>
                )}
            </div>
        </div>

        {/* New Conversation Modal */}
        {showNewConversationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewConversationModal(false)}>
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 className="text-xl font-bold">بدء محادثة جديدة</h3>
                        <button onClick={() => setShowNewConversationModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                    </div>
                    <div className="overflow-y-auto space-y-2">
                        {availableUsers.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">لا يوجد مستخدمون متاحون</div>
                        ) : (
                            availableUsers.map(user => (
                                <div 
                                    key={user.id} 
                                    onClick={() => handleStartConversation(user.id)}
                                    className="p-3 border rounded-lg hover:bg-primary-light hover:border-primary cursor-pointer transition-colors flex items-center gap-3"
                                >
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.role === 'sponsor' ? 'كافل' : 'عضو فريق'}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default Messages;
