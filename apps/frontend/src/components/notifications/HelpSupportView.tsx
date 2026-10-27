import React, { useState } from 'react';
import { Phone, Mail, Send, Upload, CheckCircle2, MessageSquare, AlertCircle, HelpCircle, ArrowLeft, X } from 'lucide-react';
import { ImageUpload } from '../common/ImageUpload';

interface HelpSupportViewProps {
  onBack?: () => void;
  userRole?: 'student' | 'staff' | 'admin';
}

export interface SupportReport {
  id: string;
  subject: string;
  description: string;
  screenshotUrl?: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  created_at: string;
  userRole: string;
}

const HelpSupportView: React.FC<HelpSupportViewProps> = ({ onBack, userRole = 'staff' }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setErrorMessage('Please fill in both the subject and description.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      const newReport: SupportReport = {
        id: `REP-${Math.floor(10000 + Math.random() * 90000)}`,
        subject: subject.trim(),
        description: description.trim(),
        screenshotUrl,
        status: 'Open',
        created_at: new Date().toISOString(),
        userRole
      };

      const existingReports = JSON.parse(localStorage.getItem('hb_support_reports') || '[]');
      localStorage.setItem('hb_support_reports', JSON.stringify([newReport, ...existingReports]));

      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setSubject('');
      setDescription('');
      setScreenshotUrl('');
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-4 lg:p-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Bar with Back option */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-7 h-7 text-[#e14b18]" /> Help & Support
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Get assistance, contact our team or report any platform issue
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-4 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <h2 className="text-xl font-bold mb-2">Direct Contact Support</h2>
        <p className="text-xs text-slate-300 mb-6 leading-relaxed max-w-lg">
          Our dedicated support team is available to assist you with canteen operations, order issues, or payment queries.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#e14b18] text-white flex items-center justify-center shadow-lg shadow-orange-600/30">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Phone Support</p>
                <p className="text-lg font-bold text-white tracking-wide">9894709708</p>
              </div>
            </div>
            <a
              href="tel:9894709708"
              className="w-full py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <Phone className="w-4 h-4 text-[#e14b18]" /> 📞 Call Support
            </a>
          </div>

          {/* Email Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Support</p>
                <p className="text-sm font-bold text-white truncate max-w-[200px]">sanjay150724@gmail.com</p>
              </div>
            </div>
            <a
              href="mailto:sanjay150724@gmail.com?subject=Support%20Query%20-%20Time-to-Meal"
              className="w-full py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <Mail className="w-4 h-4 text-blue-600" /> ✉ Email Support
            </a>
          </div>
        </div>
      </div>

      {/* Report an Issue Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#e14b18] flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Report an Issue</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submit details about any technical glitch, billing error, or menu discrepancy
            </p>
          </div>
        </div>

        {submittedSuccess ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
              Report Submitted Successfully!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
              Thank you for reaching out. Our support team has logged your query and will resolve it shortly.
            </p>
            <button
              onClick={() => setSubmittedSuccess(false)}
              className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Submit Another Report
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Walk-in Payment Printer Error / Order Delay"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#e14b18] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Please describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#e14b18] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Screenshot Upload <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <ImageUpload
                value={screenshotUrl}
                onChange={(url) => setScreenshotUrl(url)}
                onRemove={() => setScreenshotUrl('')}
                folder="timetomeal/support"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubject('');
                  setDescription('');
                  setScreenshotUrl('');
                  if (onBack) onBack();
                }}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#e14b18] hover:bg-[#c93f12] text-white font-semibold text-xs rounded-xl shadow-md shadow-orange-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default HelpSupportView;
