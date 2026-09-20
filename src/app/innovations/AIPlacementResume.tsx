import React, { useState } from 'react';
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  Download,
  Search,
  Building,
  Award,
  BookOpen,
  Send,
  Zap,
  ChevronRight,
  Filter,
  Check,
  Plus,
  RefreshCw,
  Eye,
  Star
} from 'lucide-react';

interface JobOffer {
  id: string;
  company: string;
  logo: string;
  role: string;
  location: string;
  package: string;
  matchScore: number;
  tags: string[];
  missingSkills: string[];
  matchedSkills: string[];
  deadline: string;
  status: 'Not Applied' | 'Applied' | 'Shortlisted' | 'Interview Scheduled';
}

interface StudentResumeData {
  fullName: string;
  email: string;
  phone: string;
  gpa: string;
  degree: string;
  branch: string;
  passingYear: string;
  summary: string;
  skills: string[];
  projects: Array<{ title: string; tech: string; description: string; impact: string }>;
  experience: Array<{ role: string; company: string; duration: string; bullet: string }>;
  certifications: string[];
}

const INITIAL_JOBS: JobOffer[] = [
  {
    id: 'job-1',
    company: 'Google Inc.',
    logo: '🌐',
    role: 'Associate Software Engineer',
    location: 'Bengaluru (Hybrid)',
    package: '₹28.5 LPA',
    matchScore: 94,
    tags: ['Full Stack', 'Data Structures', 'System Design'],
    matchedSkills: ['React', 'TypeScript', 'Data Structures', 'Node.js', 'Git'],
    missingSkills: ['Kubernetes', 'System Design'],
    deadline: '2 Days Left',
    status: 'Not Applied',
  },
  {
    id: 'job-2',
    company: 'Microsoft',
    logo: '💻',
    role: 'Cloud & AI Engineer Trainee',
    location: 'Hyderabad',
    package: '₹24.0 LPA',
    matchScore: 88,
    tags: ['Azure', 'Python', 'AI/ML'],
    matchedSkills: ['Python', 'TypeScript', 'Git', 'SQL'],
    missingSkills: ['Azure DevOps', 'Docker'],
    deadline: '5 Days Left',
    status: 'Not Applied',
  },
  {
    id: 'job-3',
    company: 'Deloitte Digital',
    logo: '🏛️',
    role: 'Cybersecurity & Tech Consultant',
    location: 'Pune / Mumbai',
    package: '₹14.2 LPA',
    matchScore: 76,
    tags: ['Cybersecurity', 'Cloud', 'Consulting'],
    matchedSkills: ['SQL', 'Git', 'Problem Solving'],
    missingSkills: ['Network Security', 'OWASP Top 10', 'ISO 27001'],
    deadline: '1 Week Left',
    status: 'Not Applied',
  },
  {
    id: 'job-4',
    company: 'Amazon Web Services',
    logo: '📦',
    role: 'Cloud Solutions Associate',
    location: 'Chennai',
    package: '₹22.0 LPA',
    matchScore: 91,
    tags: ['AWS', 'DevOps', 'Distributed Systems'],
    matchedSkills: ['React', 'Node.js', 'SQL', 'TypeScript'],
    missingSkills: ['AWS Lambda', 'Terraform'],
    deadline: '3 Days Left',
    status: 'Applied',
  }
];

