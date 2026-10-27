import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, UserCheck, Search, Plus, Check, X, ShieldAlert, Key, 
  AlertCircle, Loader2, CheckCircle2, Building2, UploadCloud, 
  Clock, MapPin, Phone, Mail, Image as ImageIcon, Sparkles 
} from 'lucide-react';
import { College } from '../../types';

interface CanteenAccount {
  id: string;
  canteen_id: string;
  college_id: string;
  username: string;
  email: string;
  contact_person: string;
  contact_phone: string;
  must_change_password: boolean;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  canteens?: {
    name: string;
    code: string;
    location: string;
    logo_url: string;
  };
  colleges?: {
    name: string;
    code: string;
  };
}

interface CanteenAccountsViewProps {
  colleges: College[];
}

export const CanteenAccountsView: React.FC<CanteenAccountsViewProps> = ({ colleges }) => {
  const [accounts, setAccounts] = useState<CanteenAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Canteen & Account Creation Form State
  const [formData, setFormData] = useState({
    // Account details
    username: '',
    initial_password: '',
    college_id: colleges.length > 0 ? colleges[0].id : '',
    canteen_name: '',
    account_status: 'active' as const,
    // Canteen Profile details
    description: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    location: '',
    operating_hours: '08:00 AM - 08:00 PM',
    logo_url: '',
    banner_url: ''
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/canteen-accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch canteen accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      const q = searchQuery.toLowerCase();
      const matchUsername = (a.username || '').toLowerCase().includes(q);
      const matchCanteen = (a.canteens?.name || '').toLowerCase().includes(q);
      const matchCollege = (a.colleges?.name || '').toLowerCase().includes(q);
      const matchContact = (a.contact_person || '').toLowerCase().includes(q);
      return matchUsername || matchCanteen || matchCollege || matchContact;
    });
  }, [accounts, searchQuery]);

  // Image Upload Handler using Cloudinary API
  const handleImageUpload = async (file: File, target: 'logo' | 'banner') => {
    if (target === 'logo') setUploadingLogo(true);
    else setUploadingBanner(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/v1/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, folder: 'canteens' })
        });
        const data = await res.json();
        if (res.ok && data.data?.url) {
          if (target === 'logo') {
            setFormData(prev => ({ ...prev, logo_url: data.data.url }));
            showToast('Logo image uploaded to Cloudinary');
          } else {
            setFormData(prev => ({ ...prev, banner_url: data.data.url }));
            showToast('Banner image uploaded to Cloudinary');
          }
        } else {
          showToast('Image upload failed');
        }
      };
    } catch (err) {
      showToast('Error uploading image');
    } finally {
      if (target === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.initial_password.trim() || !formData.canteen_name.trim()) {
      showToast('Username, initial password, and canteen name are required');
      return;
    }

    if (formData.initial_password.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Canteen Entity first
      const canteenPayload = {
        name: formData.canteen_name.trim(),
        college_id: formData.college_id,
        description: formData.description.trim() || 'Campus Dining Outlet',
        location: formData.location.trim() || 'Main Campus Block',
        contact_person: formData.contact_person.trim() || formData.username,
        contact_phone: formData.contact_phone.trim(),
        contact_email: formData.contact_email.trim() || `${formData.username}@timetomeal.com`,
        logo_url: formData.logo_url || null,
        banner_url: formData.banner_url || null,
        operating_hours: formData.operating_hours,
        status: 'active'
      };

      const cntRes = await fetch('/api/v1/canteens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(canteenPayload)
      });
      const cntData = await cntRes.json();
      if (!cntRes.ok) throw new Error(cntData.message || 'Failed to create canteen');

      const createdCanteenId = cntData.data?.id || cntData.data?.canteen_id;

      // 2. Provision Canteen Login Account with encrypted credentials
      const accountPayload = {
        canteen_id: createdCanteenId,
        college_id: formData.college_id,
        username: formData.username.trim().toLowerCase(),
        initial_password: formData.initial_password,
        email: formData.contact_email.trim() || `${formData.username.toLowerCase()}@timetomeal.internal`,
        contact_person: formData.contact_person.trim() || formData.username,
        contact_phone: formData.contact_phone.trim(),
        status: formData.account_status
      };

      const accRes = await fetch('/api/v1/admin/canteen-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountPayload)
      });
      const accData = await accRes.json();
      if (!accRes.ok) throw new Error(accData.message || 'Failed to provision canteen login account');

      showToast('Canteen and Login Account created successfully!');
      setShowCreateModal(false);
      setFormData({
        username: '',
        initial_password: '',
        college_id: colleges.length > 0 ? colleges[0].id : '',
        canteen_name: '',
        account_status: 'active',
        description: '',
        contact_person: '',
        contact_phone: '',
        contact_email: '',
        location: '',
        operating_hours: '08:00 AM - 08:00 PM',
        logo_url: '',
        banner_url: ''
      });
      fetchAccounts();
    } catch (err: any) {
      showToast(err.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAccountStatus = async (account: CanteenAccount) => {
    const newStatus = account.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/v1/admin/canteen-accounts/${account.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Account ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
        fetchAccounts();
      }
    } catch {
      showToast('Failed to change account status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Canteen Accounts & Access</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Provision secure login accounts and credentials for campus food vendors
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Canteen & Account</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username, canteen name, contact person, or college..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Accounts List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-3" />
          <p className="text-xs font-bold">Loading canteen accounts...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">No Canteen Accounts Found</h3>
          <p className="text-xs text-slate-500 mt-1">Click "Provision Canteen & Account" to create a new vendor login</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Canteen / Outlet</th>
                  <th className="py-3.5 px-4">Login Username</th>
                  <th className="py-3.5 px-4">Assigned Campus</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Security</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                {filteredAccounts.map((acc) => {
                  const canteenName = acc.canteens?.name || 'Assigned Canteen';
                  const collegeName = acc.colleges?.name || acc.colleges?.code || 'Campus Node';
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white">{canteenName}</div>
                            <div className="text-[10px] text-slate-400">ID: {acc.canteen_id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-amber-700 dark:text-amber-400">
                        @{acc.username}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{collegeName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>{acc.contact_person || 'Owner'}</div>
                        <div className="text-[10px] text-slate-400">{acc.contact_phone || acc.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        {acc.must_change_password ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg">
                            <Key className="w-3 h-3" />
                            Must Change
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg">
                            Active Pass
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          acc.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                        }`}>
                          {acc.status === 'active' ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => toggleAccountStatus(acc)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all ${
                            acc.status === 'active'
                              ? 'bg-red-50 hover:bg-red-100 text-red-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {acc.status === 'active' ? 'Disable Account' : 'Enable Account'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Canteen & Account Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Provision Canteen & Login Account
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Creates the canteen outlet profile and generates secure vendor credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Section 1: Account Login Details */}
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 rounded-2xl p-4 space-y-3">
                <span className="block text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                  1. Login Account Credentials
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      placeholder="e.g. kprcanteen"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Initial Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.initial_password}
                      onChange={(e) => setFormData({ ...formData, initial_password: e.target.value })}
                      placeholder="min 6 chars"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Assigned College <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.college_id}
                      onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    >
                      {colleges.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Initial Account Status
                    </label>
                    <select
                      value={formData.account_status}
                      onChange={(e) => setFormData({ ...formData, account_status: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    >
                      <option value="active">Active (Immediate Login)</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Canteen Profile Details */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <span className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  2. Canteen Profile & Outlet Details
                </span>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Canteen Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.canteen_name}
                    onChange={(e) => setFormData({ ...formData, canteen_name: e.target.value })}
                    placeholder="e.g. KPR Central Food Court"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Contact Number (Mobile)
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="10 digit number"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Campus Location / Block
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Block C, Ground Floor"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      value={formData.operating_hours}
                      onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                      placeholder="08:00 AM - 08:00 PM"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Cloudinary Image Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Canteen Logo Image
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-amber-500 flex items-center gap-1.5 transition-all">
                        {uploadingLogo ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        ) : (
                          <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{formData.logo_url ? 'Change Logo' : 'Upload Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
                        />
                      </label>
                      {formData.logo_url && (
                        <img src={formData.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Canteen Banner Image
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-amber-500 flex items-center gap-1.5 transition-all">
                        {uploadingBanner ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        ) : (
                          <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{formData.banner_url ? 'Change Banner' : 'Upload Banner'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')}
                        />
                      </label>
                      {formData.banner_url && (
                        <img src={formData.banner_url} alt="Banner" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
