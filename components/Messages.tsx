import React, { useState, useMemo, useEffect } from 'react';
import { conversations, Conversation, ConversationType, messageTemplates, sponsors, orphans } from '../data';
import { GoogleGenAI } from "@google/genai";

const TemplatesModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (body: string) => void;
}> = ({ isOpen, onClose, onSelectTemplate }) => {
    if (!isOpen) return null;

    const handleSelect = (body: string) => {
        onSelectTemplate(body);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold">اختر قالب رسالة</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                </div>
                <div className="overflow-y-auto space-y-3">
                    {messageTemplates.map(template => (
                        <div key={template.id} onClick={() => handleSelect(template.body)} className="p-4 border rounded-lg hover:bg-primary-light hover:border-primary cursor-pointer transition-colors">
                            <h4 className="font-bold text-primary">{template.title}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const SmartComposer: React.FC<{ conversation: Conversation | null }> = ({ conversation }) => {
    const [promptText, setPromptText] = useState('');
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
    const [scheduledDateTime, setScheduledDateTime] = useState('');

    const isSponsor = conversation?.type === ConversationType.Sponsor;
    const participantName = conversation?.participant;

    const handleGenerateMessage = async () => {
        if (!promptText) return;
        setIsLoading(true);
        setError('');
        setGeneratedMessage('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const fullPrompt = `
                بصفتك مدير اتصالات في منظمة "ملاذ" لرعاية الأيتام، قم بصياغة رسالة احترافية وودية بناءً على الفكرة التالية. 
                الرسالة موجهة إلى "${participantName || 'المستلم'}".
                يجب أن تكون الرسالة باللغة العربية، واضحة، وخالية من الأخطاء. 
                إذا كان من المناسب، قم بتضمين متغيرات مثل {اسم_الكافل} أو {اسم_اليتيم} لتخصيص الرسالة لاحقًا.

                الفكرة: "${promptText}"
            `;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
            });
            setGeneratedMessage(response.text);
        } catch (err) {
            console.error(err);
            setError('حدث خطأ أثناء إنشاء الرسالة.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePersonalizedUpdate = async () => {
        if (!isSponsor || !participantName) return;

        setIsLoading(true);
        setError('');
        setGeneratedMessage('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const sponsor = sponsors.find(s => s.name === participantName);
            if (!sponsor) {
                setError('لم يتم العثور على بيانات الكافل.');
                setIsLoading(false);
                return;
            }

            const sponsoredOrphans = orphans.filter(o => sponsor.sponsoredOrphanIds.includes(o.id));
            if (sponsoredOrphans.length === 0) {
                 setGeneratedMessage(`شكرًا لك ${sponsor.name} على اهتمامك المستمر. لا توجد تحديثات جديدة في الوقت الحالي.`);
                 setIsLoading(false);
                 return;
            }

            const orphanUpdates = sponsoredOrphans.map(orphan => ({
                name: orphan.name,
                performance: orphan.performance,
                latestAchievements: orphan.achievements.slice(0, 2).map(ach => ({
                    title: ach.title,
                    description: ach.description,
                    date: ach.date.toLocaleDateString('ar-EG')
                }))
            }));

            const prompt = `
                بصفتك مدير علاقات الكفلاء في منظمة "ملاذ"، قم بصياغة رسالة تحديث شخصية ومؤثرة باللغة العربية للكافل "${sponsor.name}".
                استخدم البيانات التالية لتقديم لمحة عن آخر تطورات الأيتام الذين يكفلهم. يجب أن تكون الرسالة دافئة، ومشجعة، وتظهر أثر كفالته.
                
                ابدأ الرسالة بتحية مناسبة للسيد/ة ${sponsor.name}.
                اذكر أسماء الأيتام الذين يكفلهم وقدم تحديثاً مختصراً وإيجابياً عن كل واحد منهم.
                اختتم الرسالة بعبارة شكر صادقة.

                البيانات:
                ${JSON.stringify(orphanUpdates, null, 2)}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setGeneratedMessage(response.text);

        } catch (err) {
            console.error(err);
            setError('حدث خطأ أثناء إنشاء التحديث الشخصي.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRefineMessage = async (modification: string) => {
        if (!generatedMessage) return;
        setIsLoading(true);
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const fullPrompt = `
                أعد صياغة الرسالة التالية لتكون "${modification}". حافظ على الفكرة الأساسية واحرص على بقاء اللغة العربية سليمة واحترافية.
                
                الرسالة الحالية:
                "${generatedMessage}"
            `;
             const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
            });
            setGeneratedMessage(response.text);
        } catch (err) {
            console.error(err);
            setError('حدث خطأ أثناء تعديل الرسالة.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (scheduledDateTime) {
            alert(`(محاكاة) تم جدولة الرسالة:\n"${generatedMessage}"\nللإرسال في ${new Date(scheduledDateTime).toLocaleString('ar-EG')}`);
        } else {
            alert(`(محاكاة) تم إرسال الرسالة:\n"${generatedMessage}"`);
        }
        handleReset();
    };

    const handleSelectTemplate = (body: string) => {
        setGeneratedMessage(body);
    };



    const handleReset = () => {
        setGeneratedMessage('');
        setPromptText('');
        setScheduledDateTime('');
        setError('');
    };

    return (
        <>
            <form onSubmit={handleSendMessage} className="space-y-3">
                 {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</div>}
                 
                 {!generatedMessage && !isLoading && isSponsor && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center space-y-2">
                        <p className="text-sm font-semibold text-blue-800">تواصل أسرع مع الكفيل "{participantName}"</p>
                        <button
                            type="button"
                            onClick={handleGeneratePersonalizedUpdate}
                            className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold flex-shrink-0 flex items-center gap-2 justify-center text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                            <span>إنشاء مسودة تحديث عن الأيتام</span>
                        </button>
                        <p className="text-xs text-gray-500">- أو -</p>
                    </div>
                )}
                 
                 {!generatedMessage && !isLoading && (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            placeholder={isSponsor ? "اكتب فكرة رسالة عامة هنا..." : "اكتب فكرة الرسالة هنا..."}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
                            onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGenerateMessage(); } }}
                        />
                        <button
                            type="button"
                            onClick={handleGenerateMessage}
                            disabled={!promptText}
                            className="py-2 px-3 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold flex-shrink-0 flex items-center gap-2 disabled:bg-primary/50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                            إنشاء
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsTemplatesModalOpen(true)}
                            title="استخدام قالب"
                            className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        </button>
                    </div>
                )}
                {isLoading && (
                    <div className="flex items-center justify-center gap-2 text-gray-500 p-4">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>جاري الكتابة بالذكاء الاصطناعي...</span>
                    </div>
                )}
                {generatedMessage && !isLoading && (
                     <div className="space-y-3">
                        <textarea 
                            value={generatedMessage}
                            onChange={(e) => setGeneratedMessage(e.target.value)}
                            className="w-full h-24 p-3 border rounded-lg resize-y bg-gray-50/80"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-gray-600">تعديل الأسلوب:</span>
                            {['أكثر رسمية', 'أكثر وداً', 'أقصر'].map(tone => (
                                <button key={tone} type="button" onClick={() => handleRefineMessage(tone)} className="text-xs font-semibold py-1 px-2.5 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300">
                                    {tone}
                                </button>
                            ))}
                            <button type="button" onClick={handleReset} className="text-xs font-semibold text-red-600 hover:text-red-800 mr-auto">
                                البدء من جديد
                            </button>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                <span className="font-semibold text-gray-700">جدولة الإرسال (اختياري)</span>
                                <input 
                                    type="datetime-local" 
                                    value={scheduledDateTime}
                                    onChange={(e) => setScheduledDateTime(e.target.value)}
                                    className="mr-auto bg-white border border-gray-300 rounded-md p-1 text-sm"
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </label>
                        </div>
                        <button type="submit" className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold">
                            {scheduledDateTime ? `جدولة (${new Date(scheduledDateTime).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })})` : 'إرسال'}
                        </button>
                    </div>
                )}
            </form>
            <TemplatesModal 
                isOpen={isTemplatesModalOpen}
                onClose={() => setIsTemplatesModalOpen(false)}
                onSelectTemplate={handleSelectTemplate}
            />
        </>
    );
};


