import React, { useState, useEffect } from 'react';
import { SystemReport, ReportReply } from '../types';
import { 
  FileText, Plus, Search, Filter, AlertTriangle, CheckCircle, 
  Clock, ShieldAlert, MessageSquare, Mail, Phone, Lock, 
  Send, User as UserIcon, Store, ShoppingBag, X, ChevronRight,
  Eye, RefreshCw, Paperclip
} from 'lucide-react';

const INITIAL_REPORTS: SystemReport[] = [
  {
    id: 'REP-2026-001',
    report_type: 'canteen',
    subject: 'Delayed Order Fulfillment at Main Canteen',
    description: 'Multiple students reported 30+ minutes delay during peak lunch hours for pre-orders.',
    created_by: 'Student User (STU-2026-99)',
    against_user: 'Central Food Stall Canteen',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'open',
    priority: 'high',
    replies: [
      {
        id: 'rep-r1',
        reply_by: 'Super Admin',
        message: 'Escalated to Canteen Owner for staff optimization during 1 PM - 2 PM.',
        channel: 'internal_note',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ]
  },
  {
    id: 'REP-2026-002',
    report_type: 'order',
    subject: 'Payment Deducted but Order Token Failed',
    description: 'Student claims ₹120 was deducted via Cashfree payment gateway but order token was not generated.',
    created_by: 'Rahul Sharma (rahul@kpr.edu)',
    against_user: 'Order #9921',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: 'resolved',
    priority: 'urgent',
    replies: [
      {
        id: 'rep-r2',
        reply_by: 'Finance Support',
        message: 'Refund transaction #CF-992188 initiated to student bank account.',
        channel: 'email',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ]
  },
  {
    id: 'REP-2026-003',
    report_type: 'student',
    subject: 'Uncollected Food Waste Issue',
    description: 'Token #3302 was prepared but not picked up by student after 45 minutes.',
    created_by: 'Canteen Staff (stall_1)',
    against_user: 'Ananya Verma (STU-2026-42)',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    status: 'closed',
    priority: 'low',
    replies: []
  }
];

export const ReportManagementView: React.FC = () => {
  const [reports, setReports] = useState<SystemReport[]>(() => {
    const saved = localStorage.getItem('hb_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [selectedReport, setSelectedReport] = useState<SystemReport | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // New Reply State
  const [replyMessage, setReplyMessage] = useState('');
  const [replyChannel, setReplyChannel] = useState<'email' | 'phone' | 'internal_note'>('email');

  // New Report Form State
  const [newReport, setNewReport] = useState<Partial<SystemReport>>({
    report_type: 'canteen',
    priority: 'medium',
    subject: '',
    description: '',
    against_user: '',
    created_by: 'Super Admin'
  });

  useEffect(() => {
    localStorage.setItem('hb_reports', JSON.stringify(reports));
  }, [reports]);

  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.created_by.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || r.report_type === typeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const handleUpdateStatus = (reportId: string, status: SystemReport['status']) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    if (selectedReport && selectedReport.id === reportId) {
      setSelectedReport(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleAddReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedReport) return;

    const newReply: ReportReply = {
      id: 'rep-' + Date.now(),
      reply_by: 'Super Admin',
      message: replyMessage.trim(),
      channel: replyChannel,
      created_at: new Date().toISOString()
    };

    const updated = reports.map(r => {
      if (r.id === selectedReport.id) {
        return {
          ...r,
          replies: [...(r.replies || []), newReply]
        };
      }
      return r;
    });

    setReports(updated);
    setSelectedReport(prev => prev ? { ...prev, replies: [...(prev.replies || []), newReply] } : null);
    setReplyMessage('');
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.subject || !newReport.description) return;

    const created: SystemReport = {
      id: 'REP-2026-' + Math.floor(100 + Math.random() * 900),
      report_type: newReport.report_type || 'canteen',
      subject: newReport.subject,
      description: newReport.description,
      created_by: newReport.created_by || 'Super Admin',
      against_user: newReport.against_user || 'N/A',
      created_at: new Date().toISOString(),
      status: 'open',
      priority: newReport.priority || 'medium',
      replies: []
    };

    setReports([created, ...reports]);
    setIsCreateModalOpen(false);
    setNewReport({
      report_type: 'canteen',
      priority: 'medium',
      subject: '',
      description: '',
      against_user: '',
      created_by: 'Super Admin'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Stats Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-500" />
            <span>Centralized Report Management System</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Monitor, investigate, and resolve grievances submitted against Students, Canteens, or Orders.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Submit New Report</span>
        </button>
      </div>

      {/* KPI Cards for Reports */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total System Reports</p>
          <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">{reports.length}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/50 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Active / Open</p>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
            {reports.filter(r => r.status === 'open' || r.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/50 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Resolved</p>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
            {reports.filter(r => r.status === 'resolved').length}
          </p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Closed</p>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-200 mt-1">
            {reports.filter(r => r.status === 'closed').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search report ID, subject, reporter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-extrabold"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-extrabold"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-extrabold"
          >
            <option value="all">All Report Types</option>
            <option value="student">Against Student</option>
            <option value="canteen">Against Canteen</option>
            <option value="order">Against Order</option>
            <option value="general">General Issue</option>
          </select>
        </div>
      </div>

      {/* Reports Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="p-4">Report ID</th>
                <th className="p-4">Type</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Created By</th>
                <th className="p-4">Against User/Target</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-bold">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No system reports match the specified filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-black text-slate-900 dark:text-white">
                      {report.id}
                    </td>
                    <td className="p-4">
                      <span className="capitalize px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px]">
                        {report.report_type}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="truncate font-extrabold text-slate-900 dark:text-white">{report.subject}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{report.description}</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {report.created_by}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {report.against_user}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        report.priority === 'urgent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                        report.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        report.priority === 'medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {report.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        report.status === 'open' ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400' :
                        report.status === 'in_progress' ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' :
                        report.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
                        'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="p-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED REPORT VIEW MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-black text-sm">
                  {selectedReport.id.slice(-3)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-950 dark:text-white">
                    {selectedReport.subject}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                    {selectedReport.id} • {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Report Metadata Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-bold">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Created By</span>
                <span className="text-slate-900 dark:text-white mt-0.5 block truncate">{selectedReport.created_by}</span>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Against Target</span>
                <span className="text-slate-900 dark:text-white mt-0.5 block truncate">{selectedReport.against_user}</span>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Priority</span>
                <span className="capitalize text-amber-600 font-black mt-0.5 block">{selectedReport.priority}</span>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Current Status</span>
                <span className="capitalize text-emerald-600 font-black mt-0.5 block">{selectedReport.status.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Description Card */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Full Grievance Description</h4>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedReport.description}
              </div>
            </div>

            {/* Admin Status Changer Controls */}
            <div className="space-y-2 border-t border-b border-slate-100 dark:border-slate-800 py-4">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Super Admin Status Actions</h4>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'open')}
                  className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    selectedReport.status === 'open' 
                      ? 'bg-rose-600 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Mark Open
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'in_progress')}
                  className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    selectedReport.status === 'in_progress' 
                      ? 'bg-amber-500 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                  className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    selectedReport.status === 'resolved' 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Resolve Report
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'closed')}
                  className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    selectedReport.status === 'closed' 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Close Report
                </button>
              </div>
            </div>

            {/* Replies Thread */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Admin Resolution Replies ({selectedReport.replies?.length || 0})</span>
              </h4>

              <div className="space-y-2.5">
                {(!selectedReport.replies || selectedReport.replies.length === 0) ? (
                  <p className="text-xs text-slate-400 font-medium italic">No resolution notes or replies recorded yet.</p>
                ) : (
                  selectedReport.replies.map(reply => (
                    <div key={reply.id} className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black">
                        <span className="text-emerald-600 dark:text-emerald-400">{reply.reply_by}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-widest text-[9px]">
                            {reply.channel.replace('_', ' ')}
                          </span>
                          <span className="text-slate-400">{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{reply.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Reply Form */}
              <form onSubmit={handleAddReply} className="pt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reply Channel:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setReplyChannel('email')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        replyChannel === 'email' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      Email Note
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyChannel('phone')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        replyChannel === 'phone' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      SMS / Phone Note
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyChannel('internal_note')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        replyChannel === 'internal_note' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      Internal Note
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Type official admin response or resolution note..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW REPORT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Submit New System Report</h3>
                  <p className="text-xs text-slate-400 font-medium">Create a formal report for tracking & resolution</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Report Against</label>
                  <select
                    value={newReport.report_type}
                    onChange={(e) => setNewReport({ ...newReport, report_type: e.target.value as any })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  >
                    <option value="canteen">Canteen</option>
                    <option value="student">Student</option>
                    <option value="order">Order Token</option>
                    <option value="general">General System</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Priority Level</label>
                  <select
                    value={newReport.priority}
                    onChange={(e) => setNewReport({ ...newReport, priority: e.target.value as any })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Escalation</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Against Entity / User Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Stall #1, Rahul Sharma, Order #9921"
                  value={newReport.against_user}
                  onChange={(e) => setNewReport({ ...newReport, against_user: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject Summary</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of the issue..."
                  value={newReport.subject}
                  onChange={(e) => setNewReport({ ...newReport, subject: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide complete details, dates, and background..."
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagementView;
