import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useOrphans } from '../hooks/useOrphans';
import { useSponsors } from '../hooks/useSponsors';
import { useAuth } from '../contexts/AuthContext';
import { findById } from '../utils/idMapper';
import { Task } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { AvatarUpload } from './AvatarUpload';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';


const BellIcon: React.FC<{ count: number }> = ({ count }) => (
    <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 && <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">{count}</span>}
    </div>
);

const AddTaskModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (title: string) => void;
  day: Date | null;
}> = ({ isOpen, onClose, onAddTask, day }) => {
  const [taskTitle, setTaskTitle] = useState('');

  if (!isOpen || !day) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      onAddTask(taskTitle.trim());
      setTaskTitle('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-2 text-text-primary">إضافة مهمة جديدة</h3>
        <p className="text-text-secondary mb-6">
          ليوم {day.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="عنوان المهمة..."
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary focus:border-primary transition"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 transition-colors font-semibold">
              إلغاء
            </button>
            <button type="submit" className="py-2 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold">
              إضافة المهمة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const TeamMemberPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { teamMembers: teamMembersData, loading: teamMembersLoading, refetch: refetchTeamMembers } = useTeamMembers();
  const { orphans: orphansData, refetch: refetchOrphans } = useOrphans();
  const { sponsors: sponsorsData, refetch: refetchSponsors } = useSponsors();
  const { userProfile, canEditOrphans, canEditSponsors, isManager } = useAuth();
  const member = useMemo(() => findById(teamMembersData, id || ''), [teamMembersData, id]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dayForNewTask, setDayForNewTask] = useState<Date | null>(null);
  const assignedOrphansRef = useRef<HTMLDivElement>(null);
  const [showAssignOrphansModal, setShowAssignOrphansModal] = useState(false);
  const [showAssignSponsorsModal, setShowAssignSponsorsModal] = useState(false);
  const [assignedOrphanIds, setAssignedOrphanIds] = useState<string[]>([]);
  const [assignedSponsorIds, setAssignedSponsorIds] = useState<string[]>([]);

  const [suggestions, setSuggestions] = useState<{ orphanId: number; orphanName: string; suggestionText: string; }[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState('');

  useEffect(() => {
    if (member?.tasks) {
      setTasks(member.tasks);
    }
  }, [member]);

  // Fetch assigned orphans for this team member
  useEffect(() => {
    const fetchAssignedOrphans = async () => {
      if (!member?.uuid) return;

      try {
        const { data } = await supabase
          .from('team_member_orphans')
          .select('orphan_id')
          .eq('team_member_id', member.uuid);

        if (data) {
          setAssignedOrphanIds(data.map(item => item.orphan_id));
        }
      } catch (err) {
        console.error('Error fetching assigned orphans:', err);
      }
    };

    fetchAssignedOrphans();
  }, [member]);

  // Fetch assigned sponsors for this team member
  useEffect(() => {
    const fetchAssignedSponsors = async () => {
      if (!member?.uuid) return;

      try {
        const { data } = await supabase
          .from('sponsor_team_members')
          .select('sponsor_id')
          .eq('team_member_id', member.uuid);

        if (data) {
          setAssignedSponsorIds(data.map(item => item.sponsor_id));
        }
      } catch (err) {
        console.error('Error fetching assigned sponsors:', err);
      }
    };

    fetchAssignedSponsors();
  }, [member]);

  // Team members can see assigned orphans
  const assignedOrphans = useMemo(() => {
    if (!member || assignedOrphanIds.length === 0) return [];
    return orphansData.filter(o => assignedOrphanIds.includes(o.uuid || ''));
  }, [member, orphansData, assignedOrphanIds]);

  const canAssign = useMemo(() => {
    return isManager() || canEditSponsors() || canEditOrphans();
  }, [isManager, canEditSponsors, canEditOrphans]);

  const pendingTasks = useMemo(() => tasks.filter(task => !task.completed), [tasks]);

  const tasksByDay = useMemo(() => {
      const map = new Map<number, Task[]>();
      tasks.forEach(task => {
          if (task.dueDate.getMonth() === currentDate.getMonth() && task.dueDate.getFullYear() === currentDate.getFullYear()) {
              const day = task.dueDate.getDate();
              if (!map.has(day)) map.set(day, []);
              map.get(day)?.push(task);
          }
      });
      return map;
  }, [tasks, currentDate]);

  const tasksForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter(task => 
        task.dueDate.getFullYear() === selectedDate.getFullYear() &&
        task.dueDate.getMonth() === selectedDate.getMonth() &&
        task.dueDate.getDate() === selectedDate.getDate()
    );
  }, [tasks, selectedDate]);

  // Early returns must come AFTER all hooks
  if (teamMembersLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!member) {
    return <div className="text-center text-red-500">لم يتم العثور على عضو الفريق.</div>;
  }

  const toggleTask = (taskId: number) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
  };

  const handleAddTask = (title: string) => {
    if (dayForNewTask) {
        const newTask: Task = {
            id: Date.now(),
            title,
            dueDate: dayForNewTask,
            completed: false,
        };
        setTasks(prevTasks => [...prevTasks, newTask]);
    }
  };
  
    const addTaskFromSuggestion = (suggestion: { orphanId: number; suggestionText: string; }) => {
        const newTask: Task = {
            id: Date.now(),
            title: suggestion.suggestionText,
            dueDate: new Date(), // Default to today
            completed: false,
            orphanId: suggestion.orphanId
        };
        setTasks(prevTasks => [newTask, ...prevTasks].sort((a,b) => b.dueDate.getTime() - a.dueDate.getTime()));
        setSuggestions(prev => prev.filter(s => s.suggestionText !== suggestion.suggestionText));
    };


    const handleGenerateSuggestions = async () => {
        setIsLoadingSuggestions(true);
        setSuggestionsError('');
        setSuggestions([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const today = new Date();
            const oneMonthFromNow = new Date();
            oneMonthFromNow.setMonth(today.getMonth() + 1);

            const relevantOrphanData = assignedOrphans.map(o => ({
                id: o.id,
                name: o.name,
                performance: o.performance,
                upcomingOccasions: o.specialOccasions
                    .filter(occ => occ.date >= today && occ.date <= oneMonthFromNow)
                    .map(occ => ({ title: occ.title, date: occ.date.toISOString().split('T')[0] })),
                overduePayments: o.payments.filter(p => p.status === 'متأخر').length > 0
            }));
            
            if (relevantOrphanData.length === 0) {
                 setSuggestionsError('لا يوجد أيتام معينون لهذا العضو لإنشاء اقتراحات.');
                 setIsLoadingSuggestions(false);
                 return;
            }

            const prompt = `
                أنت مساعد ذكي لفريق العمل في منظمة "فيء" لرعاية الأيتام.
                بناءً على البيانات التالية عن الأيتام، قم باقتراح ٣ مهام استباقية وذكية لعضو الفريق كحد أقصى.

                البيانات: ${JSON.stringify(relevantOrphanData)}

                اقتراحاتك يجب أن تكون:
                1. قابلة للتنفيذ (Actionable).
                2. مرتبطة بيتيم محدد.
                3. تركز على الجوانب التالية:
                    - انخفاض المستوى الدراسي (مثلاً: أداء "جيد" أو أقل).
                    - المناسبات القادمة (مثل أعياد الميلاد).
                    - المشاكل المالية (مثل الدفعات المتأخرة).

                أمثلة على الاقتراحات المطلوبة:
                - "عيد ميلاد [اسم اليتيم] بتاريخ [التاريخ]. نقترح التخطيط لهدية بسيطة."
                - "لوحظ انخفاض في مستوى [اسم اليتيم] الدراسي. نقترح جدولة زيارة لولي أمره."
                - "توجد دفعة كفالة متأخرة لـ [اسم اليتيم]. نقترح التواصل مع الكافل للمتابعة."

                أرجع النتائج فقط بصيغة JSON.
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                orphanId: { type: Type.NUMBER },
                                orphanName: { type: Type.STRING },
                                suggestionText: { type: Type.STRING }
                            },
                            required: ["orphanId", "orphanName", "suggestionText"]
                        }
                    }
                }
            });

            const jsonResponse = JSON.parse(response.text);
            setSuggestions(jsonResponse);

        } catch (err) {
            console.error(err);
            setSuggestionsError('حدث خطأ أثناء إنشاء الاقتراحات. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsLoadingSuggestions(false);
        }
    };


  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

  const changeMonth = (offset: number) => {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
      setSelectedDate(null);
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setDayForNewTask(clickedDate);
    setIsModalOpen(true);
  };


  return (
    <>
    <AddTaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={handleAddTask}
        day={dayForNewTask}
    />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-bg-card p-6 rounded-xl shadow-md flex items-center gap-6">
            {member.uuid ? (
              <AvatarUpload
                currentAvatarUrl={member.avatarUrl}
                userId={member.uuid}
                type="team_member"
                onUploadComplete={(newUrl) => {
                  // Refresh team members to get updated avatar
                  window.location.reload();
                }}
              />
            ) : (
              <Avatar src={member.avatarUrl} name={member.name} size="xl" className="!w-20 !h-20 !text-3xl" />
            )}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">{member.name}</h1>
                <p className="text-text-secondary">عضو فريق العمل</p>
            </div>
            <div className="ms-auto">
                <BellIcon count={pendingTasks.length} />
            </div>
        </div>
        
        <div className="bg-bg-card p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4">المهام المستحقة ({pendingTasks.length})</h2>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {pendingTasks.length > 0 ? pendingTasks.map(task => (
              <div key={task.id} className="flex items-center bg-gray-50 p-3 rounded-lg">
                <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary me-3" />
                <label htmlFor={`task-${task.id}`} className="flex-grow text-gray-700">{task.title}</label>
                <span className="text-sm text-text-secondary">{task.dueDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
              </div>
            )) : <p className="text-text-secondary text-center py-4">لا توجد مهام مستحقة.</p>}
          </div>
        </div>

        <div className="bg-bg-card p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">مهام واقتراحات ذكية</h2>
                <button
                    onClick={handleGenerateSuggestions}
                    disabled={isLoadingSuggestions}
                    className="bg-primary-light text-primary font-semibold py-2 px-4 rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    {isLoadingSuggestions ? (
                         <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>جاري التحليل...</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                            <span>إنشاء اقتراحات</span>
                        </>
                    )}
                </button>
            </div>
             {isLoadingSuggestions && <div className="text-center text-gray-500 py-4">جاري تحليل البيانات واقتراح المهام...</div>}
             {suggestionsError && <div className="text-center text-red-600 bg-red-50 p-3 rounded-md">{suggestionsError}</div>}
             {!isLoadingSuggestions && suggestions.length === 0 && !suggestionsError && (
                 <p className="text-text-secondary text-center py-4">انقر على الزر لتلقي اقتراحات مهام ذكية بناءً على حالة الأيتام.</p>
            )}
            {suggestions.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {suggestions.map((s, index) => (
                        <div key={index} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <div className="flex items-center gap-3">
                                <div className="text-yellow-600 flex-shrink-0">
                                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.09 16.05 19.5 20.5"/><path d="M6.12 6.12a9 9 0 0 0 11.76 11.76"/><path d="M17.88 17.88a9 9 0 0 0-11.76-11.76"/><path d="m3.5 7.5.01-.01"/><path d="m20.5 16.5.01-.01"/><path d="M12 2a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4v0a4 4 0 0 0 4-4v0a4 4 0 0 0-4-4Z"/><path d="M12 12a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4v0a4 4 0 0 0 4-4v0a4 4 0 0 0-4-4Z"/></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{s.suggestionText}</p>
                                    <Link to={`/orphan/${s.orphanId}`} className="text-xs text-primary hover:underline">{s.orphanName}</Link>
                                </div>
                            </div>
                            <button 
                                onClick={() => addTaskFromSuggestion(s)}
                                className="text-xs font-semibold py-1.5 px-3 bg-primary-light text-primary rounded-full hover:bg-primary hover:text-white transition-colors flex-shrink-0"
                                title="إضافة هذه المهمة إلى قائمتك"
                            >
                                + إضافة للمهام
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div ref={assignedOrphansRef} className="bg-bg-card p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">الأيتام قيد المتابعة</h2>
                {canAssign && (
                    <button
                        onClick={() => setShowAssignOrphansModal(true)}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold text-sm flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        تعيين أيتام
                    </button>
                )}
            </div>
            <div className="space-y-4">
                {assignedOrphans.length > 0 ? (
                    assignedOrphans.map(orphan => (
                    <Link to={`/orphan/${orphan.id}`} key={orphan.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <Avatar src={orphan.photoUrl} name={orphan.name} size="lg" className="me-4" />
                        <p className="font-semibold text-gray-800">{orphan.name}</p>
                    </Link>
                    ))
                ) : (
                    <p className="text-text-secondary text-center py-4">لا يوجد أيتام معينون</p>
                )}
            </div>
        </div>

        {/* Assigned Sponsors Section */}
        {canAssign && (
            <div className="bg-bg-card p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700">الكفلاء المعينون</h2>
                    <button
                        onClick={() => setShowAssignSponsorsModal(true)}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold text-sm flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        تعيين كفلاء
                    </button>
                </div>
                <div className="space-y-4">
                    {assignedSponsorIds.length > 0 ? (
                        sponsorsData
                            .filter(s => s.uuid && assignedSponsorIds.includes(s.uuid))
                            .map(sponsor => (
                                <Link to={`/sponsor/${sponsor.id}`} key={sponsor.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                    <Avatar src={sponsor.avatarUrl} name={sponsor.name} size="lg" className="me-4" />
                                    <p className="font-semibold text-gray-800">{sponsor.name}</p>
                                </Link>
                            ))
                    ) : (
                        <p className="text-text-secondary text-center py-4">لا يوجد كفلاء معينون</p>
                    )}
                </div>
            </div>
        )}

      </div>
      
      <div className="space-y-6">
        <div className="bg-bg-card p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
            <h2 className="text-xl font-bold text-gray-700">{monthName}</h2>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm text-text-secondary mb-2">
            {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
            {Array.from({ length: daysInMonth }).map((_, day) => {
              const dayNumber = day + 1;
              const tasksForDay = tasksByDay.get(dayNumber);
              const isToday = new Date().getDate() === dayNumber && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
              const isSelected = selectedDate?.getDate() === dayNumber && selectedDate?.getMonth() === currentDate.getMonth() && selectedDate?.getFullYear() === currentDate.getFullYear();
              
              return (
                <div 
                  key={dayNumber} 
                  onClick={() => handleDayClick(dayNumber)}
                  className={`h-10 flex items-center justify-center rounded-lg relative cursor-pointer transition-all duration-200 font-semibold ${isSelected ? 'bg-primary text-white' : isToday ? 'bg-primary-light text-primary' : 'hover:bg-gray-100'}`}
                >
                  {dayNumber}
                  {tasksForDay && tasksForDay.length > 0 && <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${tasksForDay.some(t => !t.completed) ? 'bg-red-500' : 'bg-green-500'}`}></span>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-bg-card p-6 rounded-xl shadow-md min-h-[180px]">
           <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">
            {selectedDate ? `مهام يوم ${selectedDate.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric' })}` : 'حدد يوماً لعرض المهام'}
           </h3>
           <div className="space-y-3">
                {selectedDate && tasksForSelectedDay.length > 0 ? (
                    tasksForSelectedDay.map(task => (
                        <div key={task.id} className="flex items-center text-sm">
                            <span className={`w-2 h-2 rounded-full me-3 ${task.completed ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                            <p className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>{task.title}</p>
                        </div>
                    ))
                ) : selectedDate ? (
                     <p className="text-center text-text-secondary py-4">لا توجد مهام لهذا اليوم.</p>
                ) : (
                    <p className="text-center text-text-secondary py-4">الرجاء تحديد يوم من التقويم.</p>
                )}
           </div>
        </div>
      </div>
    </div>
    
    {/* Mobile Action Bar */}
    <div className="mobile-action-bar sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-2 grid grid-cols-5 gap-1 text-center z-40">
        <button onClick={() => navigate(-1)} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            <span className="text-xs">رجوع</span>
        </button>
        <button onClick={() => { setDayForNewTask(new Date()); setIsModalOpen(true); }} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            <span className="text-xs">إضافة مهمة</span>
        </button>
        <button onClick={handleGenerateSuggestions} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            <span className="text-xs">اقتراحات</span>
        </button>
        <button onClick={() => assignedOrphansRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span className="text-xs">الأيتام</span>
        </button>
        <button onClick={() => navigate('/messages')} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span className="text-xs">رسالة</span>
        </button>
    </div>

    {/* Assign Orphans Modal */}
    {showAssignOrphansModal && member && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAssignOrphansModal(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold">تعيين أيتام لـ {member.name}</h3>
                    <button onClick={() => setShowAssignOrphansModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                </div>
                <div className="overflow-y-auto space-y-2 flex-1">
                    {orphansData.map(orphan => {
                        const isAssigned = assignedOrphanIds.includes(orphan.uuid || '');
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
                                        if (!member.uuid || !orphan.uuid) return;
                                        
                                        try {
                                            if (isAssigned) {
                                                // Remove assignment
                                                const { error } = await supabase
                                                    .from('team_member_orphans')
                                                    .delete()
                                                    .eq('team_member_id', member.uuid)
                                                    .eq('orphan_id', orphan.uuid);
                                                
                                                if (!error) {
                                                    setAssignedOrphanIds(prev => prev.filter(id => id !== orphan.uuid));
                                                }
                                            } else {
                                                // Add assignment
                                                const { error } = await supabase
                                                    .from('team_member_orphans')
                                                    .insert({
                                                        team_member_id: member.uuid,
                                                        orphan_id: orphan.uuid
                                                    });
                                                
                                                if (!error) {
                                                    setAssignedOrphanIds(prev => [...prev, orphan.uuid!]);
                                                }
                                            }
                                            refetchOrphans();
                                        } catch (err) {
                                            console.error('Error updating orphan assignment:', err);
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
            </div>
        </div>
    )}

    {/* Assign Sponsors Modal */}
    {showAssignSponsorsModal && member && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAssignSponsorsModal(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold">تعيين كفلاء لـ {member.name}</h3>
                    <button onClick={() => setShowAssignSponsorsModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                </div>
                <div className="overflow-y-auto space-y-2 flex-1">
                    {sponsorsData.map(sponsor => {
                        const isAssigned = sponsor.uuid && assignedSponsorIds.includes(sponsor.uuid);
                        return (
                            <div 
                                key={sponsor.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar src={sponsor.avatarUrl} name={sponsor.name} size="md" />
                                    <div>
                                        <p className="font-semibold">{sponsor.name}</p>
                                        <p className="text-sm text-gray-500">يكفل {sponsor.sponsoredOrphanIds.length} يتيم</p>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!member.uuid || !sponsor.uuid) return;
                                        
                                        try {
                                            if (isAssigned) {
                                                // Remove assignment
                                                const { error } = await supabase
                                                    .from('sponsor_team_members')
                                                    .delete()
                                                    .eq('team_member_id', member.uuid)
                                                    .eq('sponsor_id', sponsor.uuid);
                                                
                                                if (!error) {
                                                    setAssignedSponsorIds(prev => prev.filter(id => id !== sponsor.uuid));
                                                }
                                            } else {
                                                // Add assignment
                                                const { error } = await supabase
                                                    .from('sponsor_team_members')
                                                    .insert({
                                                        team_member_id: member.uuid,
                                                        sponsor_id: sponsor.uuid
                                                    });
                                                
                                                if (!error) {
                                                    setAssignedSponsorIds(prev => [...prev, sponsor.uuid!]);
                                                }
                                            }
                                            refetchSponsors();
                                        } catch (err) {
                                            console.error('Error updating sponsor assignment:', err);
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
            </div>
        </div>
    )}
    </>
  );
};

export default TeamMemberPage;