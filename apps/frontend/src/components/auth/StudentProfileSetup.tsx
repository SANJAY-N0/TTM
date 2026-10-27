import React, { useState, useEffect } from 'react';
import { Building2, ArrowLeft, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { User } from '../../types';

interface StudentProfileSetupProps {
  email: string;
  initialName?: string;
  detectedCollege?: {
    id: string;
    name: string;
    code: string;
    domain: string;
  };
  onSuccess: (user: User) => void;
  onBack?: () => void;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface AcademicYear {
  id: string;
  year_name: string;
  year_number: number;
}

export const StudentProfileSetup: React.FC<StudentProfileSetupProps> = ({
  email,
  initialName = '',
  detectedCollege: propCollege,
  onSuccess,
  onBack
}) => {
  const [fullName, setFullName] = useState(initialName);
  const [rollNumber, setRollNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('male');
  const [departmentId, setDepartmentId] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState<number>(1);
  const [academicYearId, setAcademicYearId] = useState('');
  const [section, setSection] = useState('');
  const [stayClassification, setStayClassification] = useState<'HOSTELLER' | 'DAY'>('HOSTELLER');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // College & Dynamic options
  const [college, setCollege] = useState<{ id: string; name: string; code: string; domain: string } | null>(propCollege || null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detect college from domain if not passed
  useEffect(() => {
    async function loadCollegeAndMeta() {
      setLoadingMetadata(true);
      try {
        let activeCollege = propCollege;
        if (!activeCollege) {
          const domain = email.split('@')[1];
          const colRes = await fetch('/api/v1/colleges');
          if (colRes.ok) {
            const data = await colRes.json();
            const list = data.data || [];
            const found = list.find((c: any) => 
              (c.official_email_domain && c.official_email_domain.toLowerCase() === domain?.toLowerCase()) ||
              (c.domain && c.domain.toLowerCase() === domain?.toLowerCase())
            );
            if (found) {
              activeCollege = {
                id: found.id || found.college_id,
                name: found.name || found.college_name,
                code: found.code || found.college_code,
                domain: found.official_email_domain || found.domain
              };
              setCollege(activeCollege);
            }
          }
        }

        if (activeCollege?.id) {
          // Fetch departments for this college
          const deptRes = await fetch(`/api/v1/colleges/${activeCollege.id}/departments`);
          if (deptRes.ok) {
            const dData = await deptRes.json();
            setDepartments(dData.data || []);
            if (dData.data && dData.data.length > 0 && !departmentId) {
              setDepartmentId(dData.data[0].id);
            }
          }

          // Fetch academic years for this college
          const ayRes = await fetch(`/api/v1/colleges/${activeCollege.id}/academic-years`);
          if (ayRes.ok) {
            const aData = await ayRes.json();
            setAcademicYears(aData.data || []);
            if (aData.data && aData.data.length > 0 && !academicYearId) {
              setAcademicYearId(aData.data[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load college metadata:', err);
      } finally {
        setLoadingMetadata(false);
      }
    }

    loadCollegeAndMeta();
  }, [email, propCollege]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Frontend validations
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!rollNumber.trim()) {
      setErrorMessage('Please enter your roll number / register number.');
      return;
    }
    if (!mobileNumber.trim() || !/^[0-9]{10}$/.test(mobileNumber.trim())) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!college?.id) {
      setErrorMessage('Could not identify a valid college for this email address.');
      return;
    }
    if (!departmentId) {
      setErrorMessage('Please select your department.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('You must accept the Terms and Conditions to complete registration.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        full_name: fullName.trim(),
        college_email: email.trim().toLowerCase(),
        roll_number: rollNumber.trim().toUpperCase(),
        gender: gender || 'male',
        mobile_number: mobileNumber.trim(),
        college_id: college.id,
        department_id: departmentId,
        year_of_study: Number(yearOfStudy) || 1,
        academic_year_id: academicYearId || undefined,
        section: section.trim().toUpperCase(),
        stay_classification: stayClassification,
        terms_accepted: true,
        terms_version: '1.0'
      };

      const res = await fetch('/api/v1/auth/register-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || (data.errors && data.errors.join(', ')) || 'Registration failed.');
      }

      const authToken = data.data?.token || data.token;
      if (authToken) {
        localStorage.setItem('timetomeal_auth_token', authToken);
      }

      const registeredUser: User = {
        id: data.data?.user?.student_id || data.data?.user?.id || email,
        name: data.data?.user?.name || fullName,
        email: email,
        role: 'student',
        college_id: college.id,
        rollNumber: rollNumber.trim().toUpperCase(),
        profile: {
          full_name: fullName,
          roll_number: rollNumber.trim().toUpperCase(),
          mobile_number: mobileNumber.trim(),
          college: college.name,
          stay_classification: stayClassification
        }
      };

      localStorage.setItem('hb_current_user', JSON.stringify(registeredUser));
      onSuccess(registeredUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save student profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f7fa] flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-[430px] bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-7 shadow-2xl border border-slate-100">
        {/* Top Navigation & Header */}
        <div className="flex items-center gap-3.5 mb-5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 tracking-wider uppercase">
              VERIFY YOUR PROFILE
            </h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              FIRST-TIME SETUP WIZARD
            </p>
          </div>
        </div>

        {/* Auto-detected Campus Card */}
        <div className="mb-5 bg-[#f0fbf6] border border-[#bbf2d9] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#d1f7e5] text-[#0f9f59] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-black tracking-wider text-[#0f9f59] uppercase">
              AUTO-DETECTED CAMPUS
            </span>
            <p className="text-xs font-bold text-slate-800 truncate">
              {college?.name || 'KPR College of Arts and Science (KPRCAS)'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Read-Only College Email */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
              EMAIL ADDRESS (READ-ONLY)
            </label>
            <div className="w-full px-3.5 py-2.5 rounded-xl bg-[#f1f4f8] border border-slate-200 text-slate-700 font-semibold text-xs select-none">
              {email}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
              FULL NAME <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Sanjay N"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium text-xs focus:border-[#0f9f59] focus:ring-1 focus:ring-[#0f9f59] outline-none transition-all"
            />
          </div>

          {/* Row 1: Roll Number & Mobile Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                ROLL NUMBER <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. KPR-CS-026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium text-xs focus:border-[#0f9f59] focus:ring-1 focus:ring-[#0f9f59] outline-none transition-all uppercase"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                MOBILE NUMBER <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="10 digit number"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium text-xs focus:border-[#0f9f59] focus:ring-1 focus:ring-[#0f9f59] outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 2: Department & Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                DEPARTMENT <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium text-xs focus:border-[#0f9f59] focus:ring-1 focus:ring-[#0f9f59] outline-none transition-all"
              >
                <option value="">Select Dept</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name || dept.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                YEAR <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={yearOfStudy}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setYearOfStudy(val);
                  const matchingAy = academicYears.find(ay => ay.year_number === val);
                  if (matchingAy) setAcademicYearId(matchingAy.id);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium text-xs focus:border-[#0f9f59] focus:ring-1 focus:ring-[#0f9f59] outline-none transition-all"
              >
                <option value={1}>I Year</option>
                <option value={2}>II Year</option>
                <option value={3}>III Year</option>
                <option value={4}>IV Year</option>
              </select>
            </div>
          </div>

          {/* Row 3: Section (Optional) & Stay Classification */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                SECTION <span className="font-normal text-slate-400">(OPTIONAL)</span>
              </label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. A, B"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium text-xs focus:border-[#0f9f59] focus:ring-1 focus:ring-[#0f9f59] outline-none transition-all uppercase"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                STAY CLASSIFICATION
              </label>
              <div className="bg-[#f1f4f8] p-1 rounded-xl flex items-center h-[38px]">
                <button
                  type="button"
                  onClick={() => setStayClassification('HOSTELLER')}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                    stayClassification === 'HOSTELLER'
                      ? 'bg-white text-[#0f9f59] shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  HOSTELLER
                </button>
                <button
                  type="button"
                  onClick={() => setStayClassification('DAY')}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                    stayClassification === 'DAY'
                      ? 'bg-white text-[#0f9f59] shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  DAY
                </button>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Acceptance */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0f9f59] focus:ring-[#0f9f59]"
              />
              <span className="text-[10px] font-bold text-slate-400 leading-tight uppercase">
                I AGREE TO THE COLLEGE RULES AND AUTHORIZE TIMETOMEAL TO VERIFY MY ENROLLMENT.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || loadingMetadata}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0f9f59] hover:bg-[#0c854a] active:scale-[0.99] text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SAVING PROFILE...</span>
                </>
              ) : (
                <>
                  <span>SAVE PROFILE & CONTINUE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
