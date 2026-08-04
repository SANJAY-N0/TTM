import React, { useState, useMemo, useEffect } from 'react';
import { College, Order, MenuItem } from '../types';
import { CanteenRecord } from './CanteenManagementView';
import { StudentRecord } from './StudentManagementView';
import { 
  Building2, Search, Filter, Plus, Edit, Trash2, ArrowLeft, Store, 
  Users, ShoppingBag, IndianRupee, TrendingUp, Clock, CheckCircle2, 
  XCircle, ChevronRight, BarChart3, Download, Phone, Mail, MapPin, AlertCircle, X,
  Calendar, Check, ShieldCheck, ShieldAlert, FileText, Sparkles,
  RefreshCw, Layers, Eye, MoreVertical, UserPlus, CreditCard, AlertTriangle, Settings
} from 'lucide-react';

// Extended Interfaces for College Module V1 MVP
export interface Department {
  id: string;
  name: string;
  code: string;
  studentCount?: number;
}

export interface StudentReport {
  id: string;
  studentId: string;
  studentName: string;
  reportDate: string;
  reportType: 'Payment Dispute' | 'Uncollected Order' | 'Behavioral Issue' | 'System Abuse' | 'Other';
  description: string;
  createdBy: string;
  status: 'Pending' | 'Under Review' | 'Resolved';
  resolution?: string;
}

export interface CollegeAcademicSettings {
  regPrefix: string;
  startingNumber: number;
  years: string[];
  emailPattern: string;
  departments: Department[];
}

export interface CollegeStudent {
  id: string;
  collegeId: string;
  photo: string;
  name: string;
  registerNumber: string;
  rollNumber: string;
  department: string;
  year: 'I' | 'II' | 'III' | 'PG I' | 'PG II' | string;
  batch: string;
  email: string;
  phone: string;
  parentContact: string;
  status: 'Active' | 'Suspended';
  reportsCount: number;
  createdDate: string;
}

interface CollegeManagementViewProps {
  colleges: College[];
  canteens: CanteenRecord[];
  students?: StudentRecord[];
  orders: Order[];
  menuItems?: MenuItem[];
  onAddCollege: (collegeData: Omit<College, 'id' | 'createdDate'>) => void;
  onEditCollege: (college: College) => void;
  onDeleteCollege: (id: string) => void;
  initialSelectedCollegeId?: string | null;
}

// Initial Default Academic Settings for Colleges
const DEFAULT_ACADEMIC_SETTINGS: Record<string, CollegeAcademicSettings> = {
  'col-1': {
    regPrefix: '23PSG',
    startingNumber: 101,
    years: ['I', 'II', 'III', 'PG I', 'PG II'],
    emailPattern: '{name}.26{alphabet}{batch}@psgtech.ac.in',
    departments: [
      { id: 'dept-1', name: 'Computer Science & Engineering', code: 'CSE', studentCount: 120 },
      { id: 'dept-2', name: 'Information Technology', code: 'IT', studentCount: 95 },
      { id: 'dept-3', name: 'Electronics & Communication', code: 'ECE', studentCount: 110 },
      { id: 'dept-4', name: 'Mechanical Engineering', code: 'MECH', studentCount: 85 }
    ]
  },
  'col-2': {
    regPrefix: '23CIT',
    startingNumber: 201,
    years: ['I', 'II', 'III', 'PG I', 'PG II'],
    emailPattern: '{name}.26{alphabet}{batch}@cit.edu.in',
    departments: [
      { id: 'dept-5', name: 'Computer Applications (BCA)', code: 'BCA', studentCount: 80 },
      { id: 'dept-6', name: 'Data Science', code: 'DS', studentCount: 60 }
    ]
  },
  'default': {
    regPrefix: '23CT',
    startingNumber: 1,
    years: ['I', 'II', 'III', 'PG I', 'PG II'],
    emailPattern: '{name}.26{alphabet}{batch}@kprcas.ac.in',
    departments: [
      { id: 'dept-def-1', name: 'B.Sc Computer Science', code: 'CS', studentCount: 60 },
      { id: 'dept-def-2', name: 'B.Com Information Technology', code: 'COM-IT', studentCount: 55 },
      { id: 'dept-def-3', name: 'BBA Logistics & Supply Chain', code: 'BBA', studentCount: 45 }
    ]
  }
};

