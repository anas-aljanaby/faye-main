import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOccasions } from '../hooks/useOccasions';
import { useOrphansBasic } from '../hooks/useOrphans';
import { useAuth } from '../contexts/AuthContext';
import { SpecialOccasion } from '../types';

interface OccasionsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OccasionsManagementModal: React.FC<OccasionsManagementModalProps> = ({ isOpen, onClose }) => {
  const { occasions, loading, addOccasion, updateOccasion, deleteOccasion } = useOccasions();
  const { orphans } = useOrphansBasic();
  const { canEditOrphans } = useAuth();
  const hasEditPermission = canEditOrphans();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | '3months'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'orphan_specific' | 'organization_wide' | 'multi_orphan'>('all');
  const [showPast, setShowPast] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    occasionType: 'orphan_specific' as 'orphan_specific' | 'organization_wide' | 'multi_orphan',
    selectedOrphanIds: [] as string[],
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter and sort occasions
  const filteredOccasions = useMemo(() => {
    let filtered = [...occasions];

    // Filter by date
    if (!showPast) {
      filtered = filtered.filter(occ => {
        const occDate = new Date(occ.date);
        occDate.setHours(0, 0, 0, 0);
        return occDate >= today;
      });
    }

    // Apply date range filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let endDate = new Date();
      
      switch (dateFilter) {
        case 'week':
          endDate.setDate(now.getDate() + 7);
          break;
        case 'month':
          endDate.setMonth(now.getMonth() + 1);
          break;
        case '3months':
          endDate.setMonth(now.getMonth() + 3);
          break;
      }

      filtered = filtered.filter(occ => {
        const occDate = new Date(occ.date);
        return occDate >= today && occDate <= endDate;
      });
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(occ => occ.occasion_type === typeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(occ => {
        const matchesTitle = occ.title.toLowerCase().includes(query);
        const matchesOrphan = occ.linked_orphans?.some(o => o.name.toLowerCase().includes(query));
        const matchesSingleOrphan = orphans.find(o => o.uuid === occ.orphan_id)?.name.toLowerCase().includes(query);
        return matchesTitle || matchesOrphan || matchesSingleOrphan;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return a.date.getTime() - b.date.getTime();
      } else {
        return a.title.localeCompare(b.title, 'ar');
      }
    });

    return filtered;
  }, [occasions, dateFilter, typeFilter, searchQuery, showPast, sortBy, orphans]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const date = new Date(formData.date);
      await addOccasion(
        formData.title.trim(),
        date,
        formData.occasionType,
        formData.occasionType !== 'organization_wide' ? formData.selectedOrphanIds : undefined
      );
      resetForm();
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding occasion:', error);
      alert('حدث خطأ أثناء إضافة المناسبة');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !formData.title.trim() || !formData.date) {
      return;
    }

    try {
      const date = new Date(formData.date);
      await updateOccasion(editingId, {
        title: formData.title.trim(),
        date: date,
        occasionType: formData.occasionType,
        orphanIds: formData.occasionType !== 'organization_wide' ? formData.selectedOrphanIds : undefined,
      });
      resetForm();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating occasion:', error);
      alert('حدث خطأ أثناء تعديل المناسبة');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOccasion(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting occasion:', error);
      alert('حدث خطأ أثناء حذف المناسبة');
    }
  };