const Messages: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<ConversationType | 'الكل'>('الكل');
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    
    useEffect(() => {
        const isSelectedVisible = conversations.some(c => c.id === selectedConversationId && (activeTab === 'الكل' || c.type === activeTab));
        if (!isSelectedVisible) {
            setSelectedConversationId(null);
        }
    }, [activeTab, selectedConversationId]);

    const filteredConversations = useMemo(() => {
        return conversations
            .filter(c => {
                const matchesTab = activeTab === 'الكل' || c.type === activeTab;
                const matchesSearch = c.participant.toLowerCase().includes(searchQuery.toLowerCase()) || c.subject.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesTab && matchesSearch;
            })
            .sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0) || new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()); // Simplified timestamp sort
    }, [searchQuery, activeTab]);

    const selectedConversation = useMemo(() => {
        if (!selectedConversationId) return null;
        return conversations.find(c => c.id === selectedConversationId);
    }, [selectedConversationId]);
    
    const renderAvatar = (conv: Conversation) => {
        if (conv.participantAvatar) {
            return <img src={conv.participantAvatar} alt={conv.participant} className="w-12 h-12 rounded-full object-cover" />;
        }
        if (conv.type === ConversationType.System) {
             return (
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
            );
        }
        return (
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-primary-text font-bold text-xl">
                {conv.participant.charAt(0)}
            </div>
        );
    }
    
    return (
        <div className="flex h-full max-h-[calc(100vh-120px)] bg-bg-card rounded-xl shadow-md overflow-hidden border">
            <div className={`w-full md:w-2/5 lg:w-1/3 border-l border-gray-200 flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b">
                    <div className="relative">
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
                </div>
                <div className="p-2 border-b flex items-center gap-2 flex-wrap">
                    {(['الكل', ConversationType.Sponsor, ConversationType.Team, ConversationType.System] as const).map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="overflow-y-auto flex-1">
                    {filteredConversations.map(conv => (
                        <div 
                            key={conv.id}
                            onClick={() => setSelectedConversationId(conv.id)}
                            className={`p-4 flex items-start gap-4 cursor-pointer border-b transition-colors ${selectedConversationId === conv.id ? 'bg-primary-light' : 'hover:bg-gray-50'}`}
                        >
                           {renderAvatar(conv)}
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 truncate">{conv.participant}</h3>
                                    {conv.unread && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 ml-2"></span>}
                                </div>
                                <p className="text-sm font-semibold text-gray-600 truncate">{conv.subject}</p>
                                <p className="text-sm text-gray-500 truncate">{conv.lastMessagePreview}</p>
                            </div>
                        </div>
                    ))}
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
                                <h2 className="font-bold text-lg">{selectedConversation.participant}</h2>
                                <p className="text-sm text-gray-600">{selectedConversation.subject}</p>
                            </div>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50/50">
                            {selectedConversation.messages.map(msg => (
                                <div key={msg.id} className={`flex items-start gap-3 ${msg.sender !== 'مدير النظام' ? '' : 'flex-row-reverse'}`}>
                                   {msg.sender !== 'مدير النظام' && (msg.avatar ? <img src={msg.avatar} alt={msg.sender} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary-text font-bold text-lg">{msg.sender.charAt(0)}</div>)}
                                    <div className={`max-w-lg p-3 rounded-xl ${msg.sender !== 'مدير النظام' ? 'bg-white border' : 'bg-primary text-white'}`}>
                                        <p className="font-bold text-sm mb-1">{msg.sender}</p>
                                        <p className="text-base leading-relaxed">{msg.text}</p>
                                        <p className={`text-xs mt-2 opacity-70 ${msg.sender !== 'مدير النظام' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t bg-white">
                           <SmartComposer key={selectedConversation.id} conversation={selectedConversation} />
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
    );
};

export default Messages;
