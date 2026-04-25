import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useOrphansBasic } from '../hooks/useOrphans';
import { useSponsorsBasic } from '../hooks/useSponsors';
import { useAuth } from '../contexts/AuthContext';
import { findById } from '../utils/idMapper';
import { Task } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { AvatarUpload } from './AvatarUpload';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import { AccountAccessSection } from './account/AccountAccessSection';
import ResponsiveState from './ResponsiveState';

type TeamMemberPermissionSummary = {
  can_edit_orphans: boolean;
  can_edit_sponsors: boolean;
  can_edit_transactions: boolean;
  can_create_expense: boolean;
  can_approve_expense: boolean;
  can_view_financials: boolean;
  is_manager: boolean;
};

const DEFAULT_TEAM_MEMBER_PERMISSIONS: TeamMemberPermissionSummary = {
  can_edit_orphans: false,
  can_edit_sponsors: false,
  can_edit_transactions: false,
  can_create_expense: false,
  can_approve_expense: false,
  can_view_financials: false,
  is_manager: false,
};

const TEAM_MEMBER_PERMISSION_LABELS: Array<{
  key: keyof TeamMemberPermissionSummary;
  label: string;
}> = [
  { key: 'can_view_financials', label: 'عرض النظام المالي' },
  { key: 'can_edit_orphans', label: 'إدارة الأيتام' },
  { key: 'can_edit_sponsors', label: 'إدارة الكفلاء' },
  { key: 'can_create_expense', label: 'إنشاء المصروفات مباشرة' },
  { key: 'can_approve_expense', label: 'اعتماد المصروفات' },
  { key: 'can_edit_transactions', label: 'تعديل المعاملات المالية' },
  { key: 'is_manager', label: 'إدارة صلاحيات الفريق' },
];

