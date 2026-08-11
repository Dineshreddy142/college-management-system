import React, { useState, useEffect } from "react";
import { Sun, Moon, Bell, LogOut, Menu, User } from "lucide-react";
import { Avatar, Badge, cn } from "../App";
import client from "../../api/client";
import { useAuth } from "../portal/AuthContext";

export function ParentTopNav({ module, theme, toggleTheme, collapsed, onToggleSidebar, onNav }: {
  module: string;
  theme: string;
  toggleTheme: () => void;
  collapsed: boolean;
  onToggleSidebar: () => void;
  onNav: (v: string) => void;
}) {
  const { user } = useAuth();
  const getTitle = () => {
    switch (module) {
      case "dashboard": return "Dashboard Overview";
      case "children": return "My Children";
      case "attendance": return "Attendance Tracker";
      case "academics": return "Academic Performance";
      case "timetable": return "Timetable";
      default: return module.replace('-', ' ');
    }
  };

  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    client.get('/notifications').then(res => {
      setNotifications(res.data);
    }).catch(console.error);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await client.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden">
          <Menu size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{module.replace('-', ' ')}</h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-100 dark:border-emerald-900/50">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Viewing: Arjun Sharma</span>
        </div>

        <button onClick={toggleTheme} className="p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors relative">
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />}
          </button>
          {showNotifs && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-40">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && <Badge variant="info">{unreadCount} new</Badge>}
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-700/50 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>
                  ) : notifications.map((n) => (
                    <div key={n.id} onClick={() => markAsRead(n.id)} className={cn("p-3 cursor-pointer transition-colors", !n.is_read ? "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-700/40")}>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

        {(() => {
          const parentName = user?.name || user?.full_name || user?.username || "Parent User";
          return (
            <div className="flex items-center gap-3">
              <Avatar name={parentName} size="sm" />
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none capitalize">{parentName}</p>
                <p className="text-xs text-slate-500 mt-1 leading-none">{user?.email || 'Parent'}</p>
              </div>
            </div>
          );
        })()}

        <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); onNav("landing"); }} className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
