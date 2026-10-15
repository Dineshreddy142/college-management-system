import { useState, useEffect, useCallback } from "react";
import { FileText, Search, Upload, Clock, CheckCircle, X, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Card, Badge, Btn, PBar } from "../App";
import client from "../../api/client";

interface AssignmentItem {
  id: number;
  title: string;
  sub: string;
  due: string;
  status: 'Graded' | 'Submitted' | 'Pending';
  grade?: string;
  submission_notes?: string;
  description?: string;
  faculty_feedback?: string;
}

export function AssignmentsModule() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // Submit Work Modal state
  const [activeSubmitModal, setActiveSubmitModal] = useState<AssignmentItem | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [viewModalItem, setViewModalItem] = useState<AssignmentItem | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/assignments');
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const mapped: AssignmentItem[] = raw.map((a: any) => ({
        id: a.id,
        title: a.title || `Assignment: ${a.subject_name || 'Coursework'}`,
        sub: `${a.subject_code || ''} - ${a.subject_name || 'Core Curriculum'}`.trim(),
        due: a.due_date ? new Date(a.due_date).toLocaleDateString() : 'Ongoing',
        status: a.student_score !== null && a.student_score !== undefined ? 'Graded' : (a.submission_status === 'Submitted' || a.submission_id ? 'Submitted' : 'Pending'),
        grade: a.student_score !== null && a.student_score !== undefined ? `${a.student_score}%` : undefined,
        submission_notes: a.submission_notes || 'Submitted coursework via portal',
        description: a.description,
        faculty_feedback: a.faculty_feedback
      }));
      setAssignments(mapped);
    } catch (err: any) {
      console.error("Failed to load student assignments", err);
      setErrorMsg("Failed to fetch coursework from server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filtered = assignments.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.sub.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmitModal) return;

    try {
      setSubmitting(true);
      setErrorMsg("");
      const res = await client.post(`/assignments/${activeSubmitModal.id}/submit`, {
        submission_notes: submissionNotes || (submissionFile ? `Attached: ${submissionFile.name}` : 'Submitted online solution'),
        file_url: submissionFile ? `uploads/assignments/${submissionFile.name}` : null
      });

      if (res.data?.success) {
        setSuccessMsg("Coursework submitted and logged to university database!");
        setActiveSubmitModal(null);
        setSubmissionFile(null);
        setSubmissionNotes("");
        await fetchAssignments();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Coursework & Assignments</h2>
          <p className="text-sm text-slate-500">Track and submit academic coursework directly to course faculty.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search assignments..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle size={15} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <Card className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} />
            <span>Loading assigned coursework from database...</span>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-slate-400 text-sm">
            No coursework or assignments currently recorded.
          </Card>
        ) : (
          filtered.map(a => (
            <Card key={a.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  a.status === 'Graded' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                  a.status === 'Submitted' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' :
                  'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                }`}>
                  <FileText size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">{a.title}</h3>
                    <Badge variant={a.status === 'Graded' ? 'success' : a.status === 'Submitted' ? 'info' : 'warning'}>
                      {a.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">{a.sub}</p>
                  {a.description && (
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">{a.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                    <Clock size={12} />
                    <span>Submission Due: {a.due}</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4">
                {a.status === 'Graded' && (
                  <div className="text-center md:text-right w-full sm:w-auto">
                    <p className="text-xs text-slate-400">Score</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{a.grade}</p>
                  </div>
                )}
                {a.status === 'Pending' && (
                  <Btn 
                    variant="primary" 
                    icon={<Upload size={14} />} 
                    className="w-full sm:w-auto"
                    onClick={() => { setErrorMsg(""); setActiveSubmitModal(a); }}
                  >
                    Submit Work
                  </Btn>
                )}
                {a.status === 'Submitted' && (
                  <Btn 
                    variant="outline" 
                    className="w-full sm:w-auto"
                    onClick={() => setViewModalItem(a)}
                  >
                    View Submission
                  </Btn>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Submit Work Modal */}
      {activeSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setActiveSubmitModal(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Submit Coursework Solution</h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">{activeSubmitModal.title}</p>

            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select File (PDF / ZIP / Code)</label>
                <input 
                  type="file" 
                  onChange={(e) => setSubmissionFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950/50 dark:file:text-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Submission Notes / GitHub Repository Link</label>
                <textarea 
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Provide repository link or summary of your implementation..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Btn variant="outline" type="button" onClick={() => setActiveSubmitModal(null)}>Cancel</Btn>
                <Btn variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Confirm & Upload'}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Submission Modal */}
      {viewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setViewModalItem(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Submission Record</h3>
            <p className="text-xs text-slate-500 mb-4">{viewModalItem.title}</p>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3 mb-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Status</span>
                <Badge variant={viewModalItem.status === 'Graded' ? 'success' : 'info'}>{viewModalItem.status}</Badge>
              </div>
              <div className="text-xs">
                <span className="text-slate-500 block mb-1 font-medium">Student Solution Notes:</span>
                <p className="text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  {viewModalItem.submission_notes || 'Submitted online'}
                </p>
              </div>
              {viewModalItem.faculty_feedback && (
                <div className="text-xs">
                  <span className="text-slate-500 block mb-1 font-medium">Faculty Evaluator Feedback:</span>
                  <p className="text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    {viewModalItem.faculty_feedback}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Btn variant="primary" onClick={() => setViewModalItem(null)}>Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
