import React, { useState, useEffect } from "react";
import { Briefcase, Upload, CheckCircle, Clock, Search, Building2, ExternalLink, Star, Award, CheckCircle2 } from "lucide-react";
import { Card, Badge, Btn } from "../App";
import client from "../../api/client";
import { useAuth } from "../portal/AuthContext";

export function PlacementModule() {
  const { user } = useAuth();
  const [drives, setDrives] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Apply Modal
  const [selectedDrive, setSelectedDrive] = useState<any | null>(null);
  const [resumeUrl, setResumeUrl] = useState("https://drive.google.com/file/d/my-resume/view");
  const [portfolioUrl, setPortfolioUrl] = useState("https://github.com/my-profile");
  const [isApplying, setIsApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPlacementData();
  }, []);

  const fetchPlacementData = async () => {
    try {
      setIsLoading(true);
      const [dRes, aRes] = await Promise.allSettled([
        client.get('/placement/drives'),
        client.get('/placement/applications')
      ]);

      if (dRes.status === 'fulfilled' && dRes.value.data?.data) {
        setDrives(dRes.value.data.data);
      }
      if (aRes.status === 'fulfilled' && aRes.value.data?.data) {
        setApplications(aRes.value.data.data);
      }
    } catch (e) {
      console.error("Failed to load placement data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrive) return;

    setIsApplying(true);
    try {
      const res = await client.post('/placement/apply', {
        drive_id: selectedDrive.id,
        resume_url: resumeUrl.trim(),
        portfolio_url: portfolioUrl.trim()
      });

      if (res.data?.success) {
        setStatusMessage(`Application submitted for ${selectedDrive.company_name}!`);
        setSelectedDrive(null);
        fetchPlacementData();
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      setStatusMessage(err.response?.data?.message || 'Application submission failed.');
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-5">
      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-600" />
            <span>Campus Placements & Career Drives</span>
          </h2>
          <p className="text-sm text-slate-500">Apply for on-campus corporate recruitment drives and track your interview stages.</p>
        </div>
        <Btn variant="primary" icon={<Upload size={14} />} onClick={() => setSelectedDrive(drives[0] || null)}>
          Apply for Active Drive
        </Btn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Active Recruitment Drives</h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search companies or roles..."
                  className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
            </div>
            
            {drives.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No active campus placement drives scheduled.
              </div>
            ) : (
              <div className="space-y-3">
                {drives
                  .filter(d => !searchQuery.trim() || d.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || d.job_title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((drive) => {
                    const isSuperDream = drive.tier === 'SUPER_DREAM';
                    const isDream = drive.tier === 'DREAM';

                    return (
                      <div key={drive.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{drive.company_name}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isSuperDream ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : isDream ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' : 'bg-slate-200 text-slate-700'
                            }`}>
                              ₹{drive.ctc_lpa} LPA • {drive.tier}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-cyan-600">{drive.job_title}</p>
                          <p className="text-[11px] text-slate-500">
                            Min CGPA: {drive.min_cgpa} • Max Backlogs: {drive.max_backlogs} • Drive Date: {drive.drive_date}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedDrive(drive)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold self-start sm:self-center"
                        >
                          Apply Now
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">My Applications & Status</h3>
            {applications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No placement applications submitted yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {applications.map((app) => (
                  <div key={app.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{app.company_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{app.job_title}</p>
                    {app.reviewer_rating > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>TPO Review: {app.reviewer_rating}/5</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Institutional Eligibility Rules</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">CGPA Requirement</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">&gt;= 7.0 for Dream / &gt;= 8.5 Super Dream</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Backlog Policy</span>
                <span className="font-bold text-emerald-500">0 Active Backlogs Required</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Placement Cell Status</span>
                <span className="font-bold text-emerald-500">Registered & Cleared</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Apply Modal */}
      {selectedDrive && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Apply for {selectedDrive.company_name}</h3>
                <p className="text-xs text-cyan-600 font-semibold">{selectedDrive.job_title} (₹{selectedDrive.ctc_lpa} LPA)</p>
              </div>
              <button onClick={() => setSelectedDrive(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleApply} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Resume Link (Google Drive / Cloud Storage) *</label>
                <input
                  type="url"
                  required
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Portfolio / GitHub Profile URL</label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedDrive(null)} className="px-3 py-1.5 font-bold text-slate-500">Cancel</button>
                <button type="submit" disabled={isApplying} className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold shadow-md">
                  {isApplying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
