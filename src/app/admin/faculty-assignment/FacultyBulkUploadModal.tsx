import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Upload, Download, CheckCircle, AlertCircle, RefreshCw, X, Database, FileText, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import client from '../../../api/client';

interface FacultyBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FacultyBulkUploadModal: React.FC<FacultyBulkUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setPreviewRows([]);
    setHeaders([]);
    setTotalRows(0);
    setUploadResult(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processSelectedFile = (selectedFile: File) => {
    setFile(selectedFile);
    setUploadResult(null);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length > 0) {
          setHeaders(Object.keys(json[0]));
          setPreviewRows(json.slice(0, 8)); // First 8 rows for preview
          setTotalRows(json.length);
        } else {
          setUploadError('The selected Excel sheet contains no data rows.');
        }
      } catch (err: any) {
        setUploadError('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.');
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processSelectedFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setUploadError('Please select an Excel file to import faculty.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await client.post('/bulk/faculty', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setUploadResult(res.data.data || res.data);
        if (onSuccess) onSuccess();
      } else {
        setUploadError(res.data?.message || 'Upload completed with warnings.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to process bulk faculty upload.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/bulk/template/faculty', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bulk Onboard Teaching Faculty
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload Excel spreadsheet (.xlsx, .csv) to auto-create user accounts & faculty profiles.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Col: Upload Box & Actions */}
            <div className="lg:col-span-1 space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                {file ? (
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-full">{file.name}</p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                      {(file.size / 1024).toFixed(1)} KB • {totalRows} Rows Detected
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Drag & drop Faculty Excel Sheet</p>
                    <p className="text-[11px] text-slate-400 mt-1">or click to browse (.xlsx, .csv)</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={!file || isUploading}
                  onClick={handleUploadSubmit}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                    !file || isUploading
                      ? 'bg-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20 cursor-pointer'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Importing to Database...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      <span>Commit {totalRows > 0 ? `${totalRows} Rows` : ''} to DB</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample .XLSX Template</span>
                </button>
              </div>

              {/* Error Alert */}
              {uploadError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Success Result */}
              {uploadResult && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle className="w-4 h-4" />
                    <span>Faculty Import Successful!</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                    {uploadResult.createdCount !== undefined && <p>• <b>{uploadResult.createdCount}</b> new faculty profiles created</p>}
                    {uploadResult.updatedCount !== undefined && <p>• <b>{uploadResult.updatedCount}</b> existing profiles updated</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Live Pre-Upload Table Preview */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Live Data Preview</span>
                </h4>
                {previewRows.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-full font-extrabold text-[10px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> {totalRows} Rows Ready
                  </span>
                )}
              </div>

              {previewRows.length > 0 ? (
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2">#</th>
                        {headers.map((h) => (
                          <th key={h} className="px-3 py-2 text-slate-700 dark:text-slate-300 capitalize">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2 font-mono text-slate-400">{idx + 1}</td>
                          {headers.map((h) => (
                            <td key={h} className="px-3 py-2 text-slate-800 dark:text-slate-200 font-medium">
                              {row[h] !== undefined && row[h] !== null ? String(row[h]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
                  <p className="text-xs font-semibold">No sheet loaded for preview</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Download the sample template or upload an existing Excel sheet to preview Employee IDs, Names, Departments, and Designations.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-end bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
