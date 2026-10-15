import { useState, useEffect, useCallback } from "react";
import { AlertCircle, Plus, Search, CheckCircle, Clock, X, Loader2, MessageSquare, ShieldAlert } from "lucide-react";
import { Card, Badge, Btn } from "../App";
import client from "../../api/client";

interface GrievanceItem {
  id: number;
  ticket_code: string;
  category: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  resolution_notes?: string;
  created_at: string;
}

export function ComplaintsModule() {
  const [complaints, setComplaints] = useState<GrievanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // New ticket form
  const [category, setCategory] = useState("Hostel Maintenance");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium");

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/grievances');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setComplaints(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to load grievances:", err);
      setErrorMsg("Failed to retrieve complaints from server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg("Please provide a title and detailed description");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      const res = await client.post('/grievances', {
        category,
        title: title.trim(),
        description: description.trim(),
        priority
      });

      if (res.data?.success) {
        setSuccessMsg(`Grievance ${res.data.data?.ticket_code || ''} created successfully! Assigned to university redressal committee.`);
        setShowModal(false);
        setTitle("");
        setDescription("");
        await fetchComplaints();
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = complaints.filter(c => {
    const matchesSearch = c.ticket_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Grievance & Redressal Hub</h2>
          <p className="text-sm text-slate-500">Raise and track institutional issues related to campus infrastructure, hostel, or academics.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={14} />} onClick={() => { setErrorMsg(""); setShowModal(true); }}>
          Raise Grievance Ticket
        </Btn>
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

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <h3 className="font-semibold text-slate-900 dark:text-white">Registered Tickets ({complaints.length})</h3>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Hostel Maintenance">Hostel Maintenance</option>
              <option value="Academics">Academics</option>
              <option value="IT Infrastructure">IT Infrastructure</option>
              <option value="Transport">Transport</option>
              <option value="Library">Library</option>
            </select>

            <div className="relative flex-1 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search ticket code or title..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} />
            <span>Loading grievances from database...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No grievances matching your criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div key={c.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {c.ticket_code}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {c.category}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{c.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.priority === 'Urgent' || c.priority === 'High' ? 'danger' : 'info'} size="sm">
                      {c.priority} Priority
                    </Badge>
                    <Badge variant={c.status === 'Resolved' ? 'success' : c.status === 'In Progress' ? 'warning' : 'danger'} size="sm">
                      {c.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{c.description}</p>
                {c.resolution_notes && (
                  <div className="mt-2.5 p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="font-bold">Official Resolution:</span> {c.resolution_notes}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2.5 flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>Logged: {new Date(c.created_at).toLocaleString()}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Raise Grievance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Raise Official Grievance</h3>
            <p className="text-xs text-slate-500 mb-4">Issues are routed directly to departmental wardens & administrators.</p>

            <form onSubmit={handleRaiseTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Hostel Maintenance">Hostel Maintenance & Electrical</option>
                  <option value="Academics">Academic Grievance & Attendance Discrepancy</option>
                  <option value="IT Infrastructure">IT, Wi-Fi & Computing Infrastructure</option>
                  <option value="Transport">Campus Bus & Transportation</option>
                  <option value="Library">Library Resources & Books</option>
                  <option value="Canteen">Campus Dining & Hygiene</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Wi-Fi disconnection on 3rd floor lab"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority Level</label>
                <select 
                  value={priority} 
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Low">Low - Informational / Non-urgent</option>
                  <option value="Medium">Medium - Regular maintenance</option>
                  <option value="High">High - Significant disruption</option>
                  <option value="Urgent">Urgent - Safety or emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Detailed Description</label>
                <textarea 
                  rows={3} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe location, room number, or specific session details..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Btn variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Btn>
                <Btn variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Submitting Ticket...' : 'Submit Grievance'}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