const INITIAL_RESUME: StudentResumeData = {
  fullName: 'Dinesh Reddy',
  email: 'dinesh.reddy@campus.edu',
  phone: '+91 98765 43210',
  gpa: '8.92 / 10.0',
  degree: 'B.Tech in Computer Science & Engineering',
  branch: 'CSE (AI & ML Specialization)',
  passingYear: '2026',
  summary: 'Passionate Full-Stack Developer with hands-on experience in modern web technologies, modern React applications, and data algorithms. Proven track record in developing high-throughput web portals and collaborative campus tools.',
  skills: ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'Git', 'Data Structures', 'Tailwind CSS', 'REST API'],
  projects: [
    {
      title: 'Smart Campus Management Portal (EduERP)',
      tech: 'React, TypeScript, Tailwind CSS, Recharts',
      description: 'Engineered a unified campus automation system supporting 10,000+ active users with real-time academic risk monitoring and instant gatepass generation.',
      impact: 'Boosted operational efficiency by 40% and reduced paper usage by 95% across 4 engineering departments.'
    },
    {
      title: 'AI Resume Scanner & ATS Optimizer',
      tech: 'Python, Natural Language Processing, FastAPI',
      description: 'Built a NLP-based resume analyzer matching candidate profiles with tech JD keywords.',
      impact: 'Achieved 92% accuracy in keyword extraction against standard ATS benchmark datasets.'
    }
  ],
  experience: [
    {
      role: 'Full Stack Developer Intern',
      company: 'InnovateX Software Labs',
      duration: 'Jun 2025 - Aug 2025',
      bullet: 'Developed 6 dynamic dashboard widgets using React & TypeScript, optimizing render latency by 35%.'
    }
  ],
  certifications: [
    'AWS Certified Cloud Practitioner (2025)',
    'Meta Front-End Developer Professional Certificate (Coursera)',
    'HackerRank Problem Solving (Gold Badge)'
  ]
};

