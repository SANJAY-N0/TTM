import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Search, Plus, Check, X, Edit, Trash2, AlertCircle, 
  Loader2, Filter, Layers, CheckCircle2, XCircle, ArrowRight 
} from 'lucide-react';
import { College } from '../../types';

interface Department {
  id: string;
  department_id?: string;
  college_id: string;
  name: string;
  department_name?: string;
  code: string;
  department_code?: string;
  description?: string;
  status: 'active' | 'inactive';
  colleges?: any;
}

interface DepartmentManagementViewProps {
  colleges: College[];
}

export const DepartmentManagementView: React.FC<DepartmentManagementViewProps> = ({ colleges }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    college_id: colleges.length > 0 ? colleges[0].id : '',
    department_code: '',
    department_name: '',
    description: '',
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter(d => {
      const matchCollege = selectedCollegeId === 'ALL' || d.college_id === selectedCollegeId;
      const deptName = (d.name || d.department_name || '').toLowerCase();
      const deptCode = (d.code || d.department_code || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchSearch = deptName.includes(q) || deptCode.includes(q);
      return matchCollege && matchSearch;
    });
  }, [departments, selectedCollegeId, searchQuery]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department_code.trim() || !formData.department_name.trim()) {
      showToast('Department code and name are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingDept) {
        const res = await fetch(`/api/v1/departments/${editingDept.id || editingDept.department_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Failed to update department');
        showToast('Department updated successfully');
      } else {
        const res = await fetch('/api/v1/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Failed to create department');
        showToast('Department created successfully');
      }
      setShowAddModal(false);
      setEditingDept(null);
      setFormData({
        college_id: colleges.length > 0 ? colleges[0].id : '',
        department_code: '',
        department_name: '',
        description: '',
        status: 'active'
      });
      fetchDepartments();
    } catch (err: any) {
      showToast(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (dept: Department) => {
    const newStatus = dept.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/v1/departments/${dept.id || dept.department_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Department ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
        fetchDepartments();
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
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Academic Departments</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage curriculum departments and matchings across campuses
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingDept(null);
            setFormData({
              college_id: colleges.length > 0 ? colleges[0].id : '',
              department_code: '',
              department_name: '',
              description: '',
              status: 'active'
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Department</span>
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
            placeholder="Search departments by code or name..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedCollegeId}
            onChange={(e) => setSelectedCollegeId(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Colleges ({departments.length})</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-xs font-bold">Loading college departments...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">No Departments Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or college filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => {
            const collegeMatch = colleges.find(c => c.id === dept.college_id);
            const collegeName = collegeMatch?.name || dept.colleges?.college_name || dept.colleges?.name || 'Associated College';
            return (
              <div
                key={dept.id || dept.department_id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="inline-block px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-black text-[10px] uppercase tracking-wider">
                      {dept.code || dept.department_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleStatus(dept)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                        dept.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {dept.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
                    {dept.name || dept.department_name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                    {dept.description || `Department code: ${dept.code || dept.department_code}`}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold truncate max-w-[180px]">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{collegeName}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDept(dept);
                        setFormData({
                          college_id: dept.college_id,
                          department_code: dept.code || dept.department_code || '',
                          department_name: dept.name || dept.department_name || '',
                          description: dept.description || '',
                          status: dept.status
                        });
                        setShowAddModal(true);
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Department"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                {editingDept ? 'Edit Department' : 'Create Department'}
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
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
                  Department Code (e.g. BSc-CS)
                </label>
                <input
                  type="text"
                  required
                  value={formData.department_code}
                  onChange={(e) => setFormData({ ...formData, department_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CSE, BCA, BBA"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Department Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.department_name}
                  onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                  placeholder="e.g. B.Sc Computer Science"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Campus block or faculty notes"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingDept ? 'Update Department' : 'Save Department'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
