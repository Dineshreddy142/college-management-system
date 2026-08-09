import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle, ArrowRight, X } from "lucide-react";
import { Card, Btn, Badge, PBar } from "../../App";
import client from "../../../api/client";

export function TimetableUpload() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleValidate = () => {
    setStep(2);
    setValidating(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setValidating(false);
        // Mocking validation results for MVP UI
        setValidationResult({
          totalRows: 145,
          validRows: 142,
          errors: [
            { row: 12, error: "Faculty Clash: Prof. Smith already assigned during Monday Period 3." },
            { row: 42, error: "Room Clash: Room A201 already occupied by Section B." },
            { row: 89, error: "Subject Code not found in Curriculum." }
          ]
        });
      }
    }, 400);
  };

  const handleImport = async () => {
    // In actual implementation, we would send the parsed rows to the backend
    setStep(3);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Import Timetable</h2>
        <p className="text-sm text-slate-500 mt-2">Upload an Excel (.xlsx) file to automatically validate and generate timetables.</p>
      </div>

      <div className="flex justify-between items-center mb-8 relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -z-10 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-0 h-1 bg-blue-500 -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
        
        {[
          { num: 1, label: "Upload Excel" },
          { num: 2, label: "Validation" },
          { num: 3, label: "Publish" }
        ].map(s => (
          <div key={s.num} className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-950 px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s.num ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
              {s.num}
            </div>
            <span className={`text-xs font-medium ${step >= s.num ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-8 text-center border-dashed border-2">
          <input type="file" className="hidden" accept=".xlsx, .csv" ref={fileInputRef} onChange={handleFileChange} />
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={40} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Select Timetable File</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto mb-6">Make sure your file matches the official Timetable Template structure before uploading.</p>
          
          {file ? (
            <div className="flex items-center justify-center gap-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl max-w-md mx-auto mb-6">
              <FileSpreadsheet size={24} className="text-emerald-500" />
              <div className="text-left flex-1 truncate">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <Btn variant="outline" size="sm" icon={<FileSpreadsheet size={16} />}>Download Template</Btn>
              <Btn variant="primary" size="sm" onClick={() => fileInputRef.current?.click()}>Browse Files</Btn>
            </div>
          )}

          {file && (
            <Btn variant="primary" onClick={handleValidate}>Upload & Validate <ArrowRight size={16} className="ml-2" /></Btn>
          )}
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6 space-y-6">
          {validating ? (
             <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium">Running deep conflict detection algorithms...</p>
              <div className="w-64"><PBar value={progress} /></div>
             </div>
          ) : validationResult && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Validation Summary</h3>
                  <p className="text-sm text-slate-500">Total Rows Processed: {validationResult.totalRows}</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-500">{validationResult.validRows}</p>
                    <p className="text-xs text-slate-500">Valid</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{validationResult.errors.length}</p>
                    <p className="text-xs text-slate-500">Errors</p>
                  </div>
                </div>
              </div>

              {validationResult.errors.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-red-600 flex items-center gap-2"><AlertTriangle size={16} /> Conflict Errors Detected</h4>
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl overflow-hidden">
                    {validationResult.errors.map((err: any, idx: number) => (
                      <div key={idx} className="p-3 border-b border-red-100 dark:border-red-900/30 last:border-0 flex gap-3 text-sm text-red-800 dark:text-red-400">
                        <span className="font-mono bg-white dark:bg-red-950 px-2 py-0.5 rounded text-xs">Row {err.row}</span>
                        <span>{err.error}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500">You must fix these errors in your Excel file and re-upload, or proceed by discarding the conflicting rows.</p>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Btn variant="outline" onClick={() => { setFile(null); setStep(1); }}>Re-upload File</Btn>
                <Btn variant="primary" onClick={handleImport} className={validationResult.errors.length > 0 ? "bg-amber-600 hover:bg-amber-700" : ""}>
                  {validationResult.errors.length > 0 ? 'Force Import (Skip Errors)' : 'Approve & Import Timetable'}
                </Btn>
              </div>
            </div>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card className="p-10 text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 mx-auto rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Timetable Published Successfully!</h2>
          <p className="text-slate-500 max-w-md mx-auto">Version 1.0 of the timetable has been saved. Students and Faculty can now view their dynamic schedules.</p>
          <div className="pt-6 flex justify-center gap-4">
            <Btn variant="outline" onClick={() => { setFile(null); setStep(1); }}>Upload Another</Btn>
            <Btn variant="primary">View Live Grid</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
