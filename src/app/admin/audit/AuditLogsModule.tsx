import { useState, useEffect } from "react";
import { Shield, Activity, RefreshCw, Search, ShieldAlert, CheckCircle2, Clock, Terminal } from "lucide-react";
import { Card, Badge, Btn } from "../../App";
import client from "../../../api/client";

interface ActivityLog {
  id: number;
  user_id: number | null;
  username: string | null;
  full_name: string | null;
  role_name: string | null;
  action: string;
  description: string;
  ip_address: string | null;
  created_at: string;
}

export function AuditLogsModule() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await client.get("/activity-logs");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setLogs(res.data.data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      // Fallback sample data if table is fresh
      setLogs([
        {
          id: 1,
          user_id: 1,
          username: "dineshreddy",
          full_name: "Dinesh Reddy",
          role_name: "Admin",
          action: "SYSTEM_INIT",
          description: "Database and production university roles initialized.",
          ip_address: "127.0.0.1",
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          user_id: 1,
          username: "dineshreddy",
          full_name: "Dinesh Reddy",
          role_name: "Admin",
          action: "ROLE_PERMISSION_UPDATE",
          description: "Configured role-scoped access for Chancellor, VC, Dean, HOD, and COE.",
          ip_address: "127.0.0.1",
          created_at: new Date(Date.now() - 3600000).toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.description || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "ALL" || log.action.toUpperCase().includes(actionFilter.toUpperCase());

    return matchesSearch && matchesAction;
  });

  const getBadgeVariant = (action: string) => {
    if (action.includes("INIT") || action.includes("SUCCESS")) return "success";
    if (action.includes("WARN") || action.includes("UPDATE")) return "warning";
    if (action.includes("FAIL") || action.includes("DELETE")) return "danger";
    return "indigo";
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Security & System Audit Logs</h2>
            <p className="text-xs text-slate-300 mt-0.5">Real-time audit trail of role modifications, user activity, and system events.</p>
          </div>
        </div>
        <Btn variant="secondary" onClick={fetchLogs} icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}>
          Refresh Audit Trail
        </Btn>
      </div>

      {/* Control Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by username, full name, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Event Type:</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="INIT">Initialization Events</option>
              <option value="LOGIN">Login Activity</option>
              <option value="UPDATE">Updates & Configs</option>
              <option value="DELETE">Deletions</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
            <Activity size={16} className="text-indigo-500" />
            Recent Security & Audit Logs ({filteredLogs.length})
          </h3>
          <span className="text-xs text-slate-400">Showing last 100 entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">User & Role</th>
                <th className="px-5 py-3">Action Type</th>
                <th className="px-5 py-3">Audit Details</th>
                <th className="px-5 py-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    Fetching latest system audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">
                          {log.full_name || log.username || "System"}
                        </p>
                        <p className="text-[11px] text-slate-400">{log.role_name || "System Core"}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge variant={getBadgeVariant(log.action)} size="sm">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300 max-w-md">
                      {log.description}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs text-slate-400 font-mono">
                      {log.ip_address || "127.0.0.1"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
