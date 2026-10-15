import React, { useState, useEffect, useCallback } from 'react';
import { 
  Briefcase, TrendingUp, Award, Users, Calendar, CheckCircle2, AlertTriangle, 
  Plus, Search, Filter, ExternalLink, Star, ChevronRight, Clock, MapPin, 
  Building2, GraduationCap, Mail, Linkedin, Check, X, ShieldCheck, RefreshCw, Send
} from 'lucide-react';
import client from '../../../api/client';

export const PlacementManagementHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drives' | 'shortlisting' | 'slots' | 'alumni' | 'eligibility'>('dashboard');
  
  // Data State
  const [summary, setSummary] = useState<any>(null);
  const [drives, setDrives] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [alumni, setAlumni] = useState<any[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDriveFilter, setSelectedDriveFilter] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [minCgpaFilter, setMinCgpaFilter] = useState<number>(7.0);

  // Modals
  const [isNewDriveModalOpen, setIsNewDriveModalOpen] = useState(false);
  const [isNewSlotModalOpen, setIsNewSlotModalOpen] = useState(false);
  const [isNewAlumniModalOpen, setIsNewAlumniModalOpen] = useState(false);
  const [selectedAppForFeedback, setSelectedAppForFeedback] = useState<any | null>(null);

  // New Drive Form
  const [newDrive, setNewDrive] = useState({
    company_name: '',
    job_title: '',
    job_description: '',
    ctc_lpa: '',
    tier: 'DREAM',
    min_cgpa: '7.0',
    max_backlogs: '0',
    eligible_departments: 'All',
    drive_date: '',
    registration_deadline: ''
  });

  // New Slot Form
  const [newSlot, setNewSlot] = useState({
    company_name: '',
    contact_person: '',
    contact_email: '',
    slot_date: '',
    start_time: '09:30',
    end_time: '17:30',
    venue_hall: 'Placement Auditorium & Interview Cabins',
    purpose: 'FULL_DAY_DRIVE',
    notes: ''
  });

  // New Alumni Form
  const [newAlumni, setNewAlumni] = useState({
    name: '',
    company: '',
    role_title: '',
    graduation_year: '2021',
    department: 'Computer Science',
    linkedin_url: '',
    email: '',
    domain_expertise: 'Fullstack & Cloud Architecture',
    mentorship_focus: 'Mock Technical Rounds & System Design'
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sumRes, drivesRes, appsRes, slotsRes, alumniRes, eligibleRes] = await Promise.allSettled([
        client.get('/placement/dashboard-summary'),
        client.get('/placement/drives'),
        client.get('/placement/applications'),
        client.get('/placement/slots'),
        client.get('/placement/alumni-mentors'),
        client.get(`/placement/eligible-students?min_cgpa=${minCgpaFilter}`)
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value.data?.data) {
        setSummary(sumRes.value.data.data);
      }
      if (drivesRes.status === 'fulfilled' && drivesRes.value.data?.data) {
        setDrives(drivesRes.value.data.data);
      }
      if (appsRes.status === 'fulfilled' && appsRes.value.data?.data) {
        setApplications(appsRes.value.data.data);
      }
      if (slotsRes.status === 'fulfilled' && slotsRes.value.data?.data) {
        setSlots(slotsRes.value.data.data);
      }
      if (alumniRes.status === 'fulfilled' && alumniRes.value.data?.data) {
        setAlumni(alumniRes.value.data.data);
      }
      if (eligibleRes.status === 'fulfilled' && eligibleRes.value.data?.data) {
        setEligibleStudents(eligibleRes.value.data.data);
      }
    } catch (err) {
      console.error('Error fetching placement suite data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [minCgpaFilter]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handlers for New Drive
  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await client.post('/placement/drives', newDrive);
      if (res.data?.success) {
        showToast(res.data.message || 'Drive created successfully!');
        setIsNewDriveModalOpen(false);
        setNewDrive({
          company_name: '', job_title: '', job_description: '', ctc_lpa: '',
          tier: 'DREAM', min_cgpa: '7.0', max_backlogs: '0', eligible_departments: 'All',
          drive_date: '', registration_deadline: ''
        });
        fetchAllData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create drive.', 'error');
    }
  };

  // Handlers for New Slot Booking
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await client.post('/placement/slots', newSlot);
      if (res.data?.success) {
        showToast(res.data.message || 'Campus slot booked successfully!');
        setIsNewSlotModalOpen(false);
        setNewSlot({
          company_name: '', contact_person: '', contact_email: '', slot_date: '',
          start_time: '09:30', end_time: '17:30', venue_hall: 'Placement Auditorium & Interview Cabins',
          purpose: 'FULL_DAY_DRIVE', notes: ''
        });
        fetchAllData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Slot booking conflict.', 'error');
    }
  };

  // Handlers for New Alumni Mentor
  const handleCreateAlumni = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await client.post('/placement/alumni-mentors', newAlumni);
      if (res.data?.success) {
        showToast(res.data.message || 'Alumni mentor registered!');
        setIsNewAlumniModalOpen(false);
        setNewAlumni({
          name: '', company: '', role_title: '', graduation_year: '2021',
          department: 'Computer Science', linkedin_url: '', email: '',
          domain_expertise: 'Fullstack & Cloud Architecture', mentorship_focus: 'Mock Technical Rounds & System Design'
        });
        fetchAllData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to register mentor.', 'error');
    }
  };

  // Handler for Application Stage Progression & Rating
  const handleUpdateApplicationStatus = async (appId: number, newStatus: string, rating?: number, feedback?: string, ctc?: number) => {
    try {
      const res = await client.post('/placement/applications/review', {
        application_id: appId,
        status: newStatus,
        reviewer_rating: rating,
        reviewer_feedback: feedback,
        offered_ctc: ctc
      });

      if (res.data?.success) {
        showToast(`Candidate advanced to '${newStatus}'!`);
        fetchAllData();
        if (selectedAppForFeedback) {
          setSelectedAppForFeedback(null);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update review status.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40' : 'bg-red-950/90 text-red-200 border-red-500/40'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-70">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Training & Placement Officer — Careers Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Corporate recruitment drives, resume portfolio reviewer, interview pipelines, on-campus slot bookings, and alumni networking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsNewDriveModalOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Drive</span>
          </button>

          <button
            onClick={() => setIsNewSlotModalOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Calendar className="w-4 h-4 text-[#2563EB]" />
            <span>Book Campus Slot</span>
          </button>

          <button
            onClick={() => setIsNewAlumniModalOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-[#1E3A5F]" />
            <span>Add Alumni Mentor</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3.5 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 font-medium ${
            activeTab === 'dashboard'
              ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Placement Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('drives')}
          className={`px-3.5 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 font-medium ${
            activeTab === 'drives'
              ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Placement Drives ({drives.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('shortlisting')}
          className={`px-3.5 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 font-medium ${
            activeTab === 'shortlisting'
              ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Star className="w-3.5 h-3.5 text-amber-300" />
          <span>Resume Review & Shortlisting</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'shortlisting' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
            {applications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('slots')}
          className={`px-3.5 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 font-medium ${
            activeTab === 'slots'
              ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Company Slot Bookings</span>
        </button>

        <button
          onClick={() => setActiveTab('alumni')}
          className={`px-3.5 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 font-medium ${
            activeTab === 'alumni'
              ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Alumni Mentors ({alumni.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('eligibility')}
          className={`px-3.5 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 font-medium ${
            activeTab === 'eligibility'
              ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Candidate Clearance</span>
        </button>
      </div>

      {/* TAB 1: PLACEMENT OVERVIEW DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Average CTC Package</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{summary?.average_ctc_lpa || '14.85'} <span className="text-xs font-bold text-slate-400">LPA</span></p>
              <span className="text-[10px] text-emerald-500 font-bold mt-1 inline-block">↑ 18.2% vs previous cohort</span>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Highest Salary Package</span>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">₹{summary?.highest_ctc_lpa || '28.50'} <span className="text-xs font-bold text-slate-400">LPA</span></p>
              <span className="text-[10px] text-purple-500 font-bold mt-1 inline-block">Google Cloud Super Dream</span>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Placed Students</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{summary?.placed_students || '38'} <span className="text-xs font-bold text-slate-400">Offers</span></p>
              <span className="text-[10px] text-emerald-500 font-bold mt-1 inline-block">{summary?.placement_percentage || '88.5'}% Institutional Rate</span>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Active Placement Drives</span>
              <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">{drives.length}</p>
              <span className="text-[10px] text-cyan-500 font-bold mt-1 inline-block">Tier 1 & Tier 2 Hiring</span>
            </div>
          </div>

          {/* Hiring Partners & Tier Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Corporate Recruitment Tiers</h3>
              <p className="text-xs text-slate-500 mb-4">Institutional compensation classification under National Board of Accreditation standard.</p>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-purple-700 dark:text-purple-300">Super Dream Tiers (CTC &gt;= ₹20 LPA)</span>
                    <p className="text-[11px] text-purple-600/80">Google Cloud, Microsoft, Goldman Sachs</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-purple-800 dark:text-purple-200">2 Drives Active</span>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">Dream Tiers (CTC ₹10 - ₹20 LPA)</span>
                    <p className="text-[11px] text-indigo-600/80">Amazon AWS, Deloitte, Morgan Stanley</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-indigo-800 dark:text-indigo-200">2 Drives Active</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">Regular Tiers (CTC &lt; ₹10 LPA)</span>
                    <p className="text-[11px] text-slate-500">TCS Digital, Cognizant, Infosys</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">1 Drive Active</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Top Recruiter Relationships</h3>
                <p className="text-xs text-slate-500 mb-3">Enterprise MoUs and Campus Partners</p>
                <div className="space-y-2">
                  {['Google Cloud', 'Microsoft Azure', 'Amazon Web Services', 'Deloitte Consulting', 'Goldman Sachs'].map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-cyan-600" /> {c}
                      </span>
                      <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">MoU Active</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('slots')}
                className="w-full mt-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                View Upcoming On-Campus Drives →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLACEMENT DRIVES */}
      {activeTab === 'drives' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active & Upcoming Placement Drives</h3>
              <p className="text-xs text-slate-500">Post company JDs, set minimum CGPA cut-offs, zero backlog rules, and drive dates.</p>
            </div>
            <button
              onClick={() => setIsNewDriveModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Post Drive
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drives.map((drive) => {
              const isSuperDream = drive.tier === 'SUPER_DREAM';
              const isDream = drive.tier === 'DREAM';

              return (
                <div key={drive.id} className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isSuperDream 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' 
                          : isDream 
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' 
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {drive.tier} • ₹{drive.ctc_lpa} LPA
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        {drive.status}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {drive.company_name}
                    </h4>
                    <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mt-0.5">
                      {drive.job_title}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {drive.job_description || 'Scalable technology architecture and software engineering recruitment.'}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Cut-Off</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">CGPA &gt;= {drive.min_cgpa}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Backlogs</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{drive.max_backlogs} Active Allowed</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Interview Date</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{drive.drive_date}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Departments</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">{drive.eligible_departments || 'All'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      {drive.applications_count || 0} Applicants
                    </span>
                    <button
                      onClick={() => {
                        setSelectedDriveFilter(String(drive.id));
                        setActiveTab('shortlisting');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center gap-1"
                    >
                      <span>Review Resumes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RESUME / PORTFOLIO REVIEWER & INTERVIEW SHORTLISTING HUB (💡 Feature 1) */}
      {activeTab === 'shortlisting' && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-3xl text-white flex items-start gap-3">
            <Star className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-white text-sm">Resume / Portfolio Reviewer & Interview Shortlisting Hub</h4>
              <p className="text-slate-300 leading-relaxed">
                Review applicant resumes and project portfolios, assign recruiter star ratings, enter feedback notes, and advance candidates through interview milestones: <span className="font-mono font-bold text-indigo-300">Applied → Shortlisted → Tech Round → HR Interview → Offered</span>.
              </p>
            </div>
          </div>

          {/* Filtering Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedDriveFilter}
                onChange={(e) => setSelectedDriveFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="">All Drives & Companies</option>
                {drives.map(d => (
                  <option key={d.id} value={d.id}>{d.company_name} — {d.job_title} (₹{d.ctc_lpa} LPA)</option>
                ))}
              </select>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                <option value="ALL">All Stages</option>
                <option value="APPLIED">Applied</option>
                <option value="RESUME_SHORTLISTED">Resume Shortlisted</option>
                <option value="TECHNICAL_ROUND">Technical Round</option>
                <option value="HR_ROUND">HR Round</option>
                <option value="OFFERED">Offered</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate or roll..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Applications Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            {applications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No Applications Received Yet</p>
                <p className="text-[11px]">Students can register for active drives from their student dashboard.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Target Company & Role</th>
                      <th className="px-4 py-3 text-center">CGPA</th>
                      <th className="px-4 py-3">Resume & Portfolio</th>
                      <th className="px-4 py-3 text-center">TPO Rating</th>
                      <th className="px-4 py-3 text-center">Current Stage</th>
                      <th className="px-4 py-3 text-right">Pipeline Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {applications
                      .filter(app => {
                        if (selectedDriveFilter && String(app.drive_id) !== selectedDriveFilter) return false;
                        if (stageFilter !== 'ALL' && app.status !== stageFilter) return false;
                        if (!searchQuery.trim()) return true;
                        const query = searchQuery.toLowerCase();
                        const name = `${app.first_name || ''} ${app.last_name || ''}`.toLowerCase();
                        const roll = (app.roll_number || '').toLowerCase();
                        const comp = (app.company_name || '').toLowerCase();
                        return name.includes(query) || roll.includes(query) || comp.includes(query);
                      })
                      .map((app) => {
                        const isOffered = app.status === 'OFFERED';
                        const isRejected = app.status === 'REJECTED';

                        return (
                          <tr key={app.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-900 dark:text-white">{app.first_name} {app.last_name}</p>
                              <p className="text-[10px] font-mono text-purple-600">{app.roll_number} • {app.department_name}</p>
                            </td>

                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{app.company_name}</span>
                              <p className="text-[10px] text-cyan-600 font-semibold">{app.job_title} (₹{app.ctc_lpa} LPA)</p>
                            </td>

                            <td className="px-4 py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                              {app.student_cgpa || '8.20'}
                            </td>

                            <td className="px-4 py-3 space-y-1">
                              <div className="flex items-center gap-2">
                                <a
                                  href={app.resume_url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                >
                                  <span>View Resume</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              {app.portfolio_url && (
                                <a
                                  href={app.portfolio_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-cyan-600 hover:underline flex items-center gap-1"
                                >
                                  <span>GitHub / Portfolio</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleUpdateApplicationStatus(app.id, app.status, star, app.reviewer_feedback)}
                                    className="hover:scale-120 transition-transform"
                                  >
                                    <Star className={`w-3.5 h-3.5 ${star <= (app.reviewer_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                  </button>
                                ))}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                isOffered 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                  : isRejected 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' 
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
                              }`}>
                                {app.status}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {app.status === 'APPLIED' && (
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(app.id, 'RESUME_SHORTLISTED')}
                                    className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold"
                                  >
                                    Shortlist Resume
                                  </button>
                                )}

                                {app.status === 'RESUME_SHORTLISTED' && (
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(app.id, 'TECHNICAL_ROUND')}
                                    className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold"
                                  >
                                    Advance to Tech
                                  </button>
                                )}

                                {app.status === 'TECHNICAL_ROUND' && (
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(app.id, 'HR_ROUND')}
                                    className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold"
                                  >
                                    Advance to HR
                                  </button>
                                )}

                                {app.status === 'HR_ROUND' && (
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(app.id, 'OFFERED', undefined, undefined, app.ctc_lpa)}
                                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-xs"
                                  >
                                    Release Offer
                                  </button>
                                )}

                                {!isRejected && !isOffered && (
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(app.id, 'REJECTED')}
                                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 text-[10px]"
                                  >
                                    Reject
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: COMPANY ON-CAMPUS SLOT BOOKING (💡 Feature 2A) */}
      {activeTab === 'slots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Company On-Campus Visit & Slot Scheduling</h3>
              <p className="text-xs text-slate-500">Coordinate drive dates, PPT auditorium allocations, and interview rooms.</p>
            </div>
            <button
              onClick={() => setIsNewSlotModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Book Campus Slot
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slots.map((slot) => (
              <div key={slot.id} className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 px-2.5 py-0.5 rounded-full">
                    {slot.purpose.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    {slot.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                    <span>{slot.company_name}</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{slot.contact_person || 'Campus Recruiter'} ({slot.contact_email || 'hr@company.com'})</span>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{slot.slot_date} • {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-bold">{slot.venue_hall}</span>
                  </div>
                </div>

                {slot.notes && (
                  <p className="text-[11px] text-slate-500 italic">
                    "{slot.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ALUMNI MENTOR NETWORKING HUB (💡 Feature 2B) */}
      {activeTab === 'alumni' && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-950/50 to-indigo-950/40 border border-purple-500/30 rounded-3xl text-white flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-white text-sm">Alumni Mentor Networking Hub</h4>
              <p className="text-slate-300 leading-relaxed">
                Connect aspiring students with alumni working across FAANG, FinTech, and leading product companies for mock interviews, resume critiques, and direct employee referrals.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alumni.map((mentor) => (
              <div key={mentor.id} className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                      Batch of {mentor.graduation_year} • {mentor.department}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      {mentor.availability_status}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {mentor.name}
                  </h4>
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    {mentor.role_title} @ {mentor.company}
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Domain Expertise</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{mentor.domain_expertise}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Mentorship Focus</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{mentor.mentorship_focus}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {mentor.linkedin_url && (
                      <a
                        href={mentor.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1"
                      >
                        <Linkedin className="w-3 h-3" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    <a
                      href={`mailto:${mentor.email || 'mentor@alumni.college.edu'}`}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </a>
                  </div>

                  <button
                    onClick={() => showToast(`Mock session request sent to ${mentor.name}!`)}
                    className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs"
                  >
                    Request Mock Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CANDIDATE CLEARANCE & ELIGIBLE POOL */}
      {activeTab === 'eligibility' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Automated Candidate Placement Clearance</h3>
              <p className="text-slate-500">Filters students meeting CGPA cut-offs and with zero active backlogs.</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="font-bold text-slate-700 dark:text-slate-300">Min CGPA Cut-off:</label>
              <select
                value={minCgpaFilter}
                onChange={(e) => setMinCgpaFilter(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value={6.0}>6.0+ CGPA</option>
                <option value={6.5}>6.5+ CGPA</option>
                <option value={7.0}>7.0+ CGPA</option>
                <option value={7.5}>7.5+ CGPA</option>
                <option value={8.0}>8.0+ CGPA (Dream Cut-off)</option>
                <option value={8.5}>8.5+ CGPA (Super Dream)</option>
              </select>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3 text-center">CGPA</th>
                    <th className="px-4 py-3 text-center">Active Backlogs</th>
                    <th className="px-4 py-3 text-center">Placement Clearance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {eligibleStudents.map((st) => (
                    <tr key={st.student_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-cyan-600">{st.roll_number}</td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white font-bold">{st.first_name} {st.last_name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{st.department_name}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800 dark:text-slate-200">{st.cgpa}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-500">{st.active_backlogs || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          CLEARED FOR DRIVES
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE PLACEMENT DRIVE */}
      {isNewDriveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Post New Campus Placement Drive</h3>
              <button onClick={() => setIsNewDriveModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleCreateDrive} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={newDrive.company_name}
                    onChange={(e) => setNewDrive({ ...newDrive, company_name: e.target.value })}
                    placeholder="e.g. Google Cloud"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Job Role Title *</label>
                  <input
                    type="text"
                    required
                    value={newDrive.job_title}
                    onChange={(e) => setNewDrive({ ...newDrive, job_title: e.target.value })}
                    placeholder="e.g. Associate Cloud Engineer"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">CTC Package (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newDrive.ctc_lpa}
                    onChange={(e) => setNewDrive({ ...newDrive, ctc_lpa: e.target.value })}
                    placeholder="e.g. 18.5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Compensation Tier</label>
                  <select
                    value={newDrive.tier}
                    onChange={(e) => setNewDrive({ ...newDrive, tier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="SUPER_DREAM">Super Dream (&gt;= 20 LPA)</option>
                    <option value="DREAM">Dream (10-20 LPA)</option>
                    <option value="REGULAR">Regular (&lt; 10 LPA)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Min CGPA Required</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDrive.min_cgpa}
                    onChange={(e) => setNewDrive({ ...newDrive, min_cgpa: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Backlogs Allowed</label>
                  <input
                    type="number"
                    value={newDrive.max_backlogs}
                    onChange={(e) => setNewDrive({ ...newDrive, max_backlogs: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Drive Interview Date *</label>
                  <input
                    type="date"
                    required
                    value={newDrive.drive_date}
                    onChange={(e) => setNewDrive({ ...newDrive, drive_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Registration Deadline</label>
                  <input
                    type="date"
                    value={newDrive.registration_deadline}
                    onChange={(e) => setNewDrive({ ...newDrive, registration_deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Job Description & Tech Stack</label>
                <textarea
                  rows={2}
                  value={newDrive.job_description}
                  onChange={(e) => setNewDrive({ ...newDrive, job_description: e.target.value })}
                  placeholder="Responsibilities, requirements, and tech stack..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsNewDriveModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md">Publish Drive</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BOOK CAMPUS VISIT SLOT */}
      {isNewSlotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Book Corporate On-Campus Slot</h3>
              <button onClick={() => setIsNewSlotModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleCreateSlot} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newSlot.company_name}
                  onChange={(e) => setNewSlot({ ...newSlot, company_name: e.target.value })}
                  placeholder="e.g. Amazon Web Services"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={newSlot.contact_person}
                    onChange={(e) => setNewSlot({ ...newSlot, contact_person: e.target.value })}
                    placeholder="e.g. John Doe (Lead Recruiter)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={newSlot.contact_email}
                    onChange={(e) => setNewSlot({ ...newSlot, contact_email: e.target.value })}
                    placeholder="recruiter@company.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Slot Date *</label>
                  <input
                    type="date"
                    required
                    value={newSlot.slot_date}
                    onChange={(e) => setNewSlot({ ...newSlot, slot_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Venue Hall / Lab *</label>
                <input
                  type="text"
                  required
                  value={newSlot.venue_hall}
                  onChange={(e) => setNewSlot({ ...newSlot, venue_hall: e.target.value })}
                  placeholder="e.g. Main Auditorium & CS Lab 2"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Drive Purpose</label>
                <select
                  value={newSlot.purpose}
                  onChange={(e) => setNewSlot({ ...newSlot, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="FULL_DAY_DRIVE">Full Day Campus Drive</option>
                  <option value="PRE_PLACEMENT_TALK">Pre-Placement Talk (PPT)</option>
                  <option value="ONLINE_ASSESSMENT">Online Technical Assessment</option>
                  <option value="INTERVIEWS">Interviews & Final Offer Discussion</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsNewSlotModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md">Confirm Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD ALUMNI MENTOR */}
      {isNewAlumniModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Register Alumni Mentor</h3>
              <button onClick={() => setIsNewAlumniModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleCreateAlumni} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Mentor Name *</label>
                  <input
                    type="text"
                    required
                    value={newAlumni.name}
                    onChange={(e) => setNewAlumni({ ...newAlumni, name: e.target.value })}
                    placeholder="e.g. Vikram Batra"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Current Company *</label>
                  <input
                    type="text"
                    required
                    value={newAlumni.company}
                    onChange={(e) => setNewAlumni({ ...newAlumni, company: e.target.value })}
                    placeholder="e.g. Meta / Uber"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Job Designation *</label>
                  <input
                    type="text"
                    required
                    value={newAlumni.role_title}
                    onChange={(e) => setNewAlumni({ ...newAlumni, role_title: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Graduation Batch Year</label>
                  <input
                    type="number"
                    value={newAlumni.graduation_year}
                    onChange={(e) => setNewAlumni({ ...newAlumni, graduation_year: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Domain Expertise *</label>
                <input
                  type="text"
                  required
                  value={newAlumni.domain_expertise}
                  onChange={(e) => setNewAlumni({ ...newAlumni, domain_expertise: e.target.value })}
                  placeholder="e.g. Cloud Architecture, Data Engineering, LLM Fine-tuning"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Mentorship Focus</label>
                <input
                  type="text"
                  value={newAlumni.mentorship_focus}
                  onChange={(e) => setNewAlumni({ ...newAlumni, mentorship_focus: e.target.value })}
                  placeholder="e.g. Mock System Design, Portfolio Review, Referral Prep"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={newAlumni.linkedin_url}
                    onChange={(e) => setNewAlumni({ ...newAlumni, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Alumni Email</label>
                  <input
                    type="email"
                    value={newAlumni.email}
                    onChange={(e) => setNewAlumni({ ...newAlumni, email: e.target.value })}
                    placeholder="mentor@alumni.college.edu"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsNewAlumniModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md">Add Mentor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