export const AIPlacementResume: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matches' | 'builder' | 'applications'>('matches');
  const [jobs, setJobs] = useState<JobOffer[]>(INITIAL_JOBS);
  const [resume, setResume] = useState<StudentResumeData>(INITIAL_RESUME);
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(INITIAL_JOBS[0]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApply = (jobId: string) => {
    setJobs(prev =>
      prev.map(j => (j.id === jobId ? { ...j, status: 'Applied' } : j))
    );
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob(prev => prev ? { ...prev, status: 'Applied' } : null);
    }
    triggerToast('🎯 Application submitted successfully with ATS Resume package!');
  };

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    if (!resume.skills.includes(newSkillInput.trim())) {
      setResume(prev => ({ ...prev, skills: [...prev.skills, newSkillInput.trim()] }));
      triggerToast(`✨ Added skill "${newSkillInput.trim()}". Re-calculating job match scores...`);
    }
    setNewSkillInput('');
  };

  const handleAIEnhanceSummary = () => {
    setIsEnhancing(true);
    setTimeout(() => {
      setResume(prev => ({
        ...prev,
        summary: 'Results-driven Computer Science scholar specializing in Full-Stack Web Development & AI integration. Architected high-concurrency micro-apps serving 10k+ campus users with 99.9% uptime. Proficient in TypeScript, React, and AWS cloud infrastructures.'
      }));
      setIsEnhancing(false);
      triggerToast('🤖 AI refined your professional summary with high-impact action verbs!');
    }, 1200);
  };

  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-indigo-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-900 via-indigo-900 to-purple-900 p-8 mb-8 border border-indigo-700/50 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Innovation Module 3
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              AI Placement Match & ATS Resume Studio
            </h1>
            <p className="text-slate-300 mt-2 max-w-2xl text-sm leading-relaxed">
              Real-time job JD matching algorithm using vector NLP similarity scores + 1-Click ATS resume compiler tailored to high-tier campus hiring drives.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium text-sm shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition"
            >
              <Eye className="w-4 h-4" /> Preview ATS Resume
            </button>
            <button
              onClick={() => triggerToast('📄 PDF Exported: Dinesh_Reddy_ATS_Resume_2026.pdf')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-medium text-sm flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 mb-8 gap-2">
        <button
          onClick={() => setActiveTab('matches')}
          className={`pb-3 px-5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'matches'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> AI Job Matches & Skill Gaps
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`pb-3 px-5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'builder'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Smart Resume Optimizer
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 px-5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'applications'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Active Placement Tracker ({jobs.filter(j => j.status !== 'Not Applied').length})
        </button>
      </div>

      {/* TAB 1: AI JOB MATCHES & SKILL GAPS */}
      {activeTab === 'matches' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Job Listings Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Building className="w-5 h-5 text-cyan-400" /> Recommended Campus Drives
              </h2>
              <span className="text-xs text-slate-400">Sorted by AI Match Percentage</span>
            </div>

            {jobs.map(job => {
              const isSelected = selectedJob?.id === job.id;
              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                        {job.logo}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100">{job.role}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="text-slate-300 font-semibold">{job.company}</span> • {job.location}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
                        <Zap className="w-4 h-4 fill-emerald-400" /> {job.matchScore}% Match
                      </div>
                      <p className="text-xs text-indigo-300 font-bold mt-1.5">{job.package}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {job.tags.map(tag => (
                      <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
                    <span>Deadline: <strong className="text-amber-400">{job.deadline}</strong></span>
                    <span className="flex items-center gap-1 text-cyan-400 font-medium">
                      View Details & Skill Gap <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Skill Match Radar & Action Panel */}
          <div className="lg:col-span-5">
            {selectedJob ? (
              <div className="sticky top-6 bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                  <div>
                    <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">Detailed Analysis</span>
                    <h3 className="text-xl font-extrabold text-white mt-0.5">{selectedJob.company}</h3>
                    <p className="text-xs text-slate-400">{selectedJob.role}</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 flex items-center justify-center">
                    <div className="w-full h-full bg-slate-900 rounded-full flex flex-col items-center justify-center text-center">
                      <span className="text-lg font-black text-cyan-300">{selectedJob.matchScore}%</span>
                      <span className="text-[9px] uppercase tracking-tighter text-slate-400">Fit Index</span>
                    </div>
                  </div>
                </div>

                {/* Matched Skills */}
                <div className="mt-5">
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Matched Qualifications ({selectedJob.matchedSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.matchedSkills.map(s => (
                      <span key={s} className="px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs font-medium flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400" /> {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing / Gap Skills */}
                <div className="mt-5">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Skill Gap Recommendations ({selectedJob.missingSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.missingSkills.map(s => (
                      <span key={s} className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-700/50 text-amber-300 text-xs font-medium">
                        + Learn {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                    💡 <strong>AI Tip:</strong> Adding projects with <span className="text-amber-300">{selectedJob.missingSkills.join(', ')}</span> can raise your fit index to <strong>98%+</strong>.
                  </p>
                </div>

                {/* Apply Button */}
                <div className="mt-6 pt-4 border-t border-slate-700">
                  {selectedJob.status === 'Applied' ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-slate-700 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Application Submitted
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApply(selectedJob.id)}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-cyan-950/60 flex items-center justify-center gap-2 transition"
                    >
                      <Send className="w-4 h-4" /> Apply Now with 1-Click ATS Resume
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-800/40 border border-slate-700 rounded-2xl text-slate-400">
                Select a job drive to view match details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SMART RESUME OPTIMIZER */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            {/* Personal Info & Summary Section */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-400" /> Executive Profile Summary
                </h3>
                <button
                  onClick={handleAIEnhanceSummary}
                  disabled={isEnhancing}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                  {isEnhancing ? 'Enhancing...' : 'AI Enhance Summary'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={resume.fullName}
                    onChange={e => setResume({ ...resume, fullName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Target Role / Branch</label>
                  <input
                    type="text"
                    value={resume.branch}
                    onChange={e => setResume({ ...resume, branch: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Professional Summary</label>
                <textarea
                  rows={3}
                  value={resume.summary}
                  onChange={e => setResume({ ...resume, summary: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Core Technical Skills */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
              <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" /> Core Skill Stack
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add new skill (e.g. Docker, GraphQL, Kubernetes)..."
                  value={newSkillInput}
                  onChange={e => setNewSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {resume.skills.map(sk => (
                  <span
                    key={sk}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2"
                  >
                    {sk}
                    <button
                      onClick={() => setResume({ ...resume, skills: resume.skills.filter(s => s !== sk) })}
                      className="hover:text-red-400 transition"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Featured Projects */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
              <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-cyan-400" /> Quantified Impact Projects
              </h3>
              <div className="space-y-4">
                {resume.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/70">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-100 text-sm">{proj.title}</h4>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                        {proj.tech}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2">{proj.description}</p>
                    <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Impact: {proj.impact}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ATS Score Checker Column */}
          <div className="lg:col-span-5">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 sticky top-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4">ATS Compatibility Scorecard</h3>

              {/* Overall Circular Metric */}
              <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-900/90 border border-slate-700 mb-6">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center text-center shadow-lg shadow-emerald-950">
                  <span className="text-2xl font-black text-emerald-400">96</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400">Out of 100</span>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-400 text-sm">Excellent ATS Formatting</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Your resume meets tier-1 IT campus drive standards with zero parsed tables or unreadable elements.
                  </p>
                </div>
              </div>

              {/* Breakdown metrics */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Keyword Density & Tech Stack</span>
                    <span className="text-cyan-400">98%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: '98%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Quantified Impact Statements</span>
                    <span className="text-emerald-400">92%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Standard Heading Structure</span>
                    <span className="text-indigo-400">100%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-indigo-950/40 border border-indigo-700/50">
                <h5 className="text-xs font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Automated AI Recommendations
                </h5>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Keep bullet points under 2 lines for quick recruiter scanning.</li>
                  <li>Include link to active GitHub project repository in contact header.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLACEMENT TRACKER */}
      {activeTab === 'applications' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" /> Active Placement Applications
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Company & Role</th>
                  <th className="py-3.5 px-4">Package</th>
                  <th className="py-3.5 px-4">Match %</th>
                  <th className="py-3.5 px-4">Application Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {jobs.map(j => (
                  <tr key={j.id} className="hover:bg-slate-800/80 transition">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{j.logo}</span>
                        <div>
                          <p className="font-bold text-slate-100 text-sm">{j.company}</p>
                          <p className="text-slate-400 text-xs">{j.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-emerald-400">{j.package}</td>
                    <td className="py-4 px-4 font-semibold text-cyan-400">{j.matchScore}%</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          j.status === 'Applied'
                            ? 'bg-blue-950 text-blue-300 border border-blue-700'
                            : j.status === 'Interview Scheduled'
                            ? 'bg-purple-950 text-purple-300 border border-purple-700'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {j.status === 'Not Applied' ? (
                        <button
                          onClick={() => handleApply(j.id)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition"
                        >
                          Apply Now
                        </button>
                      ) : (
                        <button
                          onClick={() => triggerToast(`Viewing application details for ${j.company}`)}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
                        >
                          View Status
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ATS RESUME PREVIEW */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            {/* Document Paper Mockup */}
            <div className="bg-white text-slate-900 p-8 rounded-xl shadow-2xl space-y-6 text-sm font-sans">
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <h1 className="text-2xl font-extrabold uppercase tracking-wide">{resume.fullName}</h1>
                <p className="text-xs text-slate-700 mt-1">
                  {resume.email} | {resume.phone} | {resume.degree}
                </p>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  Professional Summary
                </h2>
                <p className="text-xs text-slate-800 leading-relaxed">{resume.summary}</p>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  Technical Qualifications
                </h2>
                <p className="text-xs text-slate-800">{resume.skills.join(' • ')}</p>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  Key Projects & Innovations
                </h2>
                <div className="space-y-3">
                  {resume.projects.map((p, i) => (
                    <div key={i}>
                      <div className="flex justify-between font-bold text-xs">
                        <span>{p.title}</span>
                        <span className="font-normal italic">{p.tech}</span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-0.5">{p.description}</p>
                      <p className="text-[11px] font-semibold text-slate-900">{p.impact}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  Certifications & Honors
                </h2>
                <ul className="list-disc list-inside text-xs text-slate-800">
                  {resume.certifications.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  triggerToast('📄 ATS Resume PDF downloaded successfully.');
                }}
                className="px-5 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
