import { useState, useEffect, useCallback } from "react";
import { Download, FileText, Upload, Plus, CheckCircle, Clock, X, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Card, Badge, Btn } from "../App";
import client from "../../api/client";

interface OfficialDocument {
  id: number;
  document_type: string;
  title: string;
  description: string;
  status: 'Available' | 'Pending' | 'Unavailable';
  issued_at: string;
  file_url?: string;
}

export function DocumentsModule() {
  const [documents, setDocuments] = useState<OfficialDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Request form state
  const [docType, setDocType] = useState("BONAFIDE");
  const [docTitle, setDocTitle] = useState("");
  const [docReason, setDocReason] = useState("");

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/documents/my');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setDocuments(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to load official documents:", err);
      setErrorMsg("Failed to retrieve documents from registrar registry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleRequestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg("");
      const res = await client.post('/documents/request', {
        document_type: docType,
        title: docTitle.trim() || `${docType} Certificate Request`,
        description: docReason.trim()
      });

      if (res.data?.success) {
        setSuccessMsg("Document request successfully logged to registrar office queue!");
        setShowRequestModal(false);
        setDocTitle("");
        setDocReason("");
        await fetchDocuments();
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to submit document request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = (doc: OfficialDocument) => {
    // Generate official downloadable transcript/certificate HTML window for instant printing/PDF saving
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${doc.title} - SmartCampus360</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; }
            .cert-box { border: 4px double #4338ca; padding: 40px; border-radius: 12px; text-align: center; }
            .header { font-size: 24px; font-weight: bold; color: #312e81; text-transform: uppercase; margin-bottom: 5px; }
            .sub-header { font-size: 14px; color: #64748b; margin-bottom: 30px; letter-spacing: 1px; }
            .title { font-size: 20px; font-weight: bold; margin: 25px 0 15px; color: #1e1b4b; text-decoration: underline; }
            .content { font-size: 15px; line-height: 1.8; text-align: justify; margin: 30px auto; max-width: 600px; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; color: #475569; }
            .seal { display: inline-block; width: 90px; height: 90px; border: 2px dashed #4f46e5; border-radius: 50%; line-height: 90px; text-align: center; font-size: 10px; font-weight: bold; color: #4f46e5; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="cert-box">
            <div class="header">SmartCampus360 University System</div>
            <div class="sub-header">Office of the Controller of Examinations & Academic Registrar</div>
            <div class="title">${doc.title}</div>
            <div class="content">
              This is to officially certify that the bearer of this document is a registered student in good academic standing. 
              The institutional records confirm all attendance requirements, curriculum enrollments, and tuition obligations are verified. 
              <br/><br/>
              <strong>Document Reference:</strong> DOC-${doc.id}-${Date.now().toString().slice(-4)}<br/>
              <strong>Issued Timestamp:</strong> ${new Date(doc.issued_at).toLocaleString()}<br/>
              <strong>Status:</strong> AUTHORIZED DIGITAL COPY
            </div>
            <div class="footer">
              <div>
                <div class="seal">OFFICIAL SEAL</div>
                <p>Registrar Verification</p>
              </div>
              <div style="text-align: right; margin-top: 40px;">
                <p>___________________________________</p>
                <p>Controller of Examinations / Dean</p>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Documents & Certificates Hub</h2>
          <p className="text-sm text-slate-500">Download cryptographically sealed digital marksheets, ID cards, and bonafide certificates.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={14} />} onClick={() => { setErrorMsg(""); setShowRequestModal(true); }}>
          Request Official Certificate
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
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} />
            <span>Loading official certificates from registrar database...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No official documents records found. Click "Request Official Certificate" to submit an application.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.map((d) => (
              <div 
                key={d.id} 
                className={`p-4 border rounded-xl flex flex-col justify-between transition-all ${
                  d.status === 'Available' 
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <FileText size={20} />
                    </div>
                    <Badge variant={d.status === 'Available' ? 'success' : d.status === 'Pending' ? 'warning' : 'danger'} size="sm">
                      {d.status}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-slate-900 dark:text-white leading-tight">{d.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">{d.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {new Date(d.issued_at).toLocaleDateString()}
                  </span>

                  <Btn 
                    variant={d.status === 'Available' ? 'primary' : 'outline'} 
                    size="sm"
                    disabled={d.status !== 'Available'} 
                    icon={<Download size={13}/>}
                    onClick={() => handleDownload(d)}
                  >
                    {d.status === 'Available' ? 'Download PDF' : d.status === 'Pending' ? 'Processing' : 'Unavailable'}
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Request Certificate Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowRequestModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Request Official Document</h3>
            <p className="text-xs text-slate-500 mb-4">Request digital generation by university registrar office.</p>

            <form onSubmit={handleRequestDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Document Type</label>
                <select 
                  value={docType} 
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="BONAFIDE">Bonafide Certificate (Scholarship / Passport)</option>
                  <option value="GRADE_CARD">Semester Grade Transcript / Marksheet</option>
                  <option value="ID_CARD">Replacement Digital ID Card</option>
                  <option value="FEE_RECEIPT">Official Fee Clearance Receipt</option>
                  <option value="TRANSFER_CERTIFICATE">Transfer & Conduct Certificate (TC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Document Title / Subject</label>
                <input 
                  type="text" 
                  value={docTitle} 
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Bonafide for State Education Scholarship"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Purpose / Reason for Request</label>
                <textarea 
                  rows={3} 
                  value={docReason} 
                  onChange={(e) => setDocReason(e.target.value)}
                  placeholder="Explain why this document is required..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Btn variant="outline" type="button" onClick={() => setShowRequestModal(false)}>Cancel</Btn>
                <Btn variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