// Initial Mock Students for College Module
const GENERATE_MOCK_COLLEGE_STUDENTS = (collegeId: string, collegeName: string): CollegeStudent[] => {
  const departments = ['B.Sc Computer Science', 'Information Technology', 'B.Com CA', 'Data Science', 'BBA'];
  const years: ('I' | 'II' | 'III' | 'PG I' | 'PG II')[] = ['I', 'II', 'III', 'PG I', 'PG II'];
  const firstNames = ['Sanjay', 'Aarav', 'Priya', 'Rohan', 'Kavya', 'Vikram', 'Ananya', 'Rahul', 'Deepika', 'Karthik', 'Nithya', 'Arjun', 'Meera', 'Harish', 'Divya', 'Ganesh', 'Lakshmi', 'Siddharth', 'Bhavana', 'Dinesh', 'Pooja', 'Manoj', 'Keerthi', 'Surya', 'Revathi'];
  const lastNames = ['Kumar', 'Sharma', 'Sundaram', 'Gupta', 'Reddy', 'Singh', 'Venkatesh', 'Nair', 'Iyer', 'Patel', 'Subramanian', 'Raj', 'Balaji', 'Prasad', 'Rao'];
  
  const mockStudents: CollegeStudent[] = [];
  const prefix = collegeId === 'col-1' ? '23PSG' : collegeId === 'col-2' ? '23CIT' : '23CT';

  for (let i = 1; i <= 45; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const dept = departments[i % departments.length];
    const yr = years[i % years.length];
    const numStr = String(i).padStart(3, '0');
    const regNo = `${prefix}${numStr}`;
    const rollNo = `${prefix}-R${100 + i}`;
    const cleanFn = fn.toLowerCase().replace(/[^a-z]/g, '');
    const email = `${cleanFn}.26k${20 + (i % 5)}@${collegeId === 'col-1' ? 'psgtech.ac.in' : collegeId === 'col-2' ? 'cit.edu.in' : 'kprcas.ac.in'}`;

    mockStudents.push({
      id: `cstd-${collegeId}-${i}`,
      collegeId,
      photo: `https://images.unsplash.com/photo-${1530000000000 + (i * 123456) % 90000000}?auto=format&fit=crop&q=80&w=150` || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      name: `${fn} ${ln}`,
      registerNumber: regNo,
      rollNumber: rollNo,
      department: dept,
      year: yr,
      batch: '2023-2026',
      email,
      phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      parentContact: `+91 94${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: i % 7 === 0 ? 'Suspended' : 'Active',
      reportsCount: i % 5 === 0 ? (i % 2 === 0 ? 2 : 1) : 0,
      createdDate: '12 Jan 2025'
    });
  }
  return mockStudents;
};

// Initial Reports against Students
const INITIAL_STUDENT_REPORTS: StudentReport[] = [
  {
    id: 'rep-101',
    studentId: 'cstd-col-1-5',
    studentName: 'Kavya Reddy',
    reportDate: '2026-08-01',
    reportType: 'Uncollected Order',
    description: 'Ordered ₹350 worth meal combos at Tech Park Canteen but failed to collect before closing time.',
    createdBy: 'Tech Park Canteen Manager (Ramesh)',
    status: 'Under Review',
    resolution: 'Student contacted for payment confirmation.'
  },
  {
    id: 'rep-102',
    studentId: 'cstd-col-1-7',
    studentName: 'Vikram Singh',
    reportDate: '2026-07-28',
    reportType: 'Payment Dispute',
    description: 'Simulated QR payment verification error without actual UPI credit transfer.',
    createdBy: 'Super Admin',
    status: 'Pending'
  }
];

export const CollegeManagementView: React.FC<CollegeManagementViewProps> = ({
  colleges,
  canteens,
  students: externalStudents = [],
  orders,
  menuItems = [],
  onAddCollege,
  onEditCollege,
  onDeleteCollege,
  initialSelectedCollegeId = null
}) => {
  // ---------------------------------------------------------------------------
  // NAVIGATION STATE
  // ---------------------------------------------------------------------------
  const [viewMode, setViewMode] = useState<'list' | 'college_detail'>(
    initialSelectedCollegeId ? 'college_detail' : 'list'
  );
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(initialSelectedCollegeId);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'canteens'>('overview');

  // Table Row Action Dropdown Popover State
  const [activeActionDropdownId, setActiveActionDropdownId] = useState<string | null>(null);

  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Selected College object
  const selectedCollege = useMemo(() => {
    return colleges.find(c => c.id === selectedCollegeId) || null;
  }, [colleges, selectedCollegeId]);

  // ---------------------------------------------------------------------------
  // COLLEGE LIST FILTERS & MODALS
  // ---------------------------------------------------------------------------
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [listStatusFilter, setListStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  
  const [isAddCollegeModalOpen, setIsAddCollegeModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [collegeFormData, setCollegeFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    contactPerson: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive'
  });

  const filteredColleges = useMemo(() => {
    return colleges.filter(col => {
      const q = listSearchQuery.toLowerCase();
      const matchSearch = 
        col.name.toLowerCase().includes(q) ||
        col.code.toLowerCase().includes(q) ||
        col.city.toLowerCase().includes(q) ||
        col.contactPerson.toLowerCase().includes(q) ||
        col.email.toLowerCase().includes(q);

      const isSuspended = col.status === 'inactive';
      const matchStatus = 
        listStatusFilter === 'all' ||
        (listStatusFilter === 'active' && col.status === 'active') ||
        (listStatusFilter === 'suspended' && isSuspended);

      return matchSearch && matchStatus;
    });
  }, [colleges, listSearchQuery, listStatusFilter]);

  // ---------------------------------------------------------------------------
  // ACADEMIC SETTINGS & DEPARTMENTS STATE (PER COLLEGE)
  // ---------------------------------------------------------------------------
  const [academicSettingsMap, setAcademicSettingsMap] = useState<Record<string, CollegeAcademicSettings>>(() => {
    const saved = localStorage.getItem('ttm_college_settings');
    return saved ? JSON.parse(saved) : DEFAULT_ACADEMIC_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('ttm_college_settings', JSON.stringify(academicSettingsMap));
  }, [academicSettingsMap]);

  const currentAcademicSettings = useMemo<CollegeAcademicSettings>(() => {
    if (!selectedCollegeId) return DEFAULT_ACADEMIC_SETTINGS['default'];
    return academicSettingsMap[selectedCollegeId] || {
      regPrefix: selectedCollege ? selectedCollege.code.substring(0, 4).toUpperCase() : '23CT',
      startingNumber: 1,
      years: ['I', 'II', 'III', 'PG I', 'PG II'],
      emailPattern: '{name}.26{alphabet}{batch}@kprcas.ac.in',
      departments: DEFAULT_ACADEMIC_SETTINGS['default'].departments
    };
  }, [selectedCollegeId, academicSettingsMap, selectedCollege]);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptFormData, setDeptFormData] = useState<{ id?: string; name: string; code: string }>({ name: '', code: '' });
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // CANTEENS STATE & FILTERS (FOR SELECTED COLLEGE)
  // ---------------------------------------------------------------------------
  const collegeCanteens = useMemo(() => {
    if (!selectedCollege) return [];
    return canteens.filter(c => 
      c.collegeId === selectedCollege.id || 
      c.college_id === selectedCollege.id || 
      c.college.toLowerCase().trim() === selectedCollege.name.toLowerCase().trim()
    );
  }, [canteens, selectedCollege]);

  const [canteenSearch, setCanteenSearch] = useState('');
  const [canteenStatusFilter, setCanteenStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [canteenPaymentFilter, setCanteenPaymentFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [selectedCanteenCheckboxes, setSelectedCanteenCheckboxes] = useState<Set<string>>(new Set());

  const filteredCollegeCanteens = useMemo(() => {
    return collegeCanteens.filter(cnt => {
      const q = canteenSearch.toLowerCase();
      const matchSearch = cnt.name.toLowerCase().includes(q) || cnt.owner.toLowerCase().includes(q) || cnt.email.toLowerCase().includes(q) || cnt.phone.includes(q);
      const isSuspended = cnt.status === 'Inactive' || cnt.status === 'Suspended';
      const matchStatus = 
        canteenStatusFilter === 'all' ||
        (canteenStatusFilter === 'active' && !isSuspended) ||
        (canteenStatusFilter === 'suspended' && isSuspended);
      
      const isVerified = cnt.verificationStatus === 'Verified';
      const matchPayment = 
        canteenPaymentFilter === 'all' ||
        (canteenPaymentFilter === 'verified' && isVerified) ||
        (canteenPaymentFilter === 'pending' && !isVerified);

      return matchSearch && matchStatus && matchPayment;
    });
  }, [collegeCanteens, canteenSearch, canteenStatusFilter, canteenPaymentFilter]);

  const [selectedCanteenDetail, setSelectedCanteenDetail] = useState<CanteenRecord | null>(null);
  const [isCanteenDetailModalOpen, setIsCanteenDetailModalOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // STUDENTS STATE, FILTERS & PAGINATION (FOR SELECTED COLLEGE)
  // ---------------------------------------------------------------------------
  const [studentsMap, setStudentsMap] = useState<Record<string, CollegeStudent[]>>(() => {
    const saved = localStorage.getItem('ttm_college_students_v1');
    if (saved) return JSON.parse(saved);
    return {
      'col-1': GENERATE_MOCK_COLLEGE_STUDENTS('col-1', 'PSG College of Technology'),
      'col-2': GENERATE_MOCK_COLLEGE_STUDENTS('col-2', 'CIT College of Technology')
    };
  });

  useEffect(() => {
    localStorage.setItem('ttm_college_students_v1', JSON.stringify(studentsMap));
  }, [studentsMap]);

  const currentCollegeStudents = useMemo(() => {
    if (!selectedCollegeId) return [];
    if (!studentsMap[selectedCollegeId]) {
      const generated = GENERATE_MOCK_COLLEGE_STUDENTS(selectedCollegeId, selectedCollege?.name || 'College');
      setStudentsMap(prev => ({ ...prev, [selectedCollegeId]: generated }));
      return generated;
    }
    return studentsMap[selectedCollegeId];
  }, [selectedCollegeId, studentsMap, selectedCollege]);

  const [studentSearch, setStudentSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedStudentCheckboxes, setSelectedStudentCheckboxes] = useState<Set<string>>(new Set());

  // Strict Pagination: 20 students per page
  const [studentPage, setStudentPage] = useState(1);
  const STUDENTS_PER_PAGE = 20;

  const filteredCollegeStudents = useMemo(() => {
    return currentCollegeStudents.filter(std => {
      const q = studentSearch.toLowerCase();
      const matchSearch = 
        std.name.toLowerCase().includes(q) ||
        std.registerNumber.toLowerCase().includes(q) ||
        std.rollNumber.toLowerCase().includes(q) ||
        std.email.toLowerCase().includes(q);

      const matchDept = deptFilter === 'all' || std.department === deptFilter;
      const matchYear = yearFilter === 'all' || std.year === yearFilter;
      const matchStatus = studentStatusFilter === 'all' || std.status.toLowerCase() === studentStatusFilter.toLowerCase();

      return matchSearch && matchDept && matchYear && matchStatus;
    });
  }, [currentCollegeStudents, studentSearch, deptFilter, yearFilter, studentStatusFilter]);

  const totalStudentPages = Math.ceil(filteredCollegeStudents.length / STUDENTS_PER_PAGE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * STUDENTS_PER_PAGE;
    return filteredCollegeStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [filteredCollegeStudents, studentPage]);

  useEffect(() => {
    setStudentPage(1);
  }, [studentSearch, deptFilter, yearFilter, studentStatusFilter, selectedCollegeId]);

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<CollegeStudent | null>(null);
  const [viewingStudentDetail, setViewingStudentDetail] = useState<CollegeStudent | null>(null);
  const [studentReports, setStudentReports] = useState<StudentReport[]>(INITIAL_STUDENT_REPORTS);
  const [isAddReportModalOpen, setIsAddReportModalOpen] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    reportType: 'Payment Dispute' as StudentReport['reportType'],
    description: '',
    createdBy: 'Super Admin'
  });

  const [studentFormData, setStudentFormData] = useState({
    photo: '',
    name: '',
    registerNumber: '',
    rollNumber: '',
    department: '',
    year: 'I',
    batch: '2023-2026',
    email: '',
    phone: '',
    parentContact: '',
    password: '',
    confirmPassword: '',
    status: 'Active' as 'Active' | 'Suspended'
  });

  // Security Password Modal
  const [securityModal, setSecurityModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    targetId: string;
    targetType: 'college' | 'student' | 'bulk_students';
    passwordInput: string;
    error: string | null;
  }>({
    isOpen: false,
    title: '',
    description: '',
    targetId: '',
    targetType: 'student',
    passwordInput: '',
    error: null
  });

  // ---------------------------------------------------------------------------
  // HANDLERS FOR COLLEGE MANAGEMENT
  // ---------------------------------------------------------------------------
  const handleOpenAddCollege = () => {
    setEditingCollege(null);
    setCollegeFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      contactPerson: '',
      email: '',
      phone: '',
      status: 'active'
    });
    setIsAddCollegeModalOpen(true);
  };

  const handleOpenEditCollege = (col: College) => {
    setEditingCollege(col);
    setCollegeFormData({
      name: col.name,
      code: col.code,
      address: col.address,
      city: col.city,
      state: col.state,
      contactPerson: col.contactPerson,
      email: col.email,
      phone: col.phone,
      status: col.status
    });
    setIsAddCollegeModalOpen(true);
  };

  const handleSubmitCollegeForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeFormData.name.trim() || !collegeFormData.code.trim()) {
      showToast('College Name and Code are required!');
      return;
    }

    if (editingCollege) {
      onEditCollege({ ...editingCollege, ...collegeFormData });
      showToast(`Updated "${collegeFormData.name}" successfully!`);
    } else {
      onAddCollege(collegeFormData);
      showToast(`College "${collegeFormData.name}" onboarded successfully!`);
    }
    setIsAddCollegeModalOpen(false);
  };

  const handlePromptDeleteCollege = (col: College) => {
    setSecurityModal({
      isOpen: true,
      title: `Delete College: ${col.name}`,
      description: `Deleting ${col.name} will unlink all associated canteens and student records. Enter Super Admin password to confirm.`,
      targetId: col.id,
      targetType: 'college',
      passwordInput: '',
      error: null
    });
  };

  // ---------------------------------------------------------------------------
  // HANDLERS FOR ACADEMIC SETTINGS & DEPARTMENTS
  // ---------------------------------------------------------------------------
  const handleSaveAcademicSettings = (updated: CollegeAcademicSettings) => {
    if (!selectedCollegeId) return;
    setAcademicSettingsMap(prev => ({
      ...prev,
      [selectedCollegeId]: updated
    }));
    setIsSettingsModalOpen(false);
    showToast('College Academic & Registration Settings updated!');
  };

  const handleAddOrEditDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFormData.name.trim() || !deptFormData.code.trim()) {
      showToast('Department Name and Code are required.');
      return;
    }

    const currentSettings = { ...currentAcademicSettings };
    let depts = [...currentSettings.departments];

    if (editingDeptId) {
      depts = depts.map(d => d.id === editingDeptId ? { ...d, name: deptFormData.name, code: deptFormData.code } : d);
      showToast(`Department "${deptFormData.name}" updated.`);
    } else {
      const newDept: Department = {
        id: `dept-${Date.now()}`,
        name: deptFormData.name,
        code: deptFormData.code.toUpperCase(),
        studentCount: 0
      };
      depts.push(newDept);
      showToast(`Department "${deptFormData.name}" added to ${selectedCollege?.name}.`);
    }

    handleSaveAcademicSettings({ ...currentSettings, departments: depts });
    setDeptFormData({ name: '', code: '' });
    setEditingDeptId(null);
    setIsDeptModalOpen(false);
  };

  const handleDeleteDepartment = (deptId: string) => {
    const currentSettings = { ...currentAcademicSettings };
    const depts = currentSettings.departments.filter(d => d.id !== deptId);
    handleSaveAcademicSettings({ ...currentSettings, departments: depts });
    showToast('Department removed.');
  };

  // ---------------------------------------------------------------------------
  // HANDLERS FOR STUDENT MANAGEMENT
  // ---------------------------------------------------------------------------
  const generateStudentRegistrationNumber = () => {
    const prefix = currentAcademicSettings.regPrefix || '23CT';
    const startNum = currentAcademicSettings.startingNumber || 1;
    const currentCount = currentCollegeStudents.length;
    const num = startNum + currentCount;
    return `${prefix}${String(num).padStart(3, '0')}`;
  };

  const generateStudentEmail = (name: string) => {
    const clean = name.toLowerCase().replace(/[^a-z]/g, '');
    const domain = selectedCollegeId === 'col-1' ? 'psgtech.ac.in' : selectedCollegeId === 'col-2' ? 'cit.edu.in' : 'kprcas.ac.in';
    return `${clean || 'student'}.26k24@${domain}`;
  };

  const handleOpenAddStudent = () => {
    const autoReg = generateStudentRegistrationNumber();
    const autoRoll = `${currentAcademicSettings.regPrefix}-R${100 + currentCollegeStudents.length + 1}`;
    setEditingStudent(null);
    setStudentFormData({
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      name: '',
      registerNumber: autoReg,
      rollNumber: autoRoll,
      department: currentAcademicSettings.departments[0]?.name || 'B.Sc Computer Science',
      year: 'I',
      batch: '2023-2026',
      email: '',
      phone: '',
      parentContact: '',
      password: '',
      confirmPassword: '',
      status: 'Active'
    });
    setIsAddStudentModalOpen(true);
  };

  const handleOpenEditStudent = (std: CollegeStudent) => {
    setEditingStudent(std);
    setStudentFormData({
      photo: std.photo,
      name: std.name,
      registerNumber: std.registerNumber,
      rollNumber: std.rollNumber,
      department: std.department,
      year: std.year,
      batch: std.batch,
      email: std.email,
      phone: std.phone,
      parentContact: std.parentContact,
      password: '',
      confirmPassword: '',
      status: std.status
    });
    setIsAddStudentModalOpen(true);
  };

  const handleSubmitStudentForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollegeId) return;

    if (!studentFormData.name.trim() || !studentFormData.registerNumber.trim()) {
      showToast('Student Name and Register Number are required!');
      return;
    }

    const currentList = studentsMap[selectedCollegeId] || [];
    let updatedList: CollegeStudent[];

    if (editingStudent) {
      updatedList = currentList.map(s => s.id === editingStudent.id ? {
        ...s,
        photo: studentFormData.photo || s.photo,
        name: studentFormData.name,
        registerNumber: studentFormData.registerNumber,
        rollNumber: studentFormData.rollNumber,
        department: studentFormData.department,
        year: studentFormData.year,
        batch: studentFormData.batch,
        email: studentFormData.email || generateStudentEmail(studentFormData.name),
        phone: studentFormData.phone,
        parentContact: studentFormData.parentContact,
        status: studentFormData.status
      } : s);
      showToast(`Updated student profile for "${studentFormData.name}".`);
    } else {
      const newStudent: CollegeStudent = {
        id: `cstd-${selectedCollegeId}-${Date.now()}`,
        collegeId: selectedCollegeId,
        photo: studentFormData.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
        name: studentFormData.name,
        registerNumber: studentFormData.registerNumber,
        rollNumber: studentFormData.rollNumber,
        department: studentFormData.department,
        year: studentFormData.year,
        batch: studentFormData.batch,
        email: studentFormData.email || generateStudentEmail(studentFormData.name),
        phone: studentFormData.phone || '+91 98940 12345',
        parentContact: studentFormData.parentContact || '+91 94430 98765',
        status: studentFormData.status,
        reportsCount: 0,
        createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
      updatedList = [newStudent, ...currentList];
      showToast(`Student "${studentFormData.name}" registered successfully.`);
    }

    setStudentsMap(prev => ({ ...prev, [selectedCollegeId]: updatedList }));
    setIsAddStudentModalOpen(false);
  };

  const handleToggleStudentStatus = (studentId: string) => {
    if (!selectedCollegeId) return;
    const currentList = studentsMap[selectedCollegeId] || [];
    const updatedList = currentList.map(s => {
      if (s.id === studentId) {
        const nextStatus = s.status === 'Active' ? 'Suspended' : 'Active';
        showToast(`Student ${s.name} is now ${nextStatus}.`);
        return { ...s, status: nextStatus as 'Active' | 'Suspended' };
      }
      return s;
    });
    setStudentsMap(prev => ({ ...prev, [selectedCollegeId]: updatedList }));
    if (viewingStudentDetail && viewingStudentDetail.id === studentId) {
      setViewingStudentDetail(prev => prev ? { ...prev, status: prev.status === 'Active' ? 'Suspended' : 'Active' } : null);
    }
  };

  const handlePromptDeleteStudent = (std: CollegeStudent) => {
    setSecurityModal({
      isOpen: true,
      title: `Delete Student: ${std.name}`,
      description: `Permanently delete ${std.name} (${std.registerNumber})? Super Admin password required.`,
      targetId: std.id,
      targetType: 'student',
      passwordInput: '',
      error: null
    });
  };

  const handleVerifySecurityPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityModal.passwordInput.trim() !== 'admin123' && securityModal.passwordInput.trim() !== 'admin') {
      setSecurityModal(prev => ({ ...prev, error: 'Invalid Super Admin Password. Access Denied!' }));
      return;
    }

    if (securityModal.targetType === 'college') {
      onDeleteCollege(securityModal.targetId);
      showToast('College deleted successfully.');
      if (selectedCollegeId === securityModal.targetId) {
        setViewMode('list');
        setSelectedCollegeId(null);
      }
    } else if (securityModal.targetType === 'student' && selectedCollegeId) {
      const currentList = studentsMap[selectedCollegeId] || [];
      const updatedList = currentList.filter(s => s.id !== securityModal.targetId);
      setStudentsMap(prev => ({ ...prev, [selectedCollegeId]: updatedList }));
      showToast('Student account deleted.');
      if (viewingStudentDetail && viewingStudentDetail.id === securityModal.targetId) {
        setViewingStudentDetail(null);
      }
    }

    setSecurityModal({ isOpen: false, title: '', description: '', targetId: '', targetType: 'student', passwordInput: '', error: null });
  };

  const handleAddStudentReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingStudentDetail) return;
    if (!reportFormData.description.trim()) {
      showToast('Report description is required.');
      return;
    }

    const newReport: StudentReport = {
      id: `rep-${Date.now()}`,
      studentId: viewingStudentDetail.id,
      studentName: viewingStudentDetail.name,
      reportDate: new Date().toISOString().split('T')[0],
      reportType: reportFormData.reportType,
      description: reportFormData.description,
      createdBy: reportFormData.createdBy,
      status: 'Pending'
    };

    setStudentReports(prev => [newReport, ...prev]);

    if (selectedCollegeId) {
      const currentList = studentsMap[selectedCollegeId] || [];
      const updatedList = currentList.map(s => s.id === viewingStudentDetail.id ? { ...s, reportsCount: s.reportsCount + 1 } : s);
      setStudentsMap(prev => ({ ...prev, [selectedCollegeId]: updatedList }));
      setViewingStudentDetail(prev => prev ? { ...prev, reportsCount: prev.reportsCount + 1 } : null);
    }

    setIsAddReportModalOpen(false);
    setReportFormData({ reportType: 'Payment Dispute', description: '', createdBy: 'Super Admin' });
    showToast('Report submitted against student.');
  };

  // ---------------------------------------------------------------------------
  // EXPORT UTILITIES (CSV)
  // ---------------------------------------------------------------------------
  const handleExportCSV = (type: 'colleges' | 'canteens' | 'students') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = 'export.csv';

    if (type === 'colleges') {
      headers = ['College Name', 'Code', 'City', 'State', 'Contact Person', 'Email', 'Phone', 'Status'];
      rows = colleges.map(c => [c.name, c.code, c.city, c.state, c.contactPerson, c.email, c.phone, c.status]);
      filename = `Colleges_Export_${Date.now()}.csv`;
    } else if (type === 'canteens') {
      headers = ['Canteen Name', 'Owner Name', 'Phone', 'Email', 'College', 'Payment Status', 'Status', 'Total Revenue'];
      rows = filteredCollegeCanteens.map(c => [c.name, c.owner, c.phone, c.email, c.college, c.verificationStatus, c.status, String(c.monthlySales || c.todaySales || 485000)]);
      filename = `${selectedCollege?.code || 'College'}_Canteens_${Date.now()}.csv`;
    } else if (type === 'students') {
      headers = ['Student Name', 'Register Number', 'Roll Number', 'Department', 'Year', 'Batch', 'Email', 'Phone', 'Status', 'Reports Count'];
      rows = filteredCollegeStudents.map(s => [s.name, s.registerNumber, s.rollNumber, s.department, s.year, s.batch, s.email, s.phone, s.status, String(s.reportsCount)]);
      filename = `${selectedCollege?.code || 'College'}_Students_${Date.now()}.csv`;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filename} successfully!`);
  };

  // ---------------------------------------------------------------------------
  // COMPUTED STATS FOR OVERVIEW CARDS (EXACTLY 6 CARDS AS SPECIFIED)
  // ---------------------------------------------------------------------------
  const overviewStats = useMemo(() => {
    if (!selectedCollege) return null;
    const countCanteens = collegeCanteens.length;
    const activeCanteens = collegeCanteens.filter(c => c.status === 'Active' || c.status === 'active').length;
    const countStudents = currentCollegeStudents.length;
    const activeStudents = currentCollegeStudents.filter(s => s.status === 'Active').length;
    
    const canteenIds = new Set(collegeCanteens.map(c => c.id));
    const matchingOrders = orders.filter(o => canteenIds.has(o.canteen_id));
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = matchingOrders.filter(o => o.created_at?.startsWith(todayStr));
    
    const todayRev = todayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || (activeCanteens * 2850);
    const totalRev = matchingOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || (activeCanteens * 142000);
    const totalReports = studentReports.length;

    return {
      studentsCount: countStudents,
      activeStudents,
      canteensCount: countCanteens,
      activeCanteens,
      todayOrdersCount: todayOrders.length || (activeCanteens * 18),
      todayRev,
      totalRev,
      totalReports,
      status: selectedCollege.status
    };
  }, [selectedCollege, collegeCanteens, currentCollegeStudents, orders, studentReports]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-[1600px] mx-auto font-sans text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-6 z-[9999] bg-slate-950 text-white dark:bg-emerald-500 dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3 animate-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-emerald-400 dark:text-slate-950 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: COLLEGE LIST PAGE
         ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">College Management</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hierarchical multi-campus SaaS node directory.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => showToast('Refreshed college directory.')}
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                title="Refresh Directory"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleOpenAddCollege}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add New College
              </button>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                placeholder="Search college by name, code, city, email, or contact person..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 font-medium">Status:</span>
                <select
                  value={listStatusFilter}
                  onChange={(e) => setListStatusFilter(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="all">All Colleges</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>
              </div>

              <button
                onClick={() => handleExportCSV('colleges')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>

          {/* Colleges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredColleges.map((col) => {
              const countCanteens = canteens.filter(c => c.collegeId === col.id || c.college_id === col.id || c.college.toLowerCase().trim() === col.name.toLowerCase().trim()).length;
              const countStudents = (studentsMap[col.id] || []).length || 45;
              const isSuspended = col.status === 'inactive';

              return (
                <div
                  key={col.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 text-emerald-400 font-black flex items-center justify-center text-sm shadow-md shrink-0 border border-slate-800">
                        {col.code.substring(0, 3)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-950 dark:text-white text-base leading-snug group-hover:text-emerald-600 transition-colors">
                          {col.name}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">Code: <strong className="text-slate-700 dark:text-slate-300">{col.code}</strong></p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold capitalize ${
                      !isSuspended ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-red-100 text-red-800'
                    }`}>
                      {!isSuspended ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">City</span>
                      <span className="font-medium">{col.city}, {col.state || 'TN'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</span>
                      <span className="font-bold text-slate-900 dark:text-white">{col.contactPerson}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-600">Canteens</span>
                      <p className="text-xl font-black text-slate-950 dark:text-white mt-0.5">{countCanteens}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                      <span className="text-[10px] font-extrabold uppercase text-blue-600">Students</span>
                      <p className="text-xl font-black text-slate-950 dark:text-white mt-0.5">{countStudents}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedCollegeId(col.id);
                        setViewMode('college_detail');
                        setActiveTab('overview');
                      }}
                      className="flex-1 py-2.5 bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 hover:bg-black font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEditCollege(col)}
                      className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 transition-all"
                      title="Edit College"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handlePromptDeleteCollege(col)}
                      className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 transition-all"
                      title="Delete College"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: REDESIGNED COLLEGE DETAILS PAGE (5 SECTIONS)
         ========================================================================= */}
      {viewMode === 'college_detail' && selectedCollege && overviewStats && (
        <div className="space-y-6">
          {/* ---------------------------------------------------------------------
              SECTION 1: BREADCRUMB
             --------------------------------------------------------------------- */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('list')}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-all font-bold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Colleges
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="text-xs font-bold flex items-center gap-2">
                <span className="text-slate-400">Colleges</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-950 dark:text-white font-black">{selectedCollege.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                Node ID: {selectedCollege.id}
              </span>
            </div>
          </div>

          {/* ---------------------------------------------------------------------
              SECTION 2: COLLEGE HEADER
             --------------------------------------------------------------------- */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              {/* Left Side: Logo, Name, Code, Active Badge */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 text-emerald-400 font-black flex items-center justify-center text-xl shadow-md shrink-0 border border-slate-800">
                  {selectedCollege.code.substring(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">{selectedCollege.name}</h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      selectedCollege.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                    }`}>
                      {selectedCollege.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    College Code: <strong className="text-slate-800 dark:text-slate-200 font-bold">{selectedCollege.code}</strong>
                  </p>
                </div>
              </div>

              {/* Right Side: Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditCollege(selectedCollege)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Edit className="w-4 h-4 text-blue-600" /> Edit College
                </button>
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <Settings className="w-4 h-4" /> College Settings
                </button>
              </div>
            </div>

            {/* Below: Address, Contact Person, Email, Phone */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Address</p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedCollege.address || 'Avinashi Road Campus'}, {selectedCollege.city}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</p>
                <p className="font-bold text-slate-950 dark:text-white mt-0.5">{selectedCollege.contactPerson || 'Dr. Principal'}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">{selectedCollege.email}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">{selectedCollege.phone || '+91 422 2635678'}</p>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------------
              SECTION 3: OVERVIEW CARDS (EXACTLY 6 CARDS ONLY - NO DUPLICATES)
             --------------------------------------------------------------------- */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* 1. Students */}
            <div 
              onClick={() => setActiveTab('students')}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-emerald-600 transition-colors">Students</span>
              <p className="text-2xl font-black text-slate-950 dark:text-white mt-2">{overviewStats.studentsCount}</p>
              <span className="text-[10px] font-bold text-emerald-600 mt-1">{overviewStats.activeStudents} Active</span>
            </div>

            {/* 2. Canteens */}
            <div 
              onClick={() => setActiveTab('canteens')}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-blue-600 transition-colors">Canteens</span>
              <p className="text-2xl font-black text-slate-950 dark:text-white mt-2">{overviewStats.canteensCount}</p>
              <span className="text-[10px] font-bold text-blue-600 mt-1">{overviewStats.activeCanteens} Active Outlets</span>
            </div>

            {/* 3. Today's Orders */}
            <div 
              onClick={() => setActiveTab('overview')}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-emerald-600 transition-colors">Today's Orders</span>
              <p className="text-2xl font-black text-emerald-600 mt-2">{overviewStats.todayOrdersCount}</p>
              <span className="text-[10px] text-slate-400 mt-1">Live tickets</span>
            </div>

            {/* 4. Revenue */}
            <div 
              onClick={() => setActiveTab('overview')}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-emerald-600 transition-colors">Revenue</span>
              <p className="text-xl font-black text-emerald-600 mt-2 truncate">₹{overviewStats.todayRev.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400 mt-1">Today's gross</span>
            </div>

            {/* 5. Reports */}
            <div 
              onClick={() => setActiveTab('overview')}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-amber-600 transition-colors">Reports</span>
              <p className="text-2xl font-black text-amber-500 mt-2">{overviewStats.totalReports}</p>
              <span className="text-[10px] text-amber-600 font-bold mt-1">Student disputes</span>
            </div>

            {/* 6. Status */}
            <div 
              onClick={() => setActiveTab('overview')}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-400 hover:shadow-md transition-all group"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
              <p className="text-xl font-black text-slate-950 dark:text-white mt-2 capitalize">{selectedCollege.status}</p>
              <span className="text-[10px] text-emerald-600 font-bold mt-1">Node operational</span>
            </div>
          </div>

          {/* ---------------------------------------------------------------------
              SECTION 4: NAVIGATION TABS (Overview, Students, Canteens)
             --------------------------------------------------------------------- */}
          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-1.5">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'students', label: `Students (${currentCollegeStudents.length})`, icon: Users },
              { id: 'canteens', label: `Canteens (${collegeCanteens.length})`, icon: Store }
            ].map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                    isActive 
                      ? 'bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 shadow-md' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* ---------------------------------------------------------------------
              SECTION 5: ACTIVE MODULE CONTENT (LAZY RENDERED TAB CONTENT)
             --------------------------------------------------------------------- */}

          {/* TAB 1: OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200 text-xs">
              {/* Recent Activity */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-950 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" /> Recent Campus Activity
                </h3>
                <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-2 space-y-4 py-1">
                  {[
                    { time: '10 mins ago', title: 'New Canteen Settlement', desc: '₹24,500 transferred to Tech Park Central' },
                    { time: '1 hour ago', title: 'Student Onboarded', desc: 'Aarav Sharma added under CSE Dept' },
                    { time: '3 hours ago', title: 'FSSAI License Verified', desc: 'Valley Diner verified by Super Admin' },
                    { time: 'Yesterday', title: 'Academic Settings Updated', desc: 'Prefix updated to 23PSG' }
                  ].map((ev, i) => (
                    <div key={i} className="relative pl-5">
                      <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                      <p className="font-bold text-slate-950 dark:text-white text-xs">{ev.title}</p>
                      <p className="text-slate-500 mt-0.5 text-[11px]">{ev.desc}</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{ev.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-950 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600" /> Recent Orders Summary
                </h3>
                <div className="space-y-2.5">
                  {[
                    { id: '#TM-9081', canteen: 'Tech Park Central', amount: 280, status: 'Delivered' },
                    { id: '#TM-9080', canteen: 'Main Campus Diner', amount: 140, status: 'Preparing' },
                    { id: '#TM-9079', canteen: 'Hostel Night Canteen', amount: 320, status: 'Delivered' },
                    { id: '#TM-9078', canteen: 'Tech Park Central', amount: 190, status: 'Delivered' }
                  ].map((ord) => (
                    <div key={ord.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                      <div>
                        <p className="font-mono font-bold text-slate-950 dark:text-white">{ord.id}</p>
                        <p className="text-[11px] text-slate-400">{ord.canteen}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-600">₹{ord.amount}</p>
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">{ord.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reports & Quick Stats */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-950 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Student Reports & Quick Stats
                </h3>
                <div className="space-y-2.5">
                  {studentReports.map(rep => (
                    <div key={rep.id} className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                      <div className="flex justify-between font-bold text-slate-950 dark:text-white text-xs">
                        <span>{rep.studentName}</span>
                        <span className="text-[10px] font-mono text-amber-600 uppercase">{rep.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{rep.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENTS MANAGEMENT TAB */}
          {activeTab === 'students' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Top Toolbar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search student by name, register number, roll number..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Depts</option>
                    {currentAcademicSettings.departments.map(d => (
                      <option key={d.id} value={d.name}>{d.code}</option>
                    ))}
                  </select>

                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Years</option>
                    {currentAcademicSettings.years.map(y => (
                      <option key={y} value={y}>{y} Yr</option>
                    ))}
                  </select>

                  <select
                    value={studentStatusFilter}
                    onChange={(e) => setStudentStatusFilter(e.target.value as any)}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>

                  <button
                    onClick={handleOpenAddStudent}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Student
                  </button>

                  <button
                    onClick={() => setIsDeptModalOpen(true)}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-600" /> Departments
                  </button>

                  <button
                    onClick={() => handleExportCSV('students')}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>

              {/* Student Table with Sticky Header, Hover Effect, Rounded Container, Alternate Rows, Compact Height */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black border-b border-slate-200 dark:border-slate-700 shadow-xs">
                      <tr>
                        <th className="p-3 w-10">
                          <input
                            type="checkbox"
                            checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentCheckboxes.has(s.id))}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedStudentCheckboxes(new Set(paginatedStudents.map(s => s.id)));
                              else setSelectedStudentCheckboxes(new Set());
                            }}
                            className="w-3.5 h-3.5 rounded accent-emerald-600 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Photo</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Register Number</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Year</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-center">Reports</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {paginatedStudents.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            No students match current filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedStudents.map((std) => {
                          const isSelected = selectedStudentCheckboxes.has(std.id);
                          const isSuspended = std.status === 'Suspended';
                          const isDropdownOpen = activeActionDropdownId === std.id;

                          return (
                            <tr
                              key={std.id}
                              className={`hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 transition-colors even:bg-slate-50/50 dark:even:bg-slate-800/20 ${
                                isSelected ? 'bg-emerald-100/50 dark:bg-emerald-950/30' : ''
                              }`}
                            >
                              <td className="p-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    const next = new Set(selectedStudentCheckboxes);
                                    if (next.has(std.id)) next.delete(std.id);
                                    else next.add(std.id);
                                    setSelectedStudentCheckboxes(next);
                                  }}
                                  className="w-3.5 h-3.5 rounded accent-emerald-600 cursor-pointer"
                                />
                              </td>

                              <td className="p-3">
                                <img src={std.photo} alt={std.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                              </td>

                              <td className="p-3 font-extrabold text-slate-950 dark:text-white">
                                {std.name}
                              </td>

                              <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                                {std.registerNumber}
                              </td>

                              <td className="p-3 text-slate-600 dark:text-slate-300">
                                {std.department}
                              </td>

                              <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                                {std.year}
                              </td>

                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  !isSuspended ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-red-100 text-red-800'
                                }`}>
                                  {!isSuspended ? 'Active' : 'Suspended'}
                                </span>
                              </td>

                              <td className="p-3 text-center">
                                {std.reportsCount > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[9px]">
                                    {std.reportsCount}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">0</span>
                                )}
                              </td>

                              {/* Action Buttons: View visible, secondary inside ⋮ Menu */}
                              <td className="p-3 text-right relative">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setViewingStudentDetail(std)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10px] rounded-lg"
                                  >
                                    View
                                  </button>

                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveActionDropdownId(isDropdownOpen ? null : std.id);
                                      }}
                                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                                      title="More Actions"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {/* Three-Dot Popover Menu */}
                                    {isDropdownOpen && (
                                      <div className="absolute right-0 top-7 z-30 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 text-left text-[11px] font-bold space-y-0.5 animate-in fade-in zoom-in-95">
                                        <button
                                          onClick={() => {
                                            setActiveActionDropdownId(null);
                                            handleOpenEditStudent(std);
                                          }}
                                          className="w-full px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                                        >
                                          <Edit className="w-3.5 h-3.5 text-blue-600" /> Edit
                                        </button>

                                        <button
                                          onClick={() => {
                                            setActiveActionDropdownId(null);
                                            handleToggleStudentStatus(std.id);
                                          }}
                                          className="w-full px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                                        >
                                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> {std.status === 'Active' ? 'Suspend' : 'Activate'}
                                        </button>

                                        <button
                                          onClick={() => {
                                            setActiveActionDropdownId(null);
                                            handlePromptDeleteStudent(std);
                                          }}
                                          className="w-full px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-1.5"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-red-600" /> Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* STRICT PAGINATION: EXACTLY 20 PER PAGE */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-800/40">
                  <span>
                    Showing {filteredCollegeStudents.length === 0 ? 0 : (studentPage - 1) * STUDENTS_PER_PAGE + 1} to {Math.min(studentPage * STUDENTS_PER_PAGE, filteredCollegeStudents.length)} of {filteredCollegeStudents.length} Students
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={studentPage === 1}
                      onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                    >
                      Previous
                    </button>

                    {Array.from({ length: Math.min(5, totalStudentPages) }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setStudentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-black ${
                            studentPage === pageNum
                              ? 'bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      disabled={studentPage >= totalStudentPages}
                      onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                      className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CANTEENS MANAGEMENT TAB */}
          {activeTab === 'canteens' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Top Toolbar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={canteenSearch}
                    onChange={(e) => setCanteenSearch(e.target.value)}
                    placeholder="Search canteen by name, owner, email..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <select
                    value={canteenStatusFilter}
                    onChange={(e) => setCanteenStatusFilter(e.target.value as any)}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>

                  <select
                    value={canteenPaymentFilter}
                    onChange={(e) => setCanteenPaymentFilter(e.target.value as any)}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Payment Statuses</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending Verification</option>
                  </select>

                  <button
                    onClick={() => handleExportCSV('canteens')}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>

              {/* Canteens Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black border-b border-slate-200 dark:border-slate-700 shadow-xs">
                      <tr>
                        <th className="p-3 w-10">
                          <input type="checkbox" className="w-3.5 h-3.5 rounded accent-emerald-600 cursor-pointer" />
                        </th>
                        <th className="p-3">Canteen</th>
                        <th className="p-3">Owner</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Payment Status</th>
                        <th className="p-3 text-right">Revenue</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredCollegeCanteens.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            No canteens match current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredCollegeCanteens.map((cnt) => {
                          const isVerified = cnt.verificationStatus === 'Verified';
                          const isSuspended = cnt.status === 'Inactive' || cnt.status === 'Suspended';
                          const totalRev = cnt.monthlySales || cnt.todaySales || 485000;
                          const isDropdownOpen = activeActionDropdownId === cnt.id;

                          return (
                            <tr key={cnt.id} className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 transition-colors even:bg-slate-50/50 dark:even:bg-slate-800/20">
                              <td className="p-3">
                                <input type="checkbox" className="w-3.5 h-3.5 rounded accent-emerald-600 cursor-pointer" />
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <img src={cnt.logo || cnt.image} alt={cnt.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                                  <p className="font-extrabold text-slate-950 dark:text-white">{cnt.name}</p>
                                </div>
                              </td>

                              <td className="p-3 text-slate-700 dark:text-slate-300">
                                {cnt.owner}
                              </td>

                              <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                                {cnt.phone}
                              </td>

                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  !isSuspended ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-red-100 text-red-800'
                                }`}>
                                  {!isSuspended ? 'Active' : 'Suspended'}
                                </span>
                              </td>

                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  isVerified ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isVerified ? 'Verified' : 'Pending'}
                                </span>
                              </td>

                              <td className="p-3 text-right font-black text-emerald-600">
                                ₹{totalRev.toLocaleString()}
                              </td>

                              <td className="p-3 text-right relative">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedCanteenDetail(cnt);
                                      setIsCanteenDetailModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10px] rounded-lg"
                                  >
                                    View
                                  </button>

                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveActionDropdownId(isDropdownOpen ? null : cnt.id);
                                      }}
                                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                                      title="More Actions"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {/* Three-Dot Popover Menu */}
                                    {isDropdownOpen && (
                                      <div className="absolute right-0 top-7 z-30 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 text-left text-[11px] font-bold space-y-0.5 animate-in fade-in zoom-in-95">
                                        <button
                                          onClick={() => {
                                            setActiveActionDropdownId(null);
                                            showToast('Editing canteen account...');
                                          }}
                                          className="w-full px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                                        >
                                          <Edit className="w-3.5 h-3.5 text-blue-600" /> Edit
                                        </button>

                                        <button
                                          onClick={() => {
                                            setActiveActionDropdownId(null);
                                            showToast('Toggled canteen status.');
                                          }}
                                          className="w-full px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                                        >
                                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Suspend
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODALS & DRAWERS (CANTEEN DETAILS, STUDENT DETAILS, SETTINGS, DEPARTMENTS)
         ========================================================================= */}
      {/* Canteen Details Modal */}
      {isCanteenDetailModalOpen && selectedCanteenDetail && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-4 p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img src={selectedCanteenDetail.logo || selectedCanteenDetail.image} alt={selectedCanteenDetail.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                <div>
                  <h2 className="text-lg font-black text-slate-950 dark:text-white">{selectedCanteenDetail.name}</h2>
                  <p className="text-xs text-slate-500">Manager: {selectedCanteenDetail.owner}</p>
                </div>
              </div>
              <button onClick={() => setIsCanteenDetailModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400">Bank Name</p>
                <p className="font-bold">{selectedCanteenDetail.bankDetails?.bankName || 'HDFC Bank'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400">Account Number</p>
                <p className="font-mono font-bold">•••• •••• {selectedCanteenDetail.bankDetails?.accountNumber?.slice(-4) || '8912'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400">IFSC Code</p>
                <p className="font-mono font-bold">{selectedCanteenDetail.bankDetails?.ifsc || 'HDFC0001234'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400">UPI ID</p>
                <p className="font-mono font-bold text-emerald-600">{selectedCanteenDetail.email.split('@')[0]}@okaxis</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => setIsCanteenDetailModalOpen(false)} className="px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {viewingStudentDetail && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-4 p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img src={viewingStudentDetail.photo} alt={viewingStudentDetail.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                <div>
                  <h2 className="text-lg font-black text-slate-950 dark:text-white">{viewingStudentDetail.name}</h2>
                  <p className="text-xs text-slate-500">Reg No: {viewingStudentDetail.registerNumber} • {viewingStudentDetail.department}</p>
                </div>
              </div>
              <button onClick={() => setViewingStudentDetail(null)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <p><strong className="text-slate-400">Email:</strong> {viewingStudentDetail.email}</p>
                <p><strong className="text-slate-400">Phone:</strong> {viewingStudentDetail.phone}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <p><strong className="text-slate-400">Year:</strong> {viewingStudentDetail.year} Year</p>
                <p><strong className="text-slate-400">Parent Contact:</strong> {viewingStudentDetail.parentContact}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => setViewingStudentDetail(null)} className="px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* College Settings Modal */}
      {isSettingsModalOpen && selectedCollege && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-lg text-slate-950 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" /> College Settings
              </h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Registration Prefix</label>
                <input
                  type="text"
                  value={currentAcademicSettings.regPrefix}
                  onChange={(e) => handleSaveAcademicSettings({
                    ...currentAcademicSettings,
                    regPrefix: e.target.value.toUpperCase()
                  })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase text-emerald-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Starting Reg Number</label>
                <input
                  type="number"
                  value={currentAcademicSettings.startingNumber}
                  onChange={(e) => handleSaveAcademicSettings({
                    ...currentAcademicSettings,
                    startingNumber: Number(e.target.value) || 1
                  })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => setIsSettingsModalOpen(false)} className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Departments Modal */}
      {isDeptModalOpen && selectedCollege && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-lg text-slate-950 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" /> College Departments
              </h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOrEditDepartment} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={deptFormData.name}
                  onChange={(e) => setDeptFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Dept Name"
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
                <input
                  type="text"
                  required
                  value={deptFormData.code}
                  onChange={(e) => setDeptFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="Code (e.g. CSE)"
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs uppercase"
                />
              </div>
              <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg">
                + Add Dept
              </button>
            </form>

            <div className="space-y-1.5 text-xs">
              {currentAcademicSettings.departments.map(d => (
                <div key={d.id} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center font-semibold">
                  <span>{d.name} ({d.code})</span>
                  <button onClick={() => handleDeleteDepartment(d.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Student Modal */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <form onSubmit={handleSubmitStudentForm} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-3 animate-in zoom-in-95 text-xs font-semibold">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-lg text-slate-950 dark:text-white">
                {editingStudent ? 'Edit Student' : 'Register New Student'}
              </h3>
              <button type="button" onClick={() => setIsAddStudentModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={studentFormData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setStudentFormData(prev => ({ ...prev, name, email: generateStudentEmail(name) }));
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 mb-1">Register No *</label>
                <input
                  type="text"
                  required
                  value={studentFormData.registerNumber}
                  onChange={(e) => setStudentFormData(prev => ({ ...prev, registerNumber: e.target.value.toUpperCase() }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Roll No *</label>
                <input
                  type="text"
                  required
                  value={studentFormData.rollNumber}
                  onChange={(e) => setStudentFormData(prev => ({ ...prev, rollNumber: e.target.value.toUpperCase() }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 mb-1">Department</label>
                <select
                  value={studentFormData.department}
                  onChange={(e) => setStudentFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {currentAcademicSettings.departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Year</label>
                <select
                  value={studentFormData.year}
                  onChange={(e) => setStudentFormData(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {currentAcademicSettings.years.map(y => (
                    <option key={y} value={y}>{y} Year</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddStudentModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">
                Save Student
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Password Confirmation Modal */}
      {securityModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleVerifySecurityPassword} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-red-200 dark:border-red-900/60 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-8 h-8" />
              <div>
                <h3 className="font-black text-lg text-slate-950 dark:text-white">{securityModal.title}</h3>
                <p className="text-xs text-slate-500">Security Verification</p>
              </div>
            </div>

            {securityModal.error && (
              <div className="p-3 rounded-xl bg-red-100 text-red-800 text-xs font-bold">
                {securityModal.error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Enter Super Admin Password *</label>
              <input
                type="password"
                required
                value={securityModal.passwordInput}
                onChange={(e) => setSecurityModal(prev => ({ ...prev, passwordInput: e.target.value, error: null }))}
                placeholder="••••••••"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setSecurityModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl">
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl shadow-md">
                Confirm Delete
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CollegeManagementView;
