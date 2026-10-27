import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Search, Plus, Check, X, Edit, AlertCircle, 
  Loader2, CheckCircle2, Building2, Layers 
} from 'lucide-react';
import { College } from '../../types';

interface AcademicYear {
  id: string;
  college_id: string;
  year_name: string;
  year_number: number;
  status: 'active' | 'inactive';
  colleges?: any;
}

interface AcademicYearManagementViewProps {
  colleges: College[];
}

export const AcademicYearManagementView: React.FC<AcademicYearManagementViewProps> = ({ colleges }) => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    college_id: colleges.length > 0 ? colleges[0].id : '',
    year_name: '',
    year_number: 1,
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/academic-years');
      if (res.ok) {
        const data = await res.json();
        setYears(data.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch academic years:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const filteredYears = useMemo(() => {
    return years.filter(y => {
      const matchCollege = selectedCollegeId === 'ALL' || y.college_id === selectedCollegeId;
      const matchSearch = (y.year_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCollege && matchSearch;
    });
  }, [years, selectedCollegeId, searchQuery]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.year_name.trim()) {
      showToast('Year name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingYear) {
        const res = await fetch(`/api/v1/academic-years/${editingYear.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Failed to update academic year');
        showToast('Academic year updated');
      } else {
        const res = await fetch('/api/v1/academic-years', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Failed to create academic year');
        showToast('Academic year created');
      }
      setShowAddModal(false);
      setEditingYear(null);
      setFormData({
        college_id: colleges.length > 0 ? colleges[0].id : '',
        year_name: '',
        year_number: 1,
        status: 'active'
      });
      fetchYears();
    } catch (err: any) {
      showToast(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (year: AcademicYear) => {
    const newStatus = year.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/v1/academic-years/${year.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Year ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
        fetchYears();
      }
    } catch (err) {
      showToast('Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs font-bold py-3 px-5 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Academic Years</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure student cohorts, batch levels, and study terms by college
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingYear(null);
            setFormData({
              college_id: colleges.length > 0 ? colleges[0].id : '',
              year_name: '',
              year_number: 1,
              status: 'active'
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Academic Year</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search academic years (e.g. I Year, 2024-2025)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <select
            value={selectedCollegeId}
            onChange={(e) => setSelectedCollegeId(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Colleges ({years.length})</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Years Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
          <p className="text-xs font-bold">Loading academic years...</p>
        </div>
      ) : filteredYears.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">No Academic Years Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try selecting a different college</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredYears.map((year) => {
            const collegeMatch = colleges.find(c => c.id === year.college_id);
            const collegeName = collegeMatch?.name || year.colleges?.college_name || year.colleges?.name || 'Associated College';
            return (
              <div
                key={year.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center">
                      #{year.year_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleStatus(year)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                        year.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {year.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
                    {year.year_name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mb-4">
                    Level {year.year_number} Study Cohort
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold truncate max-w-[140px]">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{collegeName}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingYear(year);
                      setFormData({
                        college_id: year.college_id,
                        year_name: year.year_name,
                        year_number: year.year_number,
                        status: year.status
                      });
                      setShowAddModal(true);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Academic Year"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingYear ? 'Edit Academic Year' : 'Add Academic Year'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Assigned College
                </label>
                <select
                  required
                  value={formData.college_id}
                  onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-teal-500"
                >
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Year Name (e.g. I Year, II Year, 2024-2025)
                </label>
                <input
                  type="text"
                  required
                  value={formData.year_name}
                  onChange={(e) => setFormData({ ...formData, year_name: e.target.value })}
                  placeholder="e.g. I Year, II Year"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Year Number (1 to 6)
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  required
                  value={formData.year_number}
                  onChange={(e) => setFormData({ ...formData, year_number: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingYear ? 'Update Year' : 'Save Year'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
