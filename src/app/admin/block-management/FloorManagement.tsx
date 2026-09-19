import React, { useState, useEffect } from 'react';
import {
  Layers, Plus, Edit2, Trash2, Copy, Eye, CheckCircle, AlertCircle, RefreshCw,
  Building2, Edit3, ArrowRight, Shield, Sparkles, Check, FileText
} from 'lucide-react';
import { blockService, BuildingRecord, FloorRecord } from '../../../api/blockService';

export const FloorManagement: React.FC<{
  onNavigateToEditor?: (floorId: number) => void;
  onNavigateToVersions?: (floorId: number) => void;
}> = ({ onNavigateToEditor, onNavigateToVersions }) => {
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [floors, setFloors] = useState<FloorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Partial<FloorRecord> | null>(null);

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      loadFloors(selectedBuildingId);
    }
  }, [selectedBuildingId]);

  const loadBuildings = async () => {
    try {
      setLoading(true);
      const data = await blockService.getBuildings();
      setBuildings(data);
      if (data.length > 0 && !selectedBuildingId) {
        setSelectedBuildingId(data[0].id);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load buildings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFloors = async (bId: number) => {
    try {
      setLoading(true);
      const data = await blockService.getFloors(bId);
      setFloors(data);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load floors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenAddModal = () => {
    if (!selectedBuildingId) return;
    const nextNum = floors.length;
    setEditingFloor({
      building_id: selectedBuildingId,
      floor_number: nextNum,
      name: nextNum === 0 ? 'Ground Floor' : `${nextNum}${nextNum === 1 ? 'st' : nextNum === 2 ? 'nd' : nextNum === 3 ? 'rd' : 'th'} Floor`,
      code: `F-${nextNum}`,
      description: `Academic & Laboratory level ${nextNum}`,
      status: 'Active',
      width: 1200,
      height: 800
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fl: FloorRecord) => {
    setEditingFloor(fl);
    setIsModalOpen(true);
  };

  const handleSaveFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFloor || !selectedBuildingId || editingFloor.name === undefined) {
      showToast('Floor Name is required', 'error');
      return;
    }

    try {
      if (editingFloor.id) {
        await blockService.updateFloor(editingFloor.id, editingFloor);
        showToast(`Updated "${editingFloor.name}" successfully`);
      } else {
        await blockService.createFloor(selectedBuildingId, editingFloor);
        showToast(`Created floor "${editingFloor.name}"`);
      }

      setIsModalOpen(false);
      loadFloors(selectedBuildingId);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save floor', 'error');
    }
  };

  const handleDeleteFloor = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete floor "${name}"? All floor rooms and elements will be removed.`)) return;

    try {
      await blockService.deleteFloor(id);
      showToast(`Floor "${name}" deleted`);
      if (selectedBuildingId) loadFloors(selectedBuildingId);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete floor', 'error');
    }
  };

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
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
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Floor Management</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage building floor levels, CAD visual layouts, published versions, and floor plans</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedBuildingId && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Floor Level</span>
            </button>
          )}
        </div>
      </div>

      {/* Building Selector Strip */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Building2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Active Building Block</label>
            <select
              value={selectedBuildingId || ''}
              onChange={(e) => setSelectedBuildingId(Number(e.target.value))}
              className="w-full sm:max-w-md py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name} ({b.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedBuilding && (
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Type</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{selectedBuilding.building_type}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Total Configured</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{floors.length} Floors</span>
            </div>
          </div>
        )}
      </div>

      {/* Floors List Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-xs font-semibold">Loading building floors...</p>
        </div>
      ) : floors.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Layers className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">No floors added to this building yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Add floor levels (Ground Floor, 1st Floor, etc.) to start editing interactive visual layouts.</p>
          <button onClick={handleOpenAddModal} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md">
            + Add First Floor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {floors.map((fl) => (
            <div
              key={fl.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                      Level {fl.floor_number}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">{fl.name}</h3>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${fl.publish_status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-100 text-amber-700'}`}>
                    {fl.publish_status || 'DRAFT'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {fl.description || 'No floor description.'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Code</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{fl.code || `F-${fl.floor_number}`}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Canvas Bounds</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{fl.width} x {fl.height}px</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 gap-2">
                <button
                  onClick={() => onNavigateToEditor && onNavigateToEditor(fl.id)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Open Floor Editor</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onNavigateToVersions && onNavigateToVersions(fl.id)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Version History"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(fl)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit Floor Properties"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteFloor(fl.id, fl.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete Floor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT FLOOR MODAL */}
      {isModalOpen && editingFloor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" />
                {editingFloor.id ? 'Edit Floor Properties' : 'Add Floor Level'}
              </h2>
            </div>

            <form onSubmit={handleSaveFloor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Name *</label>
                <input
                  type="text"
                  required
                  value={editingFloor.name || ''}
                  onChange={(e) => setEditingFloor({ ...editingFloor, name: e.target.value })}
                  placeholder="e.g. Ground Floor, 1st Floor"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Number *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingFloor.floor_number !== undefined ? editingFloor.floor_number : 0}
                    onChange={(e) => setEditingFloor({ ...editingFloor, floor_number: Number(e.target.value) })}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Code</label>
                  <input
                    type="text"
                    value={editingFloor.code || ''}
                    onChange={(e) => setEditingFloor({ ...editingFloor, code: e.target.value })}
                    placeholder="e.g. F-0"
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingFloor.description || ''}
                  onChange={(e) => setEditingFloor({ ...editingFloor, description: e.target.value })}
                  placeholder="Notes on floor rooms, labs, or department allocation..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  Save Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FloorManagement;