const PermissionsSummaryCard: React.FC<{
  permissions: TeamMemberPermissionSummary;
  isOwnProfile: boolean;
}> = ({ permissions, isOwnProfile }) => {
  const enabledPermissions = TEAM_MEMBER_PERMISSION_LABELS.filter(({ key }) => permissions[key]);

  return (
    <section className="rounded-2xl bg-bg-card p-4 shadow-md md:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-700 md:text-xl">
          {isOwnProfile ? 'صلاحياتك الحالية' : 'صلاحيات عضو الفريق'}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {isOwnProfile ? 'هذه هي الصلاحيات المفعّلة لحسابك داخل المنصة.' : 'عرض للصلاحيات المفعّلة لهذا العضو.'}
        </p>
      </div>

      {enabledPermissions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {enabledPermissions.map(({ key, label }) => (
            <span
              key={key}
              className="inline-flex min-h-10 items-center rounded-full bg-primary-light px-3 py-2 text-sm font-semibold text-primary"
            >
              {label}
            </span>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-4 text-sm text-text-secondary">
          لا توجد صلاحيات إضافية مفعلة حالياً.
        </p>
      )}
    </section>
  );
};


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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4">
      <div className="flex h-[min(100dvh,32rem)] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-xl md:h-auto md:max-w-md md:rounded-2xl">
        <div className="border-b border-gray-100 px-4 py-4 md:px-6 md:py-5">
          <h3 className="text-lg font-bold text-text-primary md:text-xl">إضافة مهمة جديدة</h3>
          <p className="mt-2 text-sm leading-6 text-text-secondary md:text-base">
            ليوم {day.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="عنوان المهمة..."
              className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary md:text-base"
              autoFocus
            />
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:flex-row md:justify-end md:px-6 md:pb-4">
            <button type="button" onClick={onClose} className="min-h-12 rounded-xl bg-gray-100 px-5 py-3 font-semibold text-text-secondary transition-colors hover:bg-gray-200">
              إلغاء
            </button>
            <button type="submit" className="min-h-12 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-hover">
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
  const { teamMembers: teamMembersData, loading: teamMembersLoading } = useTeamMembers();
  const { orphans: orphansData, refetch: refetchOrphans } = useOrphansBasic();
  const { sponsors: sponsorsData, refetch: refetchSponsors } = useSponsorsBasic();
  const { userProfile, permissions, isSystemAdmin } = useAuth();
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
  const [visiblePermissions, setVisiblePermissions] = useState<TeamMemberPermissionSummary | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<{ orphanId: number; orphanName: string; suggestionText: string; }[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState('');
  const isSysAdmin = isSystemAdmin();
  const isOwnProfile = Boolean(userProfile?.id && member?.uuid && userProfile.id === member.uuid);
  const canSeeSensitiveTeamData = isSysAdmin || isOwnProfile;
  const canManageAssignments = isSysAdmin;
  const canManageProfileMedia = isSysAdmin || isOwnProfile;

  useEffect(() => {
    if (member?.tasks) {
      setTasks(member.tasks);
    }
  }, [member]);

  useEffect(() => {
    if (!member?.uuid || !canSeeSensitiveTeamData) {
      setVisiblePermissions(null);
      setPermissionsLoading(false);
      return;
    }

    if (isOwnProfile) {
      setVisiblePermissions({
        ...DEFAULT_TEAM_MEMBER_PERMISSIONS,
        ...(permissions ?? {}),
      });
      setPermissionsLoading(false);
      return;
    }

    let active = true;
    setPermissionsLoading(true);

    void supabase
      .from('user_permissions')
      .select(
        'can_edit_orphans, can_edit_sponsors, can_edit_transactions, can_create_expense, can_approve_expense, can_view_financials, is_manager'
      )
      .eq('user_id', member.uuid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          console.error('Error fetching team member permissions:', error);
          setVisiblePermissions(DEFAULT_TEAM_MEMBER_PERMISSIONS);
          return;
        }

        setVisiblePermissions({
          ...DEFAULT_TEAM_MEMBER_PERMISSIONS,
          ...(data ?? {}),
        });
      })
      .finally(() => {
        if (active) {
          setPermissionsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [canSeeSensitiveTeamData, isOwnProfile, member?.uuid, permissions]);

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
    return (
      <ResponsiveState
        variant="loading"
        title="جاري تحميل ملف عضو الفريق"
        description="نجهز المهام والتفاصيل والروابط المرتبطة بما يتناسب مع شاشة الهاتف."
      />
    );
  }

  if (!member) {
    return (
      <ResponsiveState
        variant="error"
        title="تعذر العثور على عضو الفريق"
        description="قد يكون الملف غير متاح أو أن الرابط المستخدم غير صحيح."
      />
    );
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
                أنت مساعد ذكي لفريق العمل في منظمة "يتيم" لرعاية الأيتام.
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
  };

  const openTaskModalForDate = (date: Date) => {
    setSelectedDate(date);
    setDayForNewTask(date);
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
    <div className="grid grid-cols-1 gap-4 pb-6 md:gap-6 md:pb-8 xl:grid-cols-3 xl:items-start">
      <div className="space-y-4 xl:col-span-2 xl:space-y-6">
        <div className="rounded-2xl bg-bg-card p-4 shadow-md md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  <span>رجوع</span>
                </button>
                <div className="rounded-full bg-gray-100 p-2">
                  <BellIcon count={pendingTasks.length} />
                </div>
            </div>
            <div className="flex flex-col items-start gap-4 text-start md:flex-row md:items-center">
              <div className="[&_img]:h-24 [&_img]:w-24 [&_img]:text-2xl md:[&_img]:h-32 md:[&_img]:w-32 md:[&_img]:text-3xl">
                {member.uuid && canManageProfileMedia ? (
                  <AvatarUpload
                    currentAvatarUrl={member.avatarUrl}
                    name={member.name}
                    userId={member.uuid}
                    type="team_member"
                    onUploadComplete={() => {
                      // Refresh team members to get updated avatar
                      window.location.reload();
                    }}
                    size="md"
                  />
                ) : (
                  <Avatar src={member.avatarUrl} name={member.name} size="xl" className="!h-24 !w-24 !text-2xl md:!h-32 md:!w-32 md:!text-3xl" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                  <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">{member.name}</h1>
                  <p className="text-sm text-text-secondary md:text-base">عضو فريق العمل</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    <span className="inline-flex min-h-9 items-center rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary md:text-sm">
                      {pendingTasks.length} مهام مستحقة
                    </span>
                  </div>
              </div>
              <div className="flex w-full flex-col gap-2 md:w-auto">
                <button
                  type="button"
                  onClick={() => openTaskModalForDate(selectedDate ?? new Date())}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  <span>إضافة مهمة</span>
                </button>
                <Link
                  to="/messages"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span>فتح الرسائل</span>
                </Link>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:hidden">
          <button
            type="button"
            onClick={() => openTaskModalForDate(selectedDate ?? new Date())}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            <span>إضافة مهمة</span>
          </button>
          <button
            type="button"
            onClick={handleGenerateSuggestions}
            disabled={isLoadingSuggestions}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            <span>اقتراحات ذكية</span>
          </button>
          <button
            type="button"
            onClick={() => assignedOrphansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>الأيتام</span>
          </button>
          <Link
            to="/messages"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>رسالة</span>
          </Link>
        </div>

        {canSeeSensitiveTeamData && member.uuid && (
          <AccountAccessSection profileId={member.uuid} displayName={member.name} />
        )}

        {canSeeSensitiveTeamData && (
          permissionsLoading ? (
            <div className="rounded-2xl bg-bg-card p-4 shadow-md md:p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-6 w-36 rounded bg-gray-200" />
                <div className="h-10 w-full rounded bg-gray-100" />
                <div className="h-10 w-3/4 rounded bg-gray-100" />
              </div>
            </div>
          ) : visiblePermissions ? (
            <PermissionsSummaryCard permissions={visiblePermissions} isOwnProfile={isOwnProfile} />
          ) : null
        )}
        
        <div className="rounded-2xl bg-bg-card p-4 shadow-md md:p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-700 md:text-xl">المهام المستحقة ({pendingTasks.length})</h2>
          <div className="max-h-72 space-y-3 overflow-y-auto pe-1 md:pe-2">
            {pendingTasks.length > 0 ? pendingTasks.map(task => (
              <div key={task.id} className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <input id={`task-${task.id}`} type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor={`task-${task.id}`} className="min-w-0 flex-1 text-sm text-gray-700 md:text-base">{task.title}</label>
                </div>
                <span className="text-xs font-medium text-text-secondary md:text-sm">{task.dueDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
              </div>
            )) : <p className="text-text-secondary text-center py-4">لا توجد مهام مستحقة.</p>}
          </div>
        </div>

        <div className="rounded-2xl bg-bg-card p-4 shadow-md md:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-gray-700 md:text-xl">مهام واقتراحات ذكية</h2>
                <button
                    onClick={handleGenerateSuggestions}
                    disabled={isLoadingSuggestions}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-light px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 sm:w-auto"
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
                <div className="max-h-80 space-y-3 overflow-y-auto pe-1 md:pe-2">
                    {suggestions.map((s, index) => (
                        <div key={index} className="flex flex-col gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 md:p-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="text-yellow-600 flex-shrink-0">
                                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.09 16.05 19.5 20.5"/><path d="M6.12 6.12a9 9 0 0 0 11.76 11.76"/><path d="M17.88 17.88a9 9 0 0 0-11.76-11.76"/><path d="m3.5 7.5.01-.01"/><path d="m20.5 16.5.01-.01"/><path d="M12 2a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4v0a4 4 0 0 0 4-4v0a4 4 0 0 0-4-4Z"/><path d="M12 12a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4v0a4 4 0 0 0 4-4v0a4 4 0 0 0-4-4Z"/></svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold leading-6 text-gray-800">{s.suggestionText}</p>
                                    <Link to={`/orphan/${s.orphanId}`} className="text-xs text-primary hover:underline">{s.orphanName}</Link>
                                </div>
                            </div>
                            <button 
                                onClick={() => addTaskFromSuggestion(s)}
                                className="min-h-11 w-full rounded-full bg-primary-light px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white lg:w-auto lg:flex-shrink-0"
                                title="إضافة هذه المهمة إلى قائمتك"
                            >
                                + إضافة للمهام
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div ref={assignedOrphansRef} className="rounded-2xl bg-bg-card p-4 shadow-md md:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-gray-700 md:text-xl">الأيتام قيد المتابعة</h2>
                {canManageAssignments && (
                    <button
                        onClick={() => setShowAssignOrphansModal(true)}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:w-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        تعيين أيتام
                    </button>
                )}
            </div>
            <div className="space-y-4">
                {assignedOrphans.length > 0 ? (
                    assignedOrphans.map(orphan => (
                    <Link to={`/orphan/${orphan.id}`} key={orphan.id} className="flex min-h-16 items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100">
                        <Avatar src={orphan.photoUrl} name={orphan.name} size="lg" className="shrink-0" />
                        <p className="font-semibold text-gray-800">{orphan.name}</p>
                    </Link>
                    ))
                ) : (
                    <p className="text-text-secondary text-center py-4">لا يوجد أيتام معينون</p>
                )}
            </div>
        </div>

        {/* Assigned Sponsors Section */}
        <div className="rounded-2xl bg-bg-card p-4 shadow-md md:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-gray-700 md:text-xl">الكفلاء المعينون</h2>
                {canManageAssignments && (
                    <button
                        onClick={() => setShowAssignSponsorsModal(true)}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:w-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        تعيين كفلاء
                    </button>
                )}
            </div>
            <div className="space-y-4">
                {assignedSponsorIds.length > 0 ? (
                    sponsorsData
                        .filter(s => s.uuid && assignedSponsorIds.includes(s.uuid))
                        .map(sponsor => (
                            <Link to={`/sponsor/${sponsor.id}`} key={sponsor.id} className="flex min-h-16 items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100">
                                <Avatar src={sponsor.avatarUrl} name={sponsor.name} size="lg" className="shrink-0" />
                                <p className="font-semibold text-gray-800">{sponsor.name}</p>
                            </Link>
                        ))
                ) : (
                    <p className="text-text-secondary text-center py-4">لا يوجد كفلاء معينون</p>
                )}
            </div>
        </div>

      </div>
      
      <div className="space-y-4 xl:space-y-6">
        <div className="rounded-2xl bg-bg-card p-4 shadow-md md:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <button onClick={() => changeMonth(-1)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-lg text-text-primary transition-colors hover:border-primary hover:text-primary" aria-label="الشهر السابق">&lt;</button>
            <h2 className="text-base font-bold text-gray-700 md:text-xl">{monthName}</h2>
            <button onClick={() => changeMonth(1)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-lg text-text-primary transition-colors hover:border-primary hover:text-primary" aria-label="الشهر التالي">&gt;</button>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] text-text-secondary md:text-sm">
            {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(day => <div key={day} className="truncate py-1">{day}</div>)}
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
                  className={`relative flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 md:h-11 md:text-base ${isSelected ? 'bg-primary text-white shadow-sm' : isToday ? 'bg-primary-light text-primary' : 'hover:bg-gray-100'}`}
                >
                  {dayNumber}
                  {tasksForDay && tasksForDay.length > 0 && <span className={`absolute -top-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-white ${tasksForDay.some(t => !t.completed) ? 'bg-red-500' : 'bg-green-500'}`}></span>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="min-h-[12rem] rounded-2xl bg-bg-card p-4 shadow-md md:min-h-[180px] md:p-6">
           <h3 className="mb-4 border-b border-gray-100 pb-3 text-base font-bold text-gray-700 md:text-lg">
            {selectedDate ? `مهام يوم ${selectedDate.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric' })}` : 'حدد يوماً لعرض المهام'}
           </h3>
           <div className="space-y-3">
                {selectedDate && tasksForSelectedDay.length > 0 ? (
                    tasksForSelectedDay.map(task => (
                        <div key={task.id} className="flex items-center text-sm md:text-base">
                            <span className={`me-3 h-2.5 w-2.5 rounded-full ${task.completed ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
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

    {/* Assign Orphans Modal */}
    {showAssignOrphansModal && member && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4" onClick={() => setShowAssignOrphansModal(false)}>
            <div className="flex h-[min(100dvh,42rem)] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-xl md:h-auto md:max-h-[80vh] md:max-w-2xl md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 md:px-6 md:py-5">
                    <h3 className="text-lg font-bold text-text-primary md:text-xl">تعيين أيتام لـ {member.name}</h3>
                    <button onClick={() => setShowAssignOrphansModal(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-xl font-bold text-gray-500 transition-colors hover:border-primary hover:text-primary">&times;</button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
                    <div className="space-y-3">
                    {orphansData.map(orphan => {
                        const isAssigned = assignedOrphanIds.includes(orphan.uuid || '');
                        return (
                            <div 
                                key={orphan.id}
                                className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
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
                                    className={`min-h-11 w-full rounded-xl px-4 py-3 text-sm font-semibold sm:w-auto ${
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
        </div>
    )}

    {/* Assign Sponsors Modal */}
    {showAssignSponsorsModal && member && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4" onClick={() => setShowAssignSponsorsModal(false)}>
            <div className="flex h-[min(100dvh,42rem)] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-xl md:h-auto md:max-h-[80vh] md:max-w-2xl md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 md:px-6 md:py-5">
                    <h3 className="text-lg font-bold text-text-primary md:text-xl">تعيين كفلاء لـ {member.name}</h3>
                    <button onClick={() => setShowAssignSponsorsModal(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-xl font-bold text-gray-500 transition-colors hover:border-primary hover:text-primary">&times;</button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
                    <div className="space-y-3">
                    {sponsorsData.map(sponsor => {
                        const isAssigned = sponsor.uuid && assignedSponsorIds.includes(sponsor.uuid);
                        return (
                            <div 
                                key={sponsor.id}
                                className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
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
                                    className={`min-h-11 w-full rounded-xl px-4 py-3 text-sm font-semibold sm:w-auto ${
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
        </div>
    )}
    </>
  );
};

export default TeamMemberPage;
