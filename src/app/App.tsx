import { useState, useCallback, useRef, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from 'react-router';
import { AuthProvider, useAuth } from './portal/AuthContext';
import { ProtectedRoute } from './portal/ProtectedRoute';
import { PortalLogin } from './portal/PortalLogin';
import { PasswordReset } from './portal/PasswordReset';
import { UpdateEmail } from './portal/UpdateEmail';
import { ForcePasswordChange } from './portal/ForcePasswordChange';
import { AccessDenied, NotFound } from './portal/ErrorPages';
import { FacultyDashboard } from "./faculty/FacultyDashboard";
import { StudentDashboard } from "./student/StudentDashboard";
import { ParentDashboard } from "./parent/ParentDashboard";
import { TimetableManager } from "./admin/timetable/TimetableManager";
import { ProfileModule } from "./shared/ProfileModule";
import { CampusMapEditor } from "./admin/campus-map/CampusMapEditor";
import { CampusMap } from "./campus-map/CampusMap";

import { BulkDataHub } from "./admin/bulk/BulkDataHub";
import { UserControlModule } from "./admin/users/UserControlModule";
import { FacultyBulkUploadModal } from "./admin/faculty-assignment/FacultyBulkUploadModal";
import client from "../api/client";
import {
  LayoutDashboard, Users, GraduationCap, Calendar, DollarSign,
  BookOpen, Briefcase, BarChart3, Settings, Bell, Search,
  Moon, Sun, Menu, X, ChevronDown, ChevronRight, ChevronLeft,
  TrendingUp, TrendingDown, CheckCircle, Clock, Star, Plus,
  Filter, Download, Eye, EyeOff, Edit2, Trash2, Mail, Phone,
  Award, FileText, UserCheck, ArrowRight, Activity,
  Shield, Globe, MessageSquare, LogOut, User,
  Home, Send, Building, AlertTriangle, Info,
  Zap, Lock, Key, Smartphone, AlertCircle,
  BookMarked, UserPlus, CalendarDays, Trophy, Map, Compass,
  FileSpreadsheet, Sparkles
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
export { cn, Btn } from "../components/ui/Btn";
import { cn, Btn } from "../components/ui/Btn";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const STUDENTS = [
  { id: "CS2021001", name: "Arjun Sharma", dept: "Computer Science", semester: 6, cgpa: 9.2, status: "Active", email: "arjun.s@techuniv.edu" },
  { id: "CS2021002", name: "Priya Patel", dept: "Computer Science", semester: 6, cgpa: 8.8, status: "Active", email: "priya.p@techuniv.edu" },
  { id: "ME2021003", name: "Rahul Kumar", dept: "Mechanical Eng", semester: 4, cgpa: 7.5, status: "Active", email: "rahul.k@techuniv.edu" },
  { id: "EC2021004", name: "Sneha Reddy", dept: "Electronics", semester: 4, cgpa: 9.0, status: "Active", email: "sneha.r@techuniv.edu" },
  { id: "CS2022005", name: "Vikram Singh", dept: "Computer Science", semester: 2, cgpa: 8.2, status: "Inactive", email: "vikram.s@techuniv.edu" },
  { id: "CE2021006", name: "Meera Iyer", dept: "Civil Eng", semester: 6, cgpa: 8.6, status: "Active", email: "meera.i@techuniv.edu" },
  { id: "CS2021007", name: "Rohan Verma", dept: "Computer Science", semester: 6, cgpa: 7.8, status: "Active", email: "rohan.v@techuniv.edu" },
  { id: "EC2022008", name: "Anjali Nair", dept: "Electronics", semester: 2, cgpa: 9.4, status: "Active", email: "anjali.n@techuniv.edu" },
];

const FACULTY = [
  { id: "FAC001", name: "Dr. Ramesh Gupta", dept: "Computer Science", designation: "Professor", subjects: ["Data Structures", "Algorithms"], experience: 15, status: "Active" },
  { id: "FAC002", name: "Dr. Sunita Sharma", dept: "Mathematics", designation: "Associate Prof.", subjects: ["Calculus", "Linear Algebra"], experience: 12, status: "Active" },
  { id: "FAC003", name: "Prof. Arun Mishra", dept: "Electronics", designation: "Assistant Prof.", subjects: ["Digital Circuits", "VLSI"], experience: 8, status: "Active" },
  { id: "FAC004", name: "Dr. Kavya Pillai", dept: "Mechanical Eng", designation: "Professor", subjects: ["Thermodynamics", "Fluid Mechanics"], experience: 18, status: "Active" },
  { id: "FAC005", name: "Prof. Deepak Joshi", dept: "Computer Science", designation: "Associate Prof.", subjects: ["Operating Systems", "Networks"], experience: 10, status: "On Leave" },
];

const ATTENDANCE_DATA = [
  { month: "Aug", attendance: 92, target: 85 }, { month: "Sep", attendance: 88, target: 85 },
  { month: "Oct", attendance: 94, target: 85 }, { month: "Nov", attendance: 79, target: 85 },
  { month: "Dec", attendance: 85, target: 85 }, { month: "Jan", attendance: 91, target: 85 },
  { month: "Feb", attendance: 87, target: 85 }, { month: "Mar", attendance: 93, target: 85 },
];

const FEE_DATA = [
  { month: "Aug", collected: 42, pending: 8 }, { month: "Sep", collected: 38, pending: 12 },
  { month: "Oct", collected: 51, pending: 4 }, { month: "Nov", collected: 29, pending: 6 },
  { month: "Dec", collected: 46, pending: 9 }, { month: "Jan", collected: 58, pending: 2 },
  { month: "Feb", collected: 41, pending: 7 }, { month: "Mar", collected: 53, pending: 3 },
];

const DEPT_DATA = [
  { name: "CS", value: 420, color: "#2563EB" },
  { name: "EC", value: 280, color: "#4F46E5" },
  { name: "ME", value: 240, color: "#06B6D4" },
  { name: "CE", value: 180, color: "#22C55E" },
  { name: "EE", value: 160, color: "#F59E0B" },
];

const PLACEMENT_DATA = [
  { company: "Google", students: 12, package: "₹28 LPA" },
  { company: "Microsoft", students: 8, package: "₹24 LPA" },
  { company: "Amazon", students: 15, package: "₹20 LPA" },
  { company: "Infosys", students: 45, package: "₹6 LPA" },
  { company: "TCS", students: 60, package: "₹5 LPA" },
];

const ACTIVITIES = [
  { action: "New student enrolled", subject: "Aryan Mehta — CS Department", time: "2 min ago" },
  { action: "Fee payment received", subject: "₹45,000 from Priya Patel (CS2021002)", time: "15 min ago" },
  { action: "Exam schedule published", subject: "Semester 6 End Term — May 2024", time: "1 hr ago" },
  { action: "Attendance marked", subject: "CS301 — 48/52 students present", time: "2 hrs ago" },
  { action: "Placement drive announced", subject: "Google on-campus drive — Mar 15", time: "3 hrs ago" },
];

const BOOKS = [
  { id: "B001", title: "Introduction to Algorithms", author: "Cormen et al.", dept: "CS", copies: 15, available: 8, status: "Available" },
  { id: "B002", title: "Engineering Mathematics", author: "B.S. Grewal", dept: "All", copies: 25, available: 3, status: "Limited" },
  { id: "B003", title: "Digital Signal Processing", author: "Proakis & Manolakis", dept: "EC", copies: 10, available: 0, status: "Unavailable" },
  { id: "B004", title: "Fluid Mechanics", author: "Frank White", dept: "ME", copies: 12, available: 9, status: "Available" },
  { id: "B005", title: "Database Systems", author: "Korth & Silberschatz", dept: "CS", copies: 18, available: 12, status: "Available" },
];

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "success" | "warning" | "danger" | "error" | "info" | "indigo" | "purple";

export function Badge({ children, variant = "default", size = "md", className = "" }: {
  children: React.ReactNode; variant?: BadgeVariant; size?: "sm" | "md"; className?: string;
}) {
  const v = {
    default: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    error: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };
  const s = { sm: "px-1.5 py-0.5 text-xs rounded-md", md: "px-2.5 py-0.5 text-xs rounded-lg" };
  return <span className={cn("inline-flex items-center font-medium", v[variant] || v.default, s[size], className)}>{children}</span>;
}

export function Card({ children, className = "", hover = false, onClick }: {
  children: React.ReactNode; className?: string; hover?: boolean; onClick?: React.MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div onClick={onClick} className={cn("bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm", hover && "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer", className)}>
      {children}
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "xs" | "sm" | "md" | "lg" | "xl" }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const sizes = { xs: "w-6 h-6 text-xs", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base", xl: "w-16 h-16 text-xl" };
  const colors = ["bg-blue-500", "bg-indigo-500", "bg-cyan-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-teal-500"];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0", sizes[size], bg)}>
      {initials}
    </div>
  );
}

export type StatColor = "blue" | "green" | "emerald" | "amber" | "red" | "indigo" | "cyan" | "purple";

export function StatCard({ title, value, change, changeType, icon, color = "blue", subtitle }: {
  title: string; value: string | number; change?: string; changeType?: "up" | "down";
  icon: React.ReactNode; color?: StatColor; subtitle?: string;
}) {
  const colors: Record<StatColor, { bg: string; ic: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", ic: "text-blue-600 dark:text-blue-400" },
    green: { bg: "bg-emerald-50 dark:bg-emerald-900/20", ic: "text-emerald-600 dark:text-emerald-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/20", ic: "text-emerald-600 dark:text-emerald-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-900/20", ic: "text-amber-600 dark:text-amber-400" },
    red: { bg: "bg-red-50 dark:bg-red-900/20", ic: "text-red-600 dark:text-red-400" },
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/20", ic: "text-indigo-600 dark:text-indigo-400" },
    cyan: { bg: "bg-cyan-50 dark:bg-cyan-900/20", ic: "text-cyan-600 dark:text-cyan-400" },
    purple: { bg: "bg-purple-50 dark:bg-purple-900/20", ic: "text-purple-600 dark:text-purple-400" },
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{title}</p>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {changeType === "up" ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-0.5">▲ {change}</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center gap-0.5">▼ {change}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-2xl flex-shrink-0", (colors[color] || colors.blue).bg)}>
          <div className={(colors[color] || colors.blue).ic}>{icon}</div>
        </div>
      </div>
    </Card>
  );
}

export function PBar({ value, max = 100, color = "blue" }: { value: number; max?: number; color?: StatColor }) {
  const pct = Math.min((value / max) * 100, 100);
  const colors: Record<StatColor, string> = {
    blue: "bg-blue-600", green: "bg-emerald-500", emerald: "bg-emerald-500", amber: "bg-amber-500",
    red: "bg-red-500", indigo: "bg-indigo-500", cyan: "bg-cyan-500", purple: "bg-purple-500",
  };
  return (
    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
      <div className={cn("h-full rounded-full transition-all duration-500", colors[color])} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SInput({ label, type = "text", placeholder, value, onChange, icon, className = "", ...props }: {
  label?: string; type?: string; placeholder?: string; value?: string;
  onChange?: (e: any) => void; icon?: React.ReactNode; className?: string; [k: string]: any;
}) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        <input type={type} placeholder={placeholder} value={value} onChange={onChange}
          className={cn("w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all py-2.5 text-sm", icon ? "pl-10 pr-4" : "px-4")}
          {...props} />
      </div>
    </div>
  );
}

function SearchBar({ placeholder = "Search...", value, onChange }: { placeholder?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR & TOP NAV
// ─────────────────────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
  { id: "users", label: "User Access Control", icon: Shield, badge: "Block/Face" },
  { id: "bulk-data", label: "Bulk Excel Hub", icon: FileSpreadsheet, badge: "AI Sync" },
  { id: "profile", label: "Security & Face ID", icon: UserCheck, badge: "Biometrics" },
  { id: "academic", label: "Academic & Subjects", icon: BookOpen, badge: "New" },
  { id: "students", label: "Students", icon: GraduationCap, badge: "1,280" },
  { id: "faculty", label: "Faculty", icon: Users, badge: null },
  { id: "mentors", label: "Mentors", icon: Shield, badge: "New" },
  { id: "attendance", label: "Attendance", icon: UserCheck, badge: "3" },
  { id: "exams", label: "Examinations", icon: FileText, badge: null },
  { id: "timetable", label: "Timetable", icon: CalendarDays, badge: null },
  { id: "fees", label: "Fee Management", icon: DollarSign, badge: null },
  { id: "library", label: "Library", icon: BookOpen, badge: null },
  { id: "placement", label: "Placement", icon: Briefcase, badge: "New" },
  { id: "campus-map", label: "Campus Map", icon: Map, badge: "Editor" },

  { id: "reports", label: "Reports", icon: BarChart3, badge: null },
  { id: "settings", label: "Settings", icon: Settings, badge: null },
];

function Sidebar({ active, onChange, collapsed, onToggle, onNav, mobileOpen, onMobileClose }: {
  active: string; onChange: (m: string) => void;
  collapsed: boolean; onToggle: () => void; onNav: (v: string) => void;
  mobileOpen?: boolean; onMobileClose?: () => void;
}) {
  const { user, logout } = useAuth();
  
  // Filter sidebar items based on role
  const filteredItems = SIDEBAR_ITEMS.filter(item => {
    const normRole = (user?.role || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normRole || normRole === 'admin' || normRole === 'administrator' || normRole === 'principal' || normRole === 'systemadmin' || normRole === 'office') return true;
    if (normRole === 'hod') return ['dashboard', 'users', 'academic', 'students', 'faculty', 'attendance', 'timetable', 'reports', 'settings'].includes(item.id);
    if (normRole === 'accountant') return ['dashboard', 'users', 'fees', 'reports', 'settings'].includes(item.id);
    if (normRole === 'librarian') return ['dashboard', 'library', 'settings'].includes(item.id);
    if (normRole === 'placement') return ['dashboard', 'placement', 'students', 'reports', 'settings'].includes(item.id);
    return true; // Default to all if unknown
  });

  const handleItemClick = (id: string) => {
    onChange(id);
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 z-50",
        "lg:static fixed top-0 bottom-0 left-0",
        mobileOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full lg:translate-x-0",
        collapsed ? "lg:w-16" : "lg:w-64"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center h-16 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 px-4", (collapsed && !mobileOpen) ? "lg:justify-center justify-between" : "justify-between px-5")}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <GraduationCap size={15} className="text-white" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">EduERP</p>
                <p className="text-xs text-slate-400 mt-0.5">{user?.role || 'Admin'} Portal</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => {
              if (mobileOpen && onMobileClose) {
                onMobileClose();
              } else {
                onToggle();
              }
            }} 
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {mobileOpen ? <X size={18} /> : (collapsed ? <ChevronRight size={15} className="hidden lg:block" /> : <ChevronLeft size={15} className="hidden lg:block" />)}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = active === item.id;
            const isCollapsedDesktop = collapsed && !mobileOpen;
            return (
              <button key={item.id} onClick={() => handleItemClick(item.id)}
                title={isCollapsedDesktop ? item.label : undefined}
                className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
                  isCollapsedDesktop && "lg:justify-center")}>
                <Icon size={17} className="flex-shrink-0" />
                {(!collapsed || mobileOpen) && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge && (
                      <span className={cn("text-xs px-1.5 py-0.5 rounded-md font-medium",
                        item.badge === "New" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400")}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className={cn("border-t border-slate-100 dark:border-slate-800 p-3")}>
          {(!collapsed || mobileOpen) ? (
            <div 
              onClick={() => handleItemClick("profile")}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Open Security & Face ID"
            >
              <Avatar name={user?.name || user?.full_name || user?.username || "Admin User"} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate capitalize">{user?.name || user?.full_name || user?.username || "Admin User"}</p>
                <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium truncate">Security & Face ID</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); logout(); onNav("landing"); }} className="text-slate-400 hover:text-red-500 transition-colors" title="Logout">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => handleItemClick("profile")} className="w-full flex justify-center p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="Security & Face ID">
              <UserCheck size={16} className="text-indigo-500" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function TopNav({ module, theme, toggleTheme, collapsed, onToggleSidebar }: {
  module: string; theme: string; toggleTheme: () => void; collapsed: boolean; onToggleSidebar: () => void;
}) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  
  useEffect(() => {
    client.get('/notifications').then(res => {
      setNotifications(res.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      client.get(`/api/search?q=${searchQuery}`).then(res => {
        setSearchResults(res.data);
        setShowSearch(true);
      }).catch(console.error);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  }, [searchQuery]);

  const markAsRead = async (id: number) => {
    try {
      await client.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    users: "User Access Control",
    "bulk-data": "Bulk Excel Hub",
    profile: "Security & Face ID",
    students: "Student Management", faculty: "Faculty Management",
    mentors: "Mentor Management",
    attendance: "Attendance", exams: "Examinations", timetable: "Timetable",
    fees: "Fee Management", library: "Library", placement: "Placement",
    "campus-map": "Interactive Campus Map",
    reports: "Reports & Analytics", settings: "Settings",
  };
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar} 
          className={`p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${collapsed ? 'block' : 'block lg:hidden'}`}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{labels[module] || module}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block z-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search students, faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if(searchResults.length > 0) setShowSearch(true) }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2 text-sm w-56 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-300 dark:text-slate-600 font-mono">⌘K</span>
          
          {showSearch && searchResults.length > 0 && (
            <>
              <div className="fixed inset-0" onClick={() => setShowSearch(false)} />
              <div className="absolute top-12 left-0 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-2">
                  {searchResults.map((r, i) => (
                    <div key={i} className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer rounded-lg">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Bell size={17} />
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

        <Avatar name="Admin User" size="sm" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MODULES
// ─────────────────────────────────────────────────────────────────────────────

function DashboardHome({ onNavigate }: { onNavigate?: (module: string) => void }) {
  const [stats, setStats] = useState({ totalStudents: 0, totalFaculty: 0, activeCourses: 0, pendingFees: '₹0', avgAttendance: '0%' });
  
  useEffect(() => {
    client.get('/dashboard/admin').then(res => {
      setStats(res.data);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-5">
      {/* Quick Access Security Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-900/50">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 flex-shrink-0">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Admin Control & Security Hub</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">Active</span>
            </h2>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Manage account login status, block/unblock users, and reset 3D Face Biometrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {onNavigate && (
            <button
              onClick={() => onNavigate("users")}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield size={15} />
              <span>User Access Control</span>
            </button>
          )}
          {onNavigate && (
            <button
              onClick={() => onNavigate("bulk-data")}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              <span>Bulk Data Hub</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents} change="+48 this semester" changeType="up" icon={<GraduationCap size={19} />} color="blue" />
        <StatCard title="Faculty Members" value={stats.totalFaculty} change="+5 new joinings" changeType="up" icon={<Users size={19} />} color="indigo" />
        <StatCard title="Avg Attendance" value={stats.avgAttendance || "88.4%"} change="-2.1% from last month" changeType="down" icon={<UserCheck size={19} />} color="green" />
        <StatCard title="Fee Collection" value={stats.pendingFees || "₹0"} change="+12% this month" changeType="up" icon={<DollarSign size={19} />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Attendance Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly attendance vs 85% target</p>
            </div>
            <Badge variant="success">On Track</Badge>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={ATTENDANCE_DATA}>
              <defs>
                <linearGradient id="dashAttGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[70, 100]} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.1)", fontSize: "12px" }} />
              <Area type="monotone" dataKey="target" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth={2} fill="none" name="Target" />
              <Area type="monotone" dataKey="attendance" stroke="#2563EB" strokeWidth={2.5} fill="url(#dashAttGrad)" name="Attendance %" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">By Department</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={DEPT_DATA} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value">
                {DEPT_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} students`, ""]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.1)", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {DEPT_DATA.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{d.name}</span>
                </div>
                <span className="text-xs font-medium text-slate-900 dark:text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Fee Collection</h3>
              <p className="text-xs text-slate-400 mt-0.5">Collected (₹L) vs Pending (₹L)</p>
            </div>
            <Btn variant="outline" size="sm" icon={<Download size={12} />}>Export</Btn>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={FEE_DATA} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
              <Tooltip formatter={(v: number) => [`₹${v}L`, ""]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.1)", fontSize: "12px" }} />
              <Bar dataKey="collected" fill="#2563EB" radius={[4, 4, 0, 0]} name="Collected" />
              <Bar dataKey="pending" fill="#FCA5A5" radius={[4, 4, 0, 0]} name="Pending" />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {ACTIVITIES.map((a, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{a.action}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{a.subject}</p>
                  <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Placed Students" value="312" change="78% placement rate" changeType="up" icon={<Trophy size={19} />} color="cyan" />
        <StatCard title="Books Issued" value="847" subtitle="128 overdue" icon={<BookOpen size={19} />} color="indigo" />
        <StatCard title="Active Courses" value="94" subtitle="12 departments" icon={<Award size={19} />} color="blue" />
        <StatCard title="Pending Fees" value="₹38L" change="-8% from last month" changeType="up" icon={<AlertTriangle size={19} />} color="amber" />
      </div>
    </div>
  );
}

function StudentManagement({ onGoBulk }: { onGoBulk?: () => void }) {
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [page, setPage] = useState(1);
  const perPage = 5;

  useEffect(() => {
    client.get('/students').then(res => setStudentsData(res.data)).catch(console.error);
  }, []);

  const mappedStudents = studentsData.map(s => ({
    id: s.admission_number || `STU${s.id}`,
    name: `${s.first_name} ${s.last_name}`,
    email: s.email,
    dept: s.department_name || "Computer Science",
    semester: s.semester || 1,
    cgpa: 8.5,
    status: s.status || "Active"
  }));

  const filtered = mappedStudents.filter(s =>
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())) &&
    (dept === "All" || s.dept === dept)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const rows = filtered.slice((page - 1) * perPage, page * perPage);
  const depts = ["All", ...Array.from(new Set(mappedStudents.map(s => s.dept as string)))];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={studentsData.length > 0 ? studentsData.length.toString() : "1,280"} change="+48 this term" changeType="up" icon={<GraduationCap size={19} />} color="blue" />
        <StatCard title="Active" value={studentsData.length > 0 ? studentsData.length.toString() : "1,247"} subtitle="97.4% active rate" icon={<CheckCircle size={19} />} color="green" />
        <StatCard title="New Admissions" value="320" subtitle="Current academic year" icon={<UserPlus size={19} />} color="indigo" />
        <StatCard title="Avg CGPA" value="8.42" change="+0.3 from last year" changeType="up" icon={<Award size={19} />} color="amber" />
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3 justify-between">
          <SearchBar placeholder="Search by name or ID…" value={search} onChange={v => { setSearch(v); setPage(1); }} />
          <div className="flex items-center gap-2">
            <select value={dept} onChange={e => { setDept(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {depts.map(d => <option key={d}>{d}</option>)}
            </select>
            {onGoBulk && (
              <button
                type="button"
                onClick={onGoBulk}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-sm"
              >
                <FileSpreadsheet size={14} />
                <span>Bulk Import .XLSX</span>
              </button>
            )}
            <Btn variant="primary" size="sm" icon={<Plus size={13} />}>Add Student</Btn>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-700/50">
                {["Student", "ID", "Department", "Semester", "CGPA", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {rows.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">{s.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{s.dept}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">Sem {s.semester}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{s.cgpa}</span>
                      <div className="w-16"><PBar value={s.cgpa} max={10} color={s.cgpa >= 8.5 ? "green" : s.cgpa >= 7 ? "blue" : "amber"} /></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant={s.status === "Active" ? "success" : "warning"}>{s.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Btn variant="ghost" size="sm" icon={<Eye size={13} />} />
                      <Btn variant="ghost" size="sm" icon={<Edit2 size={13} />} />
                      <Btn variant="ghost" size="sm" icon={<Trash2 size={13} />} />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-slate-400">No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
          <p className="text-xs text-slate-400">Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1">
            <Btn variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} icon={<ChevronLeft size={13} />} />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Btn key={p} variant={p === page ? "primary" : "outline"} size="sm" onClick={() => setPage(p)}>{p}</Btn>
            ))}
            <Btn variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} icon={<ChevronRight size={13} />} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function AdminMentorManagement() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mentor Allocation</h2>
          <p className="text-sm text-slate-500">Assign students to faculty mentors.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={16} />}>Assign Mentors</Btn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Mentors" value="45" icon={<Shield size={19} />} color="indigo" />
        <StatCard title="Total Mentees" value="1,205" icon={<Users size={19} />} color="blue" />
        <StatCard title="Unassigned Students" value="75" subtitle="Requires action" icon={<AlertTriangle size={19} />} color="amber" />
      </div>

      <Card className="p-5">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Current Mentor Workloads</h3>
          <SInput placeholder="Search faculty..." icon={<Search size={15} />} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
              <tr>
                <th className="px-4 py-3 rounded-l-xl font-medium">Faculty Name</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Year 1</th>
                <th className="px-4 py-3 font-medium">Year 2</th>
                <th className="px-4 py-3 font-medium">Year 3</th>
                <th className="px-4 py-3 font-medium">Year 4</th>
                <th className="px-4 py-3 rounded-r-xl font-medium">Total Mentees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: "Dr. Rajesh Kumar", dept: "Computer Science", y1: 15, y2: 15, y3: 15, y4: 15, total: 60 },
                { name: "Prof. Anjali Sharma", dept: "Information Tech", y1: 20, y2: 20, y3: 10, y4: 10, total: 60 },
                { name: "Dr. Vikram Singh", dept: "Electronics", y1: 10, y2: 15, y3: 15, y4: 20, total: 60 },
              ].map((m, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Avatar name={m.name} size="sm" /> {m.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.dept}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.y1}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.y2}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.y3}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.y4}</td>
                  <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function FacultyManagement({ onGoBulk }: { onGoBulk?: () => void }) {
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [liveFaculty, setLiveFaculty] = useState<any[]>([]);

  const fetchFaculty = useCallback(async () => {
    try {
      const res = await client.get('/academic/available-faculty');
      if (res.data?.data && Array.isArray(res.data.data)) {
        setLiveFaculty(res.data.data);
      }
    } catch (e) {
      console.warn("Could not fetch live faculty:", e);
    }
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  const displayList = liveFaculty.length > 0
    ? liveFaculty.map(f => ({
        id: f.id || f.employee_id,
        name: f.name || f.full_name,
        designation: f.designation || 'Faculty Member',
        dept: f.department_name || f.dept || 'Engineering',
        status: f.status || 'Active',
        experience: f.experience || 5,
        subjects: f.subjects || ['Core Academics']
      }))
    : FACULTY;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Faculty" value={String(displayList.length)} change="+5 this year" changeType="up" icon={<Users size={19} />} color="blue" />
        <StatCard title="Departments" value="12" subtitle="Across all schools" icon={<Building size={19} />} color="indigo" />
        <StatCard title="On Leave" value="8" subtitle="5.6% of total" icon={<Clock size={19} />} color="amber" />
        <StatCard title="Avg Experience" value="11.4 yrs" subtitle="Per faculty member" icon={<Award size={19} />} color="green" />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsBulkModalOpen(true)}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
        >
          <FileSpreadsheet size={14} />
          <span>Bulk Upload Faculty (.XLSX)</span>
        </button>

        {onGoBulk && (
          <button
            type="button"
            onClick={onGoBulk}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-sm"
          >
            <FileSpreadsheet size={14} />
            <span>Open Bulk Data Hub</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayList.map(f => (
          <Card key={f.id} className="p-5" hover>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar name={f.name} size="md" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{f.name}</p>
                  <p className="text-xs text-slate-400">{f.designation}</p>
                </div>
              </div>
              <Badge variant={f.status === "Active" ? "success" : "warning"} size="sm">{f.status}</Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Building size={11} /><span>{f.dept}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Award size={11} /><span>{f.experience} years experience</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <BookOpen size={11} /><span className="truncate">{Array.isArray(f.subjects) ? f.subjects.join(", ") : f.subjects}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50">
              <Btn variant="outline" size="sm" className="flex-1">View Profile</Btn>
              <Btn variant="ghost" size="sm" icon={<Mail size={13} />} />
              <Btn variant="ghost" size="sm" icon={<Phone size={13} />} />
            </div>
          </Card>
        ))}
      </div>

      <FacultyBulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          fetchFaculty();
        }}
      />
    </div>
  );
}

function AttendanceModule({ onGoBulk }: { onGoBulk?: () => void }) {
  const [tab, setTab] = useState("daily");
  const tabs = ["daily", "monthly", "analytics", "defaulters"];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Attendance" value="86.2%" change="+2.1% from yesterday" changeType="up" icon={<UserCheck size={19} />} color="green" />
        <StatCard title="Classes Today" value="24" subtitle="8 pending" icon={<BookOpen size={19} />} color="blue" />
        <StatCard title="Defaulters ≤75%" value="47" change="+3 this week" changeType="down" icon={<AlertTriangle size={19} />} color="red" />
        <StatCard title="Avg Monthly" value="88.4%" subtitle="AY 2023-24" icon={<Activity size={19} />} color="indigo" />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                tab === t ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300")}>
              {t}
            </button>
          ))}
        </div>

        {onGoBulk && (
          <button
            type="button"
            onClick={onGoBulk}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-sm"
          >
            <FileSpreadsheet size={14} />
            <span>Upload Attendance Matrix (.XLSX)</span>
          </button>
        )}
      </div>

      {tab === "analytics" && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">Monthly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ATTENDANCE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[70, 100]} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.1)", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="attendance" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: "#2563EB", r: 4 }} name="Attendance %" />
              <Line type="monotone" dataKey="target" stroke="#FCA5A5" strokeDasharray="5 5" strokeWidth={2} name="Target 85%" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab === "defaulters" && (
        <Card>
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Attendance Defaulters (≤75%)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Students requiring immediate attention</p>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
            {STUDENTS.slice(0, 5).map((s, i) => {
              const att = [68, 72, 71, 69, 74][i];
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.id} · {s.dept}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">{att}%</p>
                      <p className="text-xs text-slate-400">attendance</p>
                    </div>
                    <Btn variant="danger" size="sm">Notify</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {(tab === "daily" || tab === "monthly") && (
        <Card>
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {tab === "daily" ? "Today's Attendance Summary" : "Monthly Attendance Report"}
            </h3>
            <Btn variant="outline" size="sm" icon={<Download size={13} />}>Download</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-700/50">
                  {["Subject", "Faculty", "Present", "Absent", "Total", "Percentage", "Status"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {[
                  { sub: "Data Structures", fac: "Dr. R. Gupta", present: 48, absent: 4, total: 52, pct: 92 },
                  { sub: "Mathematics III", fac: "Dr. S. Sharma", present: 44, absent: 8, total: 52, pct: 85 },
                  { sub: "Digital Circuits", fac: "Prof. A. Mishra", present: 38, absent: 6, total: 44, pct: 86 },
                  { sub: "Engineering Physics", fac: "Dr. K. Pillai", present: 35, absent: 9, total: 44, pct: 79 },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{r.sub}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{r.fac}</td>
                    <td className="px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">{r.present}</td>
                    <td className="px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">{r.absent}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{r.total}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{r.pct}%</span>
                        <div className="w-16"><PBar value={r.pct} color={r.pct >= 85 ? "green" : r.pct >= 75 ? "blue" : "red"} /></div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge variant={r.pct >= 85 ? "success" : r.pct >= 75 ? "warning" : "danger"}>{r.pct >= 85 ? "Good" : r.pct >= 75 ? "Average" : "Low"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function ExaminationModule({ onGoBulk }: { onGoBulk?: () => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Upcoming Exams" value="6" subtitle="Next: May 15, 2024" icon={<FileText size={19} />} color="blue" />
        <StatCard title="Results Published" value="3" subtitle="This semester" icon={<CheckCircle size={19} />} color="green" />
        <StatCard title="Avg Pass Rate" value="94.2%" change="+2.1% from last" changeType="up" icon={<Award size={19} />} color="indigo" />
        <StatCard title="Pending Results" value="2" subtitle="To be processed" icon={<Clock size={19} />} color="amber" />
      </div>
      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Exam Schedule — Semester 6 End Term</h3>
          <div className="flex items-center gap-2">
            {onGoBulk && (
              <button
                type="button"
                onClick={onGoBulk}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-sm"
              >
                <FileSpreadsheet size={14} />
                <span>Upload Marks & Auto-Grade (.XLSX)</span>
              </button>
            )}
            <Btn variant="primary" size="sm" icon={<Plus size={13} />}>Add Exam</Btn>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-700/50">
                {["Date", "Subject", "Code", "Department", "Venue", "Duration", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {[
                { date: "May 15", sub: "Data Structures", code: "CS301", dept: "CS", venue: "Hall A", dur: "3 hrs", status: "Upcoming" },
                { date: "May 17", sub: "Digital Circuits", code: "EC201", dept: "EC", venue: "Hall B", dur: "3 hrs", status: "Upcoming" },
                { date: "May 19", sub: "Engineering Math", code: "MA201", dept: "All", venue: "Main Audi", dur: "3 hrs", status: "Upcoming" },
                { date: "May 21", sub: "Thermodynamics", code: "ME301", dept: "ME", venue: "Hall C", dur: "3 hrs", status: "Upcoming" },
                { date: "Apr 20", sub: "Operating Systems", code: "CS302", dept: "CS", venue: "Hall A", dur: "3 hrs", status: "Completed" },
                { date: "Apr 18", sub: "Control Systems", code: "EC202", dept: "EC", venue: "Hall B", dur: "3 hrs", status: "Result Out" },
              ].map((e, i) => (
                <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{e.date}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{e.sub}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{e.code}</td>
                  <td className="px-4 py-3"><Badge variant="info" size="sm">{e.dept}</Badge></td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{e.venue}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{e.dur}</td>
                  <td className="px-4 py-3"><Badge variant={e.status === "Completed" ? "default" : e.status === "Result Out" ? "success" : "info"}>{e.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function FeeManagement() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Collected" value="₹4.82Cr" change="+12% this month" changeType="up" icon={<DollarSign size={19} />} color="green" />
        <StatCard title="Pending Fees" value="₹38.2L" change="-8% from last month" changeType="up" icon={<AlertTriangle size={19} />} color="amber" />
        <StatCard title="Students Paid" value="1,124" subtitle="87.8% collection rate" icon={<CheckCircle size={19} />} color="blue" />
        <StatCard title="Overdue" value="156" subtitle="Fees past due date" icon={<Clock size={19} />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">Monthly Collection Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={FEE_DATA}>
              <defs>
                <linearGradient id="feeCollGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
              <Tooltip formatter={(v: number) => [`₹${v}L`, ""]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.1)", fontSize: "12px" }} />
              <Area type="monotone" dataKey="collected" stroke="#22C55E" strokeWidth={2.5} fill="url(#feeCollGrad)" name="Collected" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Fee Category Breakdown</h3>
          <div className="space-y-3">
            {[
              { cat: "Tuition Fee", amt: "₹2.8Cr", pct: 72, color: "blue" as StatColor },
              { cat: "Hostel Fee", amt: "₹92L", pct: 68, color: "indigo" as StatColor },
              { cat: "Exam Fee", amt: "₹28L", pct: 95, color: "green" as StatColor },
              { cat: "Library Fee", amt: "₹8L", pct: 88, color: "cyan" as StatColor },
              { cat: "Transportation", amt: "₹14L", pct: 82, color: "amber" as StatColor },
            ].map(f => (
              <div key={f.cat}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{f.cat}</span>
                  <span className="text-xs text-slate-500">{f.amt} · {f.pct}%</span>
                </div>
                <PBar value={f.pct} color={f.color} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Transactions</h3>
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" icon={<Filter size={13} />}>Filter</Btn>
            <Btn variant="outline" size="sm" icon={<Download size={13} />}>Export</Btn>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-700/50">
                {["Receipt No", "Student", "Amount", "Category", "Date", "Mode", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {[
                { r: "RCP-24001", name: "Arjun Sharma", amt: "₹45,000", cat: "Tuition", date: "Mar 12", mode: "Online", status: "Success" },
                { r: "RCP-24002", name: "Priya Patel", amt: "₹12,000", cat: "Hostel", date: "Mar 12", mode: "UPI", status: "Success" },
                { r: "RCP-24003", name: "Rahul Kumar", amt: "₹45,000", cat: "Tuition", date: "Mar 11", mode: "NEFT", status: "Pending" },
                { r: "RCP-24004", name: "Sneha Reddy", amt: "₹5,800", cat: "Exam Fee", date: "Mar 10", mode: "Online", status: "Success" },
                { r: "RCP-24005", name: "Vikram Singh", amt: "₹45,000", cat: "Tuition", date: "Mar 10", mode: "Cash", status: "Failed" },
              ].map((t, i) => (
                <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{t.r}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{t.name}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">{t.amt}</td>
                  <td className="px-4 py-3"><Badge variant="info" size="sm">{t.cat}</Badge></td>
                  <td className="px-4 py-3 text-sm text-slate-500">{t.date}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{t.mode}</td>
                  <td className="px-4 py-3"><Badge variant={t.status === "Success" ? "success" : t.status === "Pending" ? "warning" : "danger"} size="sm">{t.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function LibraryManagement() {
  const [search, setSearch] = useState("");
  const filtered = BOOKS.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Books" value="8,420" subtitle="4,230 unique titles" icon={<BookOpen size={19} />} color="blue" />
        <StatCard title="Issued" value="847" subtitle="Currently checked out" icon={<BookMarked size={19} />} color="indigo" />
        <StatCard title="Overdue" value="128" subtitle="Return pending" icon={<AlertTriangle size={19} />} color="amber" />
        <StatCard title="Fines Collected" value="₹12,400" subtitle="This month" icon={<DollarSign size={19} />} color="green" />
      </div>
      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3 justify-between">
          <SearchBar placeholder="Search books or authors…" value={search} onChange={setSearch} />
          <Btn variant="primary" size="sm" icon={<Plus size={13} />}>Add Book</Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-700/50">
                {["Book ID", "Title", "Author", "Dept", "Copies", "Available", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{b.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{b.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{b.author}</td>
                  <td className="px-4 py-3"><Badge variant="info" size="sm">{b.dept}</Badge></td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{b.copies}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{b.available}</td>
                  <td className="px-4 py-3"><Badge variant={b.status === "Available" ? "success" : b.status === "Limited" ? "warning" : "danger"} size="sm">{b.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PlacementModule() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Placed Students" value="312" change="+42 this month" changeType="up" icon={<Trophy size={19} />} color="green" />
        <StatCard title="Placement Rate" value="78%" change="+5% from last year" changeType="up" icon={<TrendingUp size={19} />} color="blue" />
        <StatCard title="Highest Package" value="₹28 LPA" subtitle="Google — Arjun Sharma" icon={<Award size={19} />} color="indigo" />
        <StatCard title="Avg Package" value="₹8.4 LPA" change="+1.2 LPA from last yr" changeType="up" icon={<DollarSign size={19} />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Top Recruiters</h3>
          <div className="space-y-2.5">
            {PLACEMENT_DATA.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-slate-700 rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                    <Building size={13} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{p.company}</p>
                    <p className="text-xs text-slate-400">{p.students} students placed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{p.package}</p>
                  <p className="text-xs text-slate-400">avg pkg</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">Placement by Department</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={[
              { dept: "CS", placed: 142, eligible: 168 },
              { dept: "EC", placed: 82, eligible: 104 },
              { dept: "ME", placed: 54, eligible: 88 },
              { dept: "CE", placed: 34, eligible: 62 },
            ]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="dept" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.1)", fontSize: "12px" }} />
              <Bar dataKey="eligible" fill="#E2E8F0" radius={[0, 4, 4, 0]} name="Eligible" />
              <Bar dataKey="placed" fill="#2563EB" radius={[0, 4, 4, 0]} name="Placed" />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Placement Drives</h3>
          <Btn variant="primary" size="sm" icon={<Plus size={13} />}>Add Drive</Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-700/50">
                {["Company", "Date", "Roles", "Package Range", "Eligible", "Registered", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {[
                { co: "Google", date: "Mar 15", roles: "SDE, Data Analyst", range: "₹22–28 LPA", el: 48, reg: 42, status: "Open" },
                { co: "Microsoft", date: "Mar 20", roles: "SDE I, PM", range: "₹18–24 LPA", el: 52, reg: 38, status: "Open" },
                { co: "Amazon", date: "Mar 28", roles: "SDE, SRE", range: "₹14–20 LPA", el: 68, reg: 55, status: "Open" },
                { co: "Wipro", date: "Apr 5", roles: "Software Engineer", range: "₹5–7 LPA", el: 220, reg: 180, status: "Upcoming" },
              ].map((d, i) => (
                <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{d.co}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{d.date}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{d.roles}</td>
                  <td className="px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">{d.range}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{d.el}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{d.reg}</td>
                  <td className="px-4 py-3"><Badge variant={d.status === "Open" ? "success" : "info"} size="sm">{d.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ReportsAnalytics() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">CGPA Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { range: "9–10", count: 142 }, { range: "8–9", count: 384 },
              { range: "7–8", count: 428 }, { range: "6–7", count: 218 }, { range: "<6", count: 108 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.1)", fontSize: "12px" }} />
              <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">Dept-wise Attendance</h3>
          <div className="space-y-3 mt-2">
            {[
              { dept: "Computer Science", pct: 91 },
              { dept: "Electronics", pct: 87 },
              { dept: "Mechanical", pct: 84 },
              { dept: "Civil", pct: 89 },
              { dept: "Electrical", pct: 86 },
            ].map(d => (
              <div key={d.dept}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{d.dept}</span>
                  <span className="text-xs text-slate-500">{d.pct}%</span>
                </div>
                <PBar value={d.pct} color={d.pct >= 90 ? "green" : d.pct >= 85 ? "blue" : "amber"} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">Year-over-Year Attendance Comparison</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={[
            { m: "Aug", y23: 88, y24: 91 }, { m: "Sep", y23: 84, y24: 87 }, { m: "Oct", y23: 90, y24: 93 },
            { m: "Nov", y23: 76, y24: 80 }, { m: "Dec", y23: 82, y24: 85 }, { m: "Jan", y23: 87, y24: 91 },
            { m: "Feb", y23: 84, y24: 87 }, { m: "Mar", y23: 89, y24: 93 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
            <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[70, 100]} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.1)", fontSize: "12px" }} />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
            <Line type="monotone" dataKey="y23" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" name="2022-23" dot={false} />
            <Line type="monotone" dataKey="y24" stroke="#2563EB" strokeWidth={2.5} name="2023-24" dot={{ fill: "#2563EB", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function NotifToggle({ title, desc, defaultOn }: { title: string; desc: string; defaultOn: boolean }) {
  const [enabled, setEnabled] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <button onClick={() => setEnabled(!enabled)}
        className={cn("relative w-10 h-5 rounded-full transition-colors flex-shrink-0", enabled ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-600")}>
        <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", enabled ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

function SettingsPage({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("profile");
  const tabs = ["profile", "security", "notifications", "appearance"];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
              tab === t ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        (() => {
          const settingsDisplayName = user?.name || user?.full_name || user?.username || "User";
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <div className="flex justify-center mb-3"><Avatar name={settingsDisplayName} size="xl" /></div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white capitalize">{settingsDisplayName}</h3>
                <p className="text-sm text-slate-400 capitalize">{user?.role || "System Administrator"}</p>
                <p className="text-xs text-slate-400 mt-1">{user?.email || "user@techuniv.edu.in"}</p>
                <Btn variant="outline" size="sm" className="mt-4">Change Photo</Btn>
              </Card>
              <Card className="p-6 lg:col-span-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SInput label="Full Name" placeholder="Full Name" defaultValue={settingsDisplayName} />
                  <SInput label="Username" placeholder="User" defaultValue={user?.username || ""} disabled />
                  <SInput label="Role" placeholder="Role" defaultValue={user?.role || ""} disabled />
                  <SInput label="Email" type="email" defaultValue={user?.email || ""} />
                  <SInput label="Phone" type="tel" placeholder="+91 98765 00000" />
                  <SInput label="Department" defaultValue={user?.role === 'HOD' ? 'Computer Science' : 'Administration'} />
                  <SInput label="Employee ID" defaultValue={`EMP-${user?.id || '001'}`} />
                </div>
                <div className="flex gap-3 mt-5">
                  <Btn variant="primary">Save Changes</Btn>
                  <Btn variant="outline">Cancel</Btn>
                </div>
              </Card>
            </div>
          );
        })()
      )}

      {tab === "security" && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">Change Password</h3>
          <div className="space-y-3 max-w-md">
            <SInput label="Current Password" type="password" placeholder="Enter current password" icon={<Lock size={14} />} />
            <SInput label="New Password" type="password" placeholder="Enter new password" icon={<Lock size={14} />} />
            <SInput label="Confirm New Password" type="password" placeholder="Confirm new password" icon={<Lock size={14} />} />
            <Btn variant="primary">Update Password</Btn>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Two-Factor Authentication</h4>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <Shield size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">2FA is Enabled</p>
                  <p className="text-xs text-slate-400">Your account is protected with 2FA</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </Card>
      )}

      {tab === "notifications" && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">Notification Preferences</h3>
          <div className="space-y-3">
            {[
              { title: "Email Notifications", desc: "Receive updates via email", on: true },
              { title: "SMS Alerts", desc: "Get critical alerts via SMS", on: true },
              { title: "Fee Payment Updates", desc: "Notify on fee payments received", on: true },
              { title: "Attendance Alerts", desc: "Alert when attendance drops below 75%", on: true },
              { title: "Exam Reminders", desc: "Remind students of upcoming exams", on: false },
              { title: "Placement Updates", desc: "Updates on placement drives", on: true },
            ].map((n, i) => (
              <NotifToggle key={i} title={n.title} desc={n.desc} defaultOn={n.on} />
            ))}
          </div>
        </Card>
      )}

      {tab === "appearance" && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">Theme Mode</h3>
          <div className="flex gap-3">
            {[{ id: "light", label: "Light", icon: <Sun size={18} /> }, { id: "dark", label: "Dark", icon: <Moon size={18} /> }].map(t => (
              <button key={t.id} onClick={toggleTheme}
                className={cn("flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all w-28",
                  theme === t.id ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" : "border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600")}>
                {t.icon}
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD SHELL
// ─────────────────────────────────────────────────────────────────────────────

function AdminDashboard({ onNav, theme, toggleTheme }: { onNav: (v: string) => void; theme: string; toggleTheme: () => void }) {
  const [mod, setMod] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const render = () => {
    switch (mod) {
      case "dashboard": return <DashboardHome onNavigate={(m) => setMod(m)} />;
      case "users": return <UserControlModule />;
      case "bulk-data": return <BulkDataHub />;
      case "profile": return <ProfileModule />;
      case "students": return <StudentManagement onGoBulk={() => setMod("bulk-data")} />;
      case "faculty": return <FacultyManagement onGoBulk={() => setMod("bulk-data")} />;
      case "mentors": return <AdminMentorManagement />;
      case "attendance": return <AttendanceModule onGoBulk={() => setMod("bulk-data")} />;
      case "exams": return <ExaminationModule onGoBulk={() => setMod("bulk-data")} />;
      case "timetable": return <TimetableManager />;
      case "fees": return <FeeManagement />;
      case "library": return <LibraryManagement />;
      case "placement": return <PlacementModule />;
      case "campus-map": return <CampusMap isAdmin={true} theme={theme as any} onToggleTheme={toggleTheme} onBackToDashboard={() => setMod("dashboard")} />;

      case "reports": return <ReportsAnalytics />;
      case "settings": return <SettingsPage theme={theme} toggleTheme={toggleTheme} />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <Sidebar 
        active={mod} 
        onChange={setMod} 
        collapsed={collapsed} 
        onToggle={() => setCollapsed(!collapsed)} 
        onNav={onNav} 
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNav 
          module={mod} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          collapsed={collapsed} 
          onToggleSidebar={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              setMobileOpen(prev => !prev);
            } else {
              setCollapsed(prev => !prev);
            }
          }} 
        />
        <main className={cn("flex-1 min-w-0", mod === "campus-map" ? "overflow-hidden p-0" : "overflow-y-auto p-3 sm:p-5 scrollbar-thin")}>{render()}</main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

// STUDENT PORTAL EXTRACTED TO src/app/student/StudentDashboard.tsx

// ─────────────────────────────────────────────────────────────────────────────
// FACULTY DASHBOARD EXTRACTED TO src/app/faculty/FacultyDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// AUTH PAGES
// ─────────────────────────────────────────────────────────────────────────────

function LoginPage({ onNav }: { onNav: (v: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await client.post('/login', { email, password });
      const { token, user } = res.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      const roleStr = user.role.toLowerCase();
      const routes: Record<string, string> = { 
        admin: "admin", student: "student", faculty: "faculty", 
        parent: "parent", principal: "admin", hod: "admin", 
        accountant: "admin", librarian: "admin", "placement officer": "admin"
      };
      onNav(routes[roleStr] || "admin");
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-none">EduERP</p>
            <p className="text-xs text-blue-300 mt-0.5">College Management System</p>
          </div>
        </div>

        <div className="bg-white/8 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-sm text-blue-200/80 mb-6">Sign in to your account to continue</p>

          {error && <div className="mb-4 p-3 bg-red-500/20 text-red-200 border border-red-500/30 rounded-xl text-sm">{error}</div>}

          <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-blue-200/80 mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300/60"><Mail size={14} /></span>
                  <input type="email" placeholder="you@university.edu.in" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-200/80 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300/60"><Lock size={14} /></span>
                  <input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
          </div>

          <div className="flex items-center justify-between mt-3 mb-6">
            <label className="flex items-center gap-2 text-xs text-blue-200/70 cursor-pointer select-none">
              <input type="checkbox" className="rounded accent-blue-500" />Remember me
            </label>
            <button onClick={() => onNav("forgot")} className="text-xs text-blue-300 hover:text-white transition-colors">Forgot password?</button>
          </div>

          <button onClick={handleLogin}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-900/40 text-sm">
            {loading ? "Signing in..." : "Sign In &rarr;"}
          </button>

          <p className="text-center text-xs text-blue-300/70 mt-4">
            {"Don't have an account? "}
            <button onClick={() => onNav("register")} className="text-white font-medium hover:underline">Register</button>
          </p>
        </div>

        <p className="text-center text-xs text-blue-400/60 mt-5">
          <button onClick={() => onNav("landing")} className="hover:text-white transition-colors">← Back to homepage</button>
        </p>
      </div>
    </div>
  );
}

function RegisterPage({ onNav }: { onNav: (v: string) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-none">EduERP</p>
            <p className="text-xs text-blue-300 mt-0.5">Create your account</p>
          </div>
        </div>

        <div className="bg-white/8 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-1">Get started</h2>
          <p className="text-sm text-blue-200/80 mb-6">Fill in the details to register your institution</p>

          <div className="space-y-3">
            {[
              { label: "Full Name", type: "text", ph: "Dr. Admin Name", icon: <User size={14} /> },
              { label: "Institution Name", type: "text", ph: "Tech University", icon: <Building size={14} /> },
              { label: "Email Address", type: "email", ph: "admin@university.edu.in", icon: <Mail size={14} /> },
              { label: "Phone Number", type: "tel", ph: "+91 98765 43210", icon: <Phone size={14} /> },
              { label: "Password", type: "password", ph: "Create a strong password", icon: <Lock size={14} /> },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-medium text-blue-200/80 mb-1.5">{f.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300/60">{f.icon}</span>
                  <input type={f.type} placeholder={f.ph}
                    className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all" />
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => onNav("login")}
            className="w-full py-3 mt-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-900/40 text-sm">
            Sign In to Portal →
          </button>

          <p className="text-center text-xs text-blue-300/70 mt-4">
            Already have an account?{" "}
            <button onClick={() => onNav("login")} className="text-white font-medium hover:underline">Sign In</button>
          </p>
        </div>

        <p className="text-center text-xs text-blue-400/60 mt-5">
          <button onClick={() => onNav("landing")} className="hover:text-white transition-colors">← Back to homepage</button>
        </p>
      </div>
    </div>
  );
}

function ForgotPasswordPage({ onNav }: { onNav: (v: string) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <GraduationCap size={20} className="text-white" />
          </div>
          <p className="text-lg font-bold text-white">EduERP</p>
        </div>

        <div className="bg-white/8 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Key size={26} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Reset Password</h2>
          <p className="text-sm text-blue-200/80 mb-6">We'll send you a reset link to your email</p>

          <div className="text-left mb-5">
            <label className="block text-xs font-medium text-blue-200/80 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300/60" />
              <input type="email" placeholder="you@university.edu.in"
                className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all" />
            </div>
          </div>

          <button onClick={() => onNav("otp")}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-900/40 text-sm">
            Send Reset Link
          </button>
          <button onClick={() => onNav("login")} className="text-xs text-blue-300/70 hover:text-white transition-colors mt-4 block mx-auto">
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

function OTPPage({ onNav }: { onNav: (v: string) => void }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, v: string) => {
    if (v.length > 1) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <GraduationCap size={20} className="text-white" />
          </div>
          <p className="text-lg font-bold text-white">EduERP</p>
        </div>

        <div className="bg-white/8 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Shield size={26} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Verify OTP</h2>
          <p className="text-sm text-blue-200/80 mb-7">We sent a 6-digit code to your email address</p>

          <div className="flex justify-center gap-2 mb-7">
            {otp.map((digit, i) => (
              <input key={i} ref={el => { refs.current[i] = el; }} type="text" maxLength={1} value={digit}
                onChange={e => handleChange(i, e.target.value)}
                className="w-12 h-12 text-center text-xl font-bold bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:bg-white/15 transition-all" />
            ))}
          </div>

          <button onClick={() => onNav("login")}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-900/40 text-sm">
            Verify & Continue
          </button>
          <p className="text-xs text-blue-300/70 mt-4">
            {"Didn't receive it? "}
            <button className="text-white font-medium hover:underline">Resend OTP</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────

function LandingPage({ onNav }: { onNav: (v: string) => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    { icon: <Users size={22} />, title: "Student Management", desc: "Complete student lifecycle from admission to graduation with real-time tracking and smart analytics.", color: "blue" },
    { icon: <UserCheck size={22} />, title: "Smart Attendance", desc: "AI-powered attendance with biometric integration, automated alerts, and comprehensive reports.", color: "green" },
    { icon: <FileText size={22} />, title: "Examination System", desc: "End-to-end exam management — scheduling, marks entry, grading, and instant result processing.", color: "indigo" },
    { icon: <DollarSign size={22} />, title: "Fee Management", desc: "Streamlined fee collection with online payment gateway, automated receipts, and defaulter tracking.", color: "amber" },
    { icon: <BarChart3 size={22} />, title: "Advanced Analytics", desc: "Real-time dashboards and custom reports to power every institutional decision with data.", color: "cyan" },
    { icon: <Briefcase size={22} />, title: "Placement Portal", desc: "End-to-end placement management connecting students with top recruiters effortlessly.", color: "red" },
  ];

  const colorMap: Record<string, { bg: string; ic: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", ic: "text-blue-600 dark:text-blue-400" },
    green: { bg: "bg-emerald-50 dark:bg-emerald-900/20", ic: "text-emerald-600 dark:text-emerald-400" },
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/20", ic: "text-indigo-600 dark:text-indigo-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-900/20", ic: "text-amber-600 dark:text-amber-400" },
    cyan: { bg: "bg-cyan-50 dark:bg-cyan-900/20", ic: "text-cyan-600 dark:text-cyan-400" },
    red: { bg: "bg-red-50 dark:bg-red-900/20", ic: "text-red-600 dark:text-red-400" },
  };

  const faqs = [
    { q: "How long does implementation take?", a: "Typical implementation takes 4–6 weeks including data migration, customization, and staff training. Our dedicated team ensures a smooth transition from day one." },
    { q: "Is EduERP suitable for smaller colleges?", a: "Absolutely. EduERP scales from small institutions with 500 students to large universities with 50,000+. Pricing is modular and based on your institution's size." },
    { q: "Does it integrate with existing systems?", a: "Yes. EduERP provides REST APIs and integrates with Zoom, Google Workspace, WhatsApp notifications, Razorpay, Stripe, and many more platforms." },
    { q: "How is data security handled?", a: "All data is encrypted at rest and in transit (AES-256). We are ISO 27001 certified and FERPA compliant. Quarterly third-party security audits are conducted." },
    { q: "What support do you provide?", a: "24/7 technical support via chat, email, and phone. Every institution gets a dedicated Customer Success Manager and access to our knowledge base." },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      {/* Navbar */}
      <nav className="h-16 flex items-center justify-between px-6 lg:px-16 border-b border-slate-100 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <GraduationCap size={15} className="text-white" />
          </div>
          <span className="text-base font-bold">EduERP</span>
        </div>
        <div className="hidden md:flex items-center gap-7 text-sm text-slate-500 dark:text-slate-400">
          {["Features", "Solutions", "Pricing", "Resources"].map(l => (
            <a key={l} href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" onClick={() => onNav("admin")}>Dashboard</Btn>
          <Btn variant="primary" size="sm" onClick={() => onNav("admin")}>Get Started</Btn>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/30 to-white dark:from-blue-950/20 dark:via-slate-950 dark:to-slate-950" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/8 dark:bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/8 dark:bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-5xl mx-auto px-6 lg:px-16 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200/60 dark:border-blue-700/50 rounded-full text-xs text-blue-700 dark:text-blue-300 font-medium mb-7">
            <Zap size={11} />
            Trusted by 500+ institutions across India
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
            The Modern ERP for<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Higher Education</span>
          </h1>

          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Streamline every aspect of your institution — students, faculty, attendance, fees, examinations, and placements — in one beautifully designed platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Btn variant="primary" size="lg" onClick={() => onNav("admin")}>
              Start Free Trial <ArrowRight size={16} />
            </Btn>
            <Btn variant="outline" size="lg" onClick={() => onNav("admin")}>
              View Live Demo
            </Btn>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20 max-w-3xl mx-auto">
            {[
              { value: "500+", label: "Institutions" },
              { value: "1M+", label: "Students" },
              { value: "50K+", label: "Faculty" },
              { value: "99.9%", label: "Uptime SLA" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-sm text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50/80 dark:bg-slate-900/40">
        <div className="max-w-5xl mx-auto px-6 lg:px-16">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Everything you need</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">One platform, endless possibilities</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              From student enrollment to alumni management, EduERP covers every touchpoint of your institution's lifecycle.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <Card key={f.title} className="p-6" hover>
                <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center mb-4", colorMap[f.color].bg)}>
                  <div className={colorMap[f.color].ic}>{f.icon}</div>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Why EduERP</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-5">Built for modern education demands</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Unlike legacy ERP systems, EduERP was designed from the ground up for today's dynamic educational environment — fast, intuitive, and infinitely scalable.
              </p>
              <div className="space-y-4">
                {[
                  { icon: <Zap size={15} />, title: "Lightning Fast", desc: "< 100ms response across all modules", color: "amber" },
                  { icon: <Shield size={15} />, title: "Enterprise Security", desc: "ISO 27001 certified, FERPA compliant", color: "green" },
                  { icon: <Globe size={15} />, title: "Multi-Campus Support", desc: "Manage multiple campuses from one dashboard", color: "blue" },
                  { icon: <Smartphone size={15} />, title: "Mobile First", desc: "Native iOS & Android apps included", color: "indigo" },
                ].map(item => (
                  <div key={item.title} className="flex gap-3">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", colorMap[item.color].bg)}>
                      <div className={colorMap[item.color].ic}>{item.icon}</div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Time Saved", value: "40%", desc: "Administrative efficiency gain", color: "text-blue-600" },
                { label: "Fee Collection", value: "96%", desc: "Collection rate improvement", color: "text-emerald-600" },
                { label: "Placement Rate", value: "89%", desc: "Average placement success", color: "text-indigo-600" },
                { label: "Satisfaction", value: "4.9★", desc: "Average customer rating", color: "text-amber-600" },
              ].map(s => (
                <Card key={s.label} className="p-5 text-center">
                  <p className={cn("text-3xl font-bold mb-1", s.color)}>{s.value}</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-50/80 dark:bg-slate-900/40">
        <div className="max-w-5xl mx-auto px-6 lg:px-16">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">Trusted by educational leaders</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Dr. Vikram Nair", role: "Principal, IIT Madras", text: "EduERP transformed how we manage our institution. The analytics dashboard alone saves our admin team 20+ hours a week. Genuinely remarkable." },
              { name: "Prof. Ananya Krishnan", role: "Dean, BITS Pilani", text: "Managing 15,000+ students across 8 departments was never this seamless. The placement module helped us achieve 92% placement this year." },
              { name: "Dr. Suresh Iyer", role: "Registrar, VIT University", text: "Fee collection efficiency jumped from 72% to 96% within 3 months. Automated reminders and online payment integration made all the difference." },
            ].map(t => (
              <Card key={t.name} className="p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <Avatar name={t.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-6 lg:px-16">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">Frequently asked questions</h2>
          </div>
          <div className="space-y-2.5">
            {faqs.map((f, i) => (
              <Card key={i} className="overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-sm font-medium text-slate-900 dark:text-white pr-4">{f.q}</span>
                  <ChevronDown size={15} className={cn("text-slate-400 transition-transform flex-shrink-0", openFaq === i && "rotate-180")} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 lg:px-16 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to transform your institution?</h2>
          <p className="text-blue-100 mb-8 text-lg">Join 500+ institutions. Setup takes less than 48 hours.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Btn size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg border-0" onClick={() => onNav("admin")}>
              Start Free Trial <ArrowRight size={16} />
            </Btn>
            <Btn size="lg" className="border-2 border-white/30 text-white hover:bg-white/10 bg-transparent" onClick={() => onNav("admin")}>
              Schedule Demo
            </Btn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-16 px-6 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <GraduationCap size={15} className="text-white" />
                </div>
                <span className="text-base font-bold text-white">EduERP</span>
              </div>
              <p className="text-sm leading-relaxed mb-4 max-w-52">The complete college management platform for modern educational institutions.</p>
              <div className="flex gap-2">
                <Badge variant="success" size="sm">ISO 27001</Badge>
                <Badge variant="info" size="sm">FERPA</Badge>
              </div>
            </div>
            {[
              { label: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
              { label: "Company", links: ["About", "Blog", "Careers", "Press"] },
              { label: "Support", links: ["Docs", "Help Center", "Community", "Status"] },
            ].map(col => (
              <div key={col.label}>
                <h4 className="text-sm font-semibold text-white mb-4">{col.label}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => <li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs">© 2024 EduERP Technologies Pvt. Ltd. All rights reserved.</p>
            <div className="flex gap-5 text-xs">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(l => (
                <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

export default function App({ portalName, portalRole }: { portalName?: string; portalRole?: string } = {}) {
  return (
    <AuthProvider>
      <AppContent initialPortalName={portalName} initialPortalRole={portalRole} />
    </AuthProvider>
  );
}

function AppContent({ initialPortalName, initialPortalRole }: { initialPortalName?: string; initialPortalRole?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleNav = useCallback((newView: string) => {
    if (newView === "landing") {
      logout();
    } else {
      navigate(`/${newView}/dashboard`);
    }
  }, [navigate, logout]);

  const toggleTheme = useCallback(() => setTheme(p => p === "light" ? "dark" : "light"), []);

  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn("Unauthorized API call detected.");
      logout();
    };
    const handleForbidden = () => alert("Access Forbidden: You do not have permission for this action.");

    window.addEventListener("auth-unauthorized", handleUnauthorized);
    window.addEventListener("auth-forbidden", handleForbidden);

    return () => {
      window.removeEventListener("auth-unauthorized", handleUnauthorized);
      window.removeEventListener("auth-forbidden", handleForbidden);
    };
  }, [logout, navigate]);

  const getSubdomainPortal = () => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname.toLowerCase();
    const parts = host.split('.');
    // Match subdomain if more than standard domain parts (e.g. student.yourcollege.com or student.localhost)
    if (parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost')) {
      const sub = parts[0];
      const validRoles = ['admin', 'student', 'faculty', 'hod', 'parent', 'principal', 'office', 'accountant', 'librarian', 'placement'];
      if (validRoles.includes(sub)) {
        return sub;
      }
    }
    return '';
  };

  const detectedSubdomainRole = getSubdomainPortal();
  const activePortal = initialPortalName?.toLowerCase() || detectedSubdomainRole || ((import.meta as any).env?.VITE_PORTAL_NAME || '').toLowerCase();
  const defaultLoginRedirect = activePortal ? `/${activePortal}/login` : '/student/login';

  return (
    <div className={cn("min-h-screen font-[Inter,sans-serif]", theme === "dark" && "dark")}>
      <div className="min-h-screen bg-background text-foreground antialiased">
        <Routes>
          <Route path="/" element={<Navigate to={defaultLoginRedirect} replace />} />
          <Route path="/admin/login" element={<PortalLogin role="admin" />} />
          <Route path="/student/login" element={<PortalLogin role="student" />} />
          <Route path="/faculty/login" element={<PortalLogin role="faculty" />} />
          <Route path="/hod/login" element={<PortalLogin role="hod" />} />
          <Route path="/parent/login" element={<PortalLogin role="parent" />} />
          <Route path="/accountant/login" element={<PortalLogin role="accountant" />} />
          <Route path="/librarian/login" element={<PortalLogin role="librarian" />} />
          <Route path="/placement/login" element={<PortalLogin role="placement" />} />
          <Route path="/principal/login" element={<PortalLogin role="principal" />} />
          <Route path="/office/login" element={<PortalLogin role="office" />} />
          <Route path="/:role/login" element={<PortalLogin />} />
          <Route path="/login/:role" element={<PortalLogin />} />
          <Route path="/login" element={<PortalLogin />} />
          <Route path="/campus-map" element={<CampusMap isAdmin={false} theme={theme as any} onToggleTheme={toggleTheme} />} />
          <Route path="/map" element={<Navigate to="/campus-map" replace />} />
          <Route path="/forgot-password" element={<PasswordReset />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/update-email" element={<UpdateEmail />} />
          <Route path="/change-email" element={<UpdateEmail />} />
          <Route path="/:role/update-email" element={<UpdateEmail />} />
          <Route path="/:role/change-email" element={<UpdateEmail />} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/force-change-password" element={<ProtectedRoute><ForcePasswordChange /></ProtectedRoute>} />
          
          {/* Protected Dashboards */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="Admin"><AdminDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/admin/dashboard/*" element={<ProtectedRoute allowedRole="Admin"><AdminDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          
          <Route path="/hod/dashboard" element={<ProtectedRoute allowedRole="HOD"><AdminDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/hod/dashboard/*" element={<ProtectedRoute allowedRole="HOD"><AdminDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/hod" element={<Navigate to="/hod/dashboard" replace />} />
          
          <Route path="/accountant/dashboard" element={<ProtectedRoute allowedRole="Accountant"><AdminDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/accountant/dashboard/*" element={<ProtectedRoute allowedRole="Accountant"><AdminDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          
          <Route path="/librarian/dashboard" element={<ProtectedRoute allowedRole="Librarian"><AdminDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/librarian/dashboard/*" element={<ProtectedRoute allowedRole="Librarian"><AdminDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          
          <Route path="/placement/dashboard" element={<ProtectedRoute allowedRole="Placement"><AdminDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/placement/dashboard/*" element={<ProtectedRoute allowedRole="Placement"><AdminDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />

          <Route path="/faculty/dashboard" element={<ProtectedRoute allowedRole="Faculty"><FacultyDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/faculty/dashboard/*" element={<ProtectedRoute allowedRole="Faculty"><FacultyDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/faculty" element={<Navigate to="/faculty/dashboard" replace />} />
          
          <Route path="/student/dashboard" element={<ProtectedRoute allowedRole="Student"><StudentDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/student/dashboard/*" element={<ProtectedRoute allowedRole="Student"><StudentDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          
          <Route path="/parent/dashboard" element={<ProtectedRoute allowedRole="Parent"><ParentDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/parent/dashboard/*" element={<ProtectedRoute allowedRole="Parent"><ParentDashboard onNav={handleNav} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/parent" element={<Navigate to="/parent/dashboard" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}
