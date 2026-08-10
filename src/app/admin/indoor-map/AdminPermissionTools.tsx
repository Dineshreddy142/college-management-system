import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Users,
  UserCheck,
  UserPlus,
  Trash2,
  Check,
  X,
  Building,
  Layers,
  Edit3,
  Eye,
  Settings,
  Sparkles,
  ArrowDown,
  Info,
  Sliders,
  Search
} from "lucide-react";
import client from "../../../api/client";

export interface RoleConfig {
  id: string;
  name: string;
  level: number;
  description: string;
  badge: string;
  color: string;
  permissions: string[];
}

export interface PermissionDefinition {
  id: string;
  name: string;
  desc: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  scope: string;
  assignedBuilding: string;
  assignedFloor: string;
  status: string;
  lastActive: string;
}

export function AdminPermissionTools() {
  const [roles, setRoles] = useState<RoleConfig[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDefinition[]>([
    { id: "view_map", name: "View Map", desc: "Can view campus indoor 2D/3D maps and search directory" },
    { id: "edit_map", name: "Edit Map", desc: "Can enter CAD editor and modify geometry layouts" },
    { id: "add_room", name: "Add Room", desc: "Can draw and provision new classroom/lab polygons" },
    { id: "delete_room", name: "Delete Room", desc: "Can remove room boundaries and associated node metadata" },
    { id: "edit_facility", name: "Edit Facility", desc: "Can add, reposition, and configure elevators, stairs & POIs" },
    { id: "edit_navigation", name: "Edit Navigation", desc: "Can configure A* routing waypoints, paths, and corridors" },
    { id: "manage_users", name: "Manage Users", desc: "Can assign administrative roles and revoke user access" },
    { id: "view_analytics", name: "View Analytics", desc: "Can view occupancy telemetry, footfall heatmaps & logs" },
    { id: "export_map", name: "Export Map", desc: "Can export SVG, PNG, GeoJSON, and DXF floor blueprints" },
    { id: "publish_map", name: "Publish Map", desc: "Can publish live production blueprint versions" },
    { id: "manage_buildings", name: "Manage Buildings", desc: "Can create and configure new campus buildings and blocks" }
  ]);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleConfig | null>(null);
  const [userSearch, setUserSearch] = useState<string>("");

  // Assign Admin Modal State
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");
  const [newRole, setNewRole] = useState<string>("floor_admin");
  const [newBuilding, setNewBuilding] = useState<string>("Engineering & Tech Complex");
  const [newFloor, setNewFloor] = useState<string>("Floor 1");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch roles and users from backend
  const loadData = async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        client.get("/indoor-map/permissions/roles"),
        client.get("/indoor-map/permissions/users")
      ]);

      if (rolesRes.data?.success && rolesRes.data.data) {
        setRoles(rolesRes.data.data.roles);
        setAllPermissions(rolesRes.data.data.allPermissions);
        setSelectedRole(rolesRes.data.data.roles[0] || null);
      }
      if (usersRes.data?.success && usersRes.data.data) {
        setAdminUsers(usersRes.data.data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toggle single permission for selected role
  const handleTogglePermission = async (roleId: string, permId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const hasPerm = role.permissions.includes(permId);
    const updatedPerms = hasPerm
      ? role.permissions.filter(p => p !== permId)
      : [...role.permissions, permId];

    // Optimistic update
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, permissions: updatedPerms } : r));
    if (selectedRole?.id === roleId) {
      setSelectedRole({ ...selectedRole, permissions: updatedPerms });
    }

    try {
      await client.post("/indoor-map/permissions/roles", {
        roleId,
        permissions: updatedPerms
      });
      showToast(`✓ Updated ${role.name} permissions`);
    } catch (_) {}
  };

  // Assign New Admin User
  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    try {
      const res = await client.post("/indoor-map/permissions/assign", {
        name: newName,
        email: newEmail,
        role: newRole,
        assignedBuilding: newBuilding,
        assignedFloor: newFloor
      });

      if (res.data?.success) {
        showToast(res.data.message);
        setShowAssignModal(false);
        setNewName("");
        setNewEmail("");
        loadData();
      }
    } catch (_) {}
  };

  // Revoke Admin User
  const handleRevokeUser = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to revoke administrative map access for ${name}?`)) return;
    try {
      await client.delete(`/indoor-map/permissions/users/${id}`);
      showToast(`✓ Revoked admin access for ${name}`);
      setAdminUsers(prev => prev.filter(u => u.id !== id));
    } catch (_) {}
  };

  const filteredUsers = adminUsers.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none">
      
      {/* ------------------------------------------------------------ */}
      {/* TOP HEADER & ACCESS CONTROL SUMMARY */}
      {/* ------------------------------------------------------------ */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Admin Permission & Access Control Tools</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                5 Roles • 11 Permissions Matrix
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Role-based access control (RBAC), building and floor administration scopes, and granular editing privileges
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAssignModal(true)}
          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
        >
          <UserPlus size={14} />
          <span>Assign New Admin</span>
        </button>
      </div>

      {/* Floating Toast */}
      {toastMessage && (
        <div className="absolute top-16 right-6 z-50 bg-slate-900/95 border border-purple-500/50 text-purple-200 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-top-2">
          <Sparkles size={14} className="text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* MAIN BODY: SPLIT VIEW (ROLES HIERARCHY & MATRIX / USERS) */}
      {/* ------------------------------------------------------------ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: 5 ROLES HIERARCHY TREE */}
        {/* ============================================================ */}
        <div className="w-full lg:w-72 bg-slate-950/60 border-r border-slate-800 p-4 space-y-3 overflow-y-auto">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Hierarchy Levels:
          </span>

          <div className="space-y-2">
            {roles.map((r, idx) => {
              const isSelected = selectedRole?.id === r.id;

              return (
                <div key={r.id} className="space-y-1.5">
                  <div
                    onClick={() => setSelectedRole(r)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-purple-600/20 border-purple-500 shadow-md text-white"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                        <span>{r.name}</span>
                      </span>
                      <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950 text-purple-300 border border-slate-800">
                        Lvl {r.level}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{r.description}</p>
                    
                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                      <span>{r.badge}</span>
                      <span className="text-purple-400 font-bold">{r.permissions.length} perms</span>
                    </div>
                  </div>

                  {idx < roles.length - 1 && (
                    <div className="flex justify-center text-slate-600">
                      <ArrowDown size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* MIDDLE COLUMN: INTERACTIVE PERMISSIONS MATRIX */}
        {/* ============================================================ */}
        <div className="flex-1 bg-slate-900 p-4 space-y-4 overflow-y-auto">
          {selectedRole ? (
            <div className="space-y-4">
              
              {/* Selected Role Header Card */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{selectedRole.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Level {selectedRole.level} Role
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{selectedRole.description}</p>
                </div>

                <div className="text-right font-mono text-xs text-slate-400">
                  <span>Granted Permissions:</span>
                  <strong className="block text-sm text-purple-400">{selectedRole.permissions.length} / {allPermissions.length}</strong>
                </div>
              </div>

              {/* 11 Granular Permissions Grid */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Permissions Configuration ({selectedRole.name}):
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {allPermissions.map((perm) => {
                    const isGranted = selectedRole.permissions.includes(perm.id);

                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleTogglePermission(selectedRole.id, perm.id)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isGranted
                            ? "bg-purple-950/40 border-purple-500/50 shadow-inner"
                            : "bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-90"
                        }`}
                      >
                        <div className="space-y-0.5 pr-2">
                          <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isGranted ? "text-purple-200" : "text-slate-400"}`}>
                            {isGranted ? <ShieldCheck size={14} className="text-purple-400" /> : <Shield size={14} className="text-slate-600" />}
                            <span>{perm.name}</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-tight">{perm.desc}</p>
                        </div>

                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                          isGranted
                            ? "bg-purple-600 border-purple-500 text-white"
                            : "bg-slate-900 border-slate-700 text-transparent"
                        }`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              Select a role on the left to configure permissions.
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: ASSIGNED ADMINISTRATORS DIRECTORY */}
        {/* ============================================================ */}
        <div className="w-full lg:w-96 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 space-y-4 overflow-y-auto">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <Users size={14} className="text-purple-400" />
                <span>Campus Admin Directory</span>
              </h4>
              <p className="text-[10px] text-slate-500">{adminUsers.length} assigned administrators</p>
            </div>
          </div>

          {/* Filter Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search admin users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white"
            />
          </div>

          {/* User Cards List */}
          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-white leading-tight">{u.name}</h5>
                    <span className="text-[10px] text-slate-400 font-mono">{u.email}</span>
                  </div>
                  <button
                    onClick={() => handleRevokeUser(u.id, u.name)}
                    className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    title="Revoke Admin Access"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10.5px]">
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {u.scope}
                  </span>
                  <span className="text-slate-400 font-mono text-[9px]">{u.assignedFloor}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* ASSIGN ADMIN USER MODAL */}
      {/* ============================================================ */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <UserPlus size={16} className="text-purple-400" />
                <span>Assign Campus Administrator</span>
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAssignUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Alan Turing"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alan.turing@college.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Administrative Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-purple-300 font-bold"
                >
                  <option value="super_admin">👑 Super Admin (Full Campus Root)</option>
                  <option value="building_admin">🏢 Building Admin</option>
                  <option value="floor_admin">📐 Floor Admin</option>
                  <option value="map_editor">✏️ Map Editor (CAD & Routing)</option>
                  <option value="viewer">👁️ Viewer (Read Only)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Assigned Building</label>
                  <input
                    type="text"
                    value={newBuilding}
                    onChange={(e) => setNewBuilding(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Assigned Floor</label>
                  <input
                    type="text"
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
                >
                  Grant Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
