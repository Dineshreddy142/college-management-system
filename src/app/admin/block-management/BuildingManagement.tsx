import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Search, Edit2, Trash2, Copy, Eye, RotateCw,
  CheckCircle, AlertCircle, RefreshCw, Layers, Shield, Sparkles, MapPin, X, Save
} from 'lucide-react';
import { blockService, BuildingRecord, GeometryType, Point } from '../../../api/blockService';

export const BuildingManagement: React.FC<{ onNavigateToFloors?: (buildingId: number) => void }> = ({ onNavigateToFloors }) => {
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Partial<BuildingRecord> | null>(null);
  const [selectedShape, setSelectedShape] = useState<GeometryType>('RECTANGLE');
  const [vertices, setVertices] = useState<Point[]>([]);

  useEffect(() => {
    loadBuildings();
  }, [typeFilter, deptFilter, statusFilter]);

  const loadBuildings = async () => {
    try {
      setLoading(true);
      const data = await blockService.getBuildings({
        search: searchQuery,
        type: typeFilter,
        department: deptFilter,
        status: statusFilter
      });
      setBuildings(data);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load buildings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingBuilding({
      code: `BLDG-${Date.now().toString().slice(-4)}`,
      name: '',
      description: '',
      building_type: 'Academic',
      department: 'Computer Science',
      status: 'Active',
      total_floors: 4,
      geometry_type: 'RECTANGLE',
      x: 50,
      y: 50,
      width: 300,
      height: 200,
      rotation: 0,
      boundary_points: []
    });
    setSelectedShape('RECTANGLE');
    setVertices([
      { x: 50, y: 50 },
      { x: 350, y: 50 },
      { x: 350, y: 250 },
      { x: 50, y: 250 }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (bldg: BuildingRecord) => {
    setEditingBuilding(bldg);
    setSelectedShape(bldg.geometry_type || 'RECTANGLE');
    setVertices(bldg.boundary_points && bldg.boundary_points.length > 0 ? bldg.boundary_points : [
      { x: bldg.x, y: bldg.y },
      { x: bldg.x + bldg.width, y: bldg.y },
      { x: bldg.x + bldg.width, y: bldg.y + bldg.height },
      { x: bldg.x, y: bldg.y + bldg.height }
    ]);
    setIsModalOpen(true);
  };

  const handleSaveBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuilding || !editingBuilding.name?.trim()) {
      showToast('Building Name is required', 'error');
      return;
    }

    try {
      const payload: Partial<BuildingRecord> = {
        ...editingBuilding,
        geometry_type: selectedShape,
        boundary_points: vertices
      };

      if (editingBuilding.id) {
        await blockService.updateBuilding(editingBuilding.id, payload);
        showToast(`Updated "${editingBuilding.name}" successfully`);
      } else {
        await blockService.createBuilding(payload);
        showToast(`Created building "${editingBuilding.name}"`);
      }

      setIsModalOpen(false);
      loadBuildings();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save building', 'error');
    }
  };

  const handleDeleteBuilding = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete building "${name}"? All associated floors and rooms will be deleted.`)) return;

    try {
      await blockService.deleteBuilding(id);
      showToast(`Building "${name}" deleted`);
      loadBuildings();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete building', 'error');
    }
  };

  const handleDuplicateBuilding = async (id: number) => {
    try {
      await blockService.duplicateBuilding(id);
      showToast('Building duplicated successfully');
      loadBuildings();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to duplicate building', 'error');
    }
  };

  const handleSelectShape = (shape: GeometryType) => {
    setSelectedShape(shape);
    const x = editingBuilding?.x || 50;
    const y = editingBuilding?.y || 50;
    const w = editingBuilding?.width || 300;
    const h = editingBuilding?.height || 200;

    if (shape === 'L-SHAPE' as any || shape === 'POLYGON') {
      setVertices([
        { x: x, y: y },
        { x: x + w, y: y },
        { x: x + w, y: y + h / 2 },
        { x: x + w / 2, y: y + h / 2 },
        { x: x + w / 2, y: y + h },
        { x: x, y: y + h }
      ]);
    } else if (shape === 'CIRCLE' || shape === 'ELLIPSE') {
      setVertices([]);
    } else {
      setVertices([
        { x: x, y: y },
        { x: x + w, y: y },
        { x: x + w, y: y + h },
        { x: x, y: y + h }
      ]);
    }
  };

  const handleAddVertex = () => {
    if (vertices.length === 0) return;
    const last = vertices[vertices.length - 1];
    setVertices([...vertices, { x: last.x + 40, y: last.y + 40 }]);
  };

  const handleRemoveVertex = (idx: number) => {
    if (vertices.length <= 3) {
      alert('A polygon boundary requires at least 3 vertices.');
      return;
    }
    setVertices(vertices.filter((_, i) => i !== idx));
  };

  const handleVertexDrag = (idx: number, dx: number, dy: number) => {
    const updated = [...vertices];
    updated[idx] = { x: Math.max(0, updated[idx].x + dx), y: Math.max(0, updated[idx].y + dy) };
    setVertices(updated);
  };

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
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Building & Block Management</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure building boundaries, custom shape geometries, floors, and departmental allocations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadBuildings}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Building</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search buildings by name, code, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadBuildings()}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="Academic">Academic</option>
            <option value="Administrative">Administrative</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Library">Library</option>
            <option value="Hostel">Hostel</option>
            <option value="Sports">Sports</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="ECE">ECE</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
            <option value="General">General</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Under Construction">Under Construction</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Buildings Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-xs font-semibold">Loading university buildings...</p>
        </div>
      ) : buildings.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Building2 className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">No buildings found matching filters</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Create a new building or clear search filters to view university infrastructure.</p>
          <button onClick={handleOpenAddModal} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md">
            + Create Building
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {buildings.map((bldg) => (
            <div
              key={bldg.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                      {bldg.code}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">{bldg.name}</h3>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bldg.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-100 text-amber-700'}`}>
                    {bldg.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {bldg.description || 'No description provided.'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Type</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{bldg.building_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Department</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{bldg.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Floors</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {bldg.floors_count || bldg.total_floors || 1} Levels
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Geometry</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                      {bldg.geometry_type || 'RECTANGLE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 gap-2">
                <button
                  onClick={() => onNavigateToFloors && onNavigateToFloors(bldg.id)}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Manage Floors</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicateBuilding(bldg.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Duplicate Building"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(bldg)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit Building"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBuilding(bldg.id, bldg.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete Building"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT BUILDING MODAL WITH GEOMETRY DRAWER */}
      {isModalOpen && editingBuilding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                {editingBuilding.id ? `Edit Building: ${editingBuilding.name}` : 'Create New Building Block'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBuilding} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Building Code *</label>
                  <input
                    type="text"
                    required
                    value={editingBuilding.code || ''}
                    onChange={(e) => setEditingBuilding({ ...editingBuilding, code: e.target.value })}
                    placeholder="e.g. CSE-BLK-01"
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold uppercase text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Building Name *</label>
                  <input
                    type="text"
                    required
                    value={editingBuilding.name || ''}
                    onChange={(e) => setEditingBuilding({ ...editingBuilding, name: e.target.value })}
                    placeholder="e.g. CSE Main Block"
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Total Floors</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editingBuilding.total_floors || 1}
                    onChange={(e) => setEditingBuilding({ ...editingBuilding, total_floors: Number(e.target.value) })}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Building Type</label>
                  <select
                    value={editingBuilding.building_type || 'Academic'}
                    onChange={(e) => setEditingBuilding({ ...editingBuilding, building_type: e.target.value as any })}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Library">Library</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={editingBuilding.department || ''}
                    onChange={(e) => setEditingBuilding({ ...editingBuilding, department: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={editingBuilding.status || 'Active'}
                    onChange={(e) => setEditingBuilding({ ...editingBuilding, status: e.target.value as any })}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingBuilding.description || ''}
                  onChange={(e) => setEditingBuilding({ ...editingBuilding, description: e.target.value })}
                  placeholder="Detailed description of building facilities, wings, and access..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              {/* BOUNDARY GEOMETRY EDITOR */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Custom Building Geometry & Boundary Drawer
                  </h4>
                  <div className="flex items-center gap-2">
                    {selectedShape === 'POLYGON' && (
                      <button
                        type="button"
                        onClick={handleAddVertex}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold"
                      >
                        + Add Vertex
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {(['RECTANGLE', 'SQUARE', 'CIRCLE', 'ELLIPSE', 'ROUNDED_RECTANGLE', 'POLYGON', 'L-SHAPE'] as GeometryType[]).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => handleSelectShape(shape)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${selectedShape === shape ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>

                {/* SVG Geometry Preview */}
                <div className="relative h-48 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full">
                    <defs>
                      <pattern id="grid-bldg" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-bldg)" />

                    {selectedShape === 'CIRCLE' ? (
                      <circle cx="200" cy="100" r="70" fill="rgba(59, 130, 246, 0.2)" stroke="#3B82F6" strokeWidth="2" />
                    ) : selectedShape === 'ELLIPSE' ? (
                      <ellipse cx="200" cy="100" rx="100" ry="60" fill="rgba(59, 130, 246, 0.2)" stroke="#3B82F6" strokeWidth="2" />
                    ) : selectedShape === 'ROUNDED_RECTANGLE' ? (
                      <rect x="50" y="30" width="300" height="140" rx="20" fill="rgba(59, 130, 246, 0.2)" stroke="#3B82F6" strokeWidth="2" />
                    ) : (
                      <polygon
                        points={vertices.map((v) => `${v.x},${v.y}`).join(' ')}
                        fill="rgba(59, 130, 246, 0.2)"
                        stroke="#3B82F6"
                        strokeWidth="2"
                      />
                    )}

                    {/* Vertex Draggable Points */}
                    {vertices.map((v, idx) => (
                      <g key={idx}>
                        <circle cx={v.x} cy={v.y} r="6" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" className="cursor-pointer" />
                        <text x={v.x + 8} y={v.y + 4} fill="#F59E0B" fontSize="9" fontWeight="bold">V{idx + 1}</text>
                      </g>
                    ))}
                  </svg>
                </div>
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Building</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default BuildingManagement;