  const startEditing = (occasion: SpecialOccasion) => {
    setEditingId(occasion.id);
    setFormData({
      title: occasion.title,
      date: occasion.date.toISOString().split('T')[0],
      occasionType: occasion.occasion_type,
      selectedOrphanIds: occasion.linked_orphans?.map(o => o.id) || (occasion.orphan_id ? [occasion.orphan_id] : []),
    });
    setIsAdding(false);
    setDeleteConfirmId(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      occasionType: 'orphan_specific',
      selectedOrphanIds: [],
    });
  };

  const handleClose = () => {
    resetForm();
    setIsAdding(false);
    setEditingId(null);
    setDeleteConfirmId(null);
    setSearchQuery('');
    setDateFilter('all');
    setTypeFilter('all');
    setShowPast(false);
    onClose();
  };

  const getOccasionTypeLabel = (type: string) => {
    switch (type) {
      case 'orphan_specific':
        return 'خاص بيتيم';
      case 'organization_wide':
        return 'عام للمنظمة';
      case 'multi_orphan':
        return 'عدة أيتام';
      default:
        return type;
    }
  };

  const getOccasionTypeBadge = (type: string) => {
    const styles = {
      orphan_specific: 'bg-blue-100 text-blue-800',
      organization_wide: 'bg-purple-100 text-purple-800',
      multi_orphan: 'bg-green-100 text-green-800',
    };
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">إدارة المناسبات</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b bg-gray-50 space-y-3">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="بحث بالعنوان أو اسم اليتيم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md"
            />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">جميع التواريخ</option>
              <option value="week">الأسبوع القادم</option>
              <option value="month">الشهر القادم</option>
              <option value="3months">الـ 3 أشهر القادمة</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">جميع الأنواع</option>
              <option value="orphan_specific">خاص بيتيم</option>
              <option value="organization_wide">عام للمنظمة</option>
              <option value="multi_orphan">عدة أيتام</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="date">ترتيب حسب التاريخ</option>
              <option value="title">ترتيب حسب العنوان</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPast"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="showPast" className="text-sm text-gray-700">عرض المناسبات الماضية</label>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : filteredOccasions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد مناسبات مطابقة للبحث</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOccasions.map(occasion => {
                const isEditing = editingId === occasion.id;
                const isDeleting = deleteConfirmId === occasion.id;
                const occasionDate = new Date(occasion.date);
                const isPast = occasionDate < today;
                const isToday = occasionDate.toDateString() === today.toDateString();

                return (
                  <div
                    key={occasion.id}
                    className={`border rounded-lg p-4 ${
                      isPast ? 'bg-gray-50 opacity-75' : isToday ? 'bg-yellow-50 border-yellow-300' : 'bg-white'
                    }`}
                  >
                    {isEditing ? (
                      <form onSubmit={handleEditSubmit} className="space-y-3">
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="عنوان المناسبة"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                        <select
                          value={formData.occasionType}
                          onChange={(e) => setFormData({ ...formData, occasionType: e.target.value as any, selectedOrphanIds: [] })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="orphan_specific">خاص بيتيم</option>
                          <option value="organization_wide">عام للمنظمة</option>
                          <option value="multi_orphan">عدة أيتام</option>
                        </select>
                        {formData.occasionType !== 'organization_wide' && (
                          <select
                            multiple
                            value={formData.selectedOrphanIds}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, option => option.value);
                              setFormData({ ...formData, selectedOrphanIds: selected });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            size={Math.min(orphans.length, 5)}
                          >
                            {orphans.map(orphan => (
                              <option key={orphan.uuid} value={orphan.uuid || ''}>
                                {orphan.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <div className="flex gap-2">
                          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">
                            حفظ
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingId(null); resetForm(); }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                          >
                            إلغاء
                          </button>
                        </div>
                      </form>
                    ) : isDeleting ? (
                      <div className="space-y-2">
                        <p className="text-red-600 font-semibold">هل أنت متأكد من حذف "{occasion.title}"؟</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(occasion.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                          >
                            نعم، احذف
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-gray-800">{occasion.title}</h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getOccasionTypeBadge(occasion.occasion_type)}`}>
                              {getOccasionTypeLabel(occasion.occasion_type)}
                            </span>
                            {isToday && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-200 text-yellow-800">اليوم</span>}
                            {isPast && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-600">ماضي</span>}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {occasion.date.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          {occasion.occasion_type === 'orphan_specific' && occasion.orphan_id && (
                            <Link
                              to={`/orphan/${orphans.find(o => o.uuid === occasion.orphan_id)?.id || ''}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {orphans.find(o => o.uuid === occasion.orphan_id)?.name || 'يتيم'}
                            </Link>
                          )}
                          {occasion.occasion_type === 'multi_orphan' && occasion.linked_orphans && occasion.linked_orphans.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {occasion.linked_orphans.map(orphan => (
                                <Link
                                  key={orphan.id}
                                  to={`/orphan/${orphans.find(o => o.uuid === orphan.id)?.id || ''}`}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                                >
                                  {orphan.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                        {hasEditPermission && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditing(occasion)}
                              className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-md"
                              title="تعديل"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(occasion.id)}
                              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md"
                              title="حذف"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add New Occasion */}
        {hasEditPermission && (
          <div className="p-4 border-t bg-gray-50">
            {isAdding ? (
              <form onSubmit={handleAddSubmit} className="space-y-3">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="عنوان المناسبة"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <select
                  value={formData.occasionType}
                  onChange={(e) => setFormData({ ...formData, occasionType: e.target.value as any, selectedOrphanIds: [] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="orphan_specific">خاص بيتيم</option>
                  <option value="organization_wide">عام للمنظمة</option>
                  <option value="multi_orphan">عدة أيتام</option>
                </select>
                {formData.occasionType !== 'organization_wide' && (
                  <select
                    multiple
                    value={formData.selectedOrphanIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({ ...formData, selectedOrphanIds: selected });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    size={Math.min(orphans.length, 5)}
                  >
                    {orphans.map(orphan => (
                      <option key={orphan.uuid} value={orphan.uuid || ''}>
                        {orphan.name}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">
                    إضافة
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAdding(false); resetForm(); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => { setIsAdding(true); setEditingId(null); setDeleteConfirmId(null); }}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                إضافة مناسبة جديدة
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OccasionsManagementModal;

