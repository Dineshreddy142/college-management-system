import React, { useState, useEffect } from 'react';
import {
  FileText, History, RefreshCw, CheckCircle, AlertCircle, Building2, Layers, RotateCcw, Send, Eye
} from 'lucide-react';
import { blockService, BuildingRecord, FloorRecord, FloorVersionRecord } from '../../../api/blockService';

export const FloorVersions: React.FC<{ initialFloorId?: number }> = ({ initialFloorId }) => {
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [floors, setFloors] = useState<FloorRecord[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(initialFloorId || null);

  const [versions, setVersions] = useState<FloorVersionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      loadFloors(selectedBuildingId);
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    if (selectedFloorId) {
      loadVersions(selectedFloorId);
    }
  }, [selectedFloorId]);

  const loadBuildings = async () => {
    try {
      const data = await blockService.getBuildings();
      setBuildings(data);
      if (data.length > 0 && !selectedBuildingId) {
        setSelectedBuildingId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadFloors = async (bId: number) => {
    try {
      const data = await blockService.getFloors(bId);
      setFloors(data);
      if (data.length > 0 && !selectedFloorId) {
        setSelectedFloorId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadVersions = async (fId: number) => {
    try {
      setLoading(true);
      const data = await blockService.getVersions(fId);
      setVersions(data);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load floor version history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateSnapshot = async () => {
    if (!selectedFloorId) return;
    try {
      const desc = prompt('Enter a note for this version snapshot:');
      if (desc === null) return;

      const res = await blockService.createVersionSnapshot(selectedFloorId, desc);
      showToast(`Snapshot ${res.versionNumber} created`);
      loadVersions(selectedFloorId);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create version snapshot', 'error');
    }
  };

  const handlePublish = async (vId: number, verNum: string) => {
    if (!confirm(`Are you sure you want to set Version ${verNum} as the official published floor plan?`)) return;

    try {
      await blockService.publishVersion(vId);
      showToast(`Version ${verNum} published successfully`);
      if (selectedFloorId) loadVersions(selectedFloorId);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to publish version', 'error');
    }
  };

  const handleRestore = async (vId: number, verNum: string) => {
    if (!confirm(`Restore layout from ${verNum}? A new version snapshot will be created preserving history.`)) return;

    try {
      await blockService.restoreVersion(vId);
      showToast(`Restored floor plan layout from ${verNum}`);
      if (selectedFloorId) loadVersions(selectedFloorId);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to restore version', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl font-bold text-xs flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Floor Version Control & Auditing</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track layout snapshots, audit author edits, restore past versions non-destructively, and publish official floor plans</p>
          </div>
        </div>

        {selectedFloorId && (
          <button
            onClick={handleCreateSnapshot}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all self-start sm:self-auto"
          >
            <FileText className="w-4 h-4" />
            <span>Create Version Snapshot</span>
          </button>
        )}
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Building</label>
          <select
            value={selectedBuildingId || ''}
            onChange={(e) => setSelectedBuildingId(Number(e.target.value))}
            className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.code} — {b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Floor Level</label>
          <select
            value={selectedFloorId || ''}
            onChange={(e) => setSelectedFloorId(Number(e.target.value))}
            className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
          >
            {floors.map((f) => (
              <option key={f.id} value={f.id}>Level {f.floor_number} — {f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Version Timeline Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-xs font-semibold">Loading version history timeline...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No version snapshots created for this floor yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {versions.map((ver) => (
              <div key={ver.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs">
                      {ver.version_number}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ver.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-200 text-slate-700'}`}>
                      {ver.status}
                    </span>
                  </div>

                  <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                    {ver.description || 'Routine layout update.'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Created by <span className="font-bold text-slate-600 dark:text-slate-300">{ver.created_by || 'Admin'}</span> on {new Date(ver.created_at || '').toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {ver.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => handlePublish(ver.id, ver.version_number)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish Version</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleRestore(ver.id, ver.version_number)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Layout</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default FloorVersions;
