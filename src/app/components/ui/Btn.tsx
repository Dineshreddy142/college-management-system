import React from 'react';
import { cn } from './utils';

export { cn };

export type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "success";
export type BtnSize = "sm" | "md" | "lg";

export function Btn({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled,
  icon,
  type = "button",
  title
}: {
  children?: React.ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  type?: "button" | "submit";
  title?: string;
}) {
  const v = {
    primary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF] shadow-xs",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700",
    ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800",
    danger: "bg-[#B91C1C] text-white hover:bg-red-800 active:bg-red-900 shadow-xs",
    success: "bg-[#15803D] text-white hover:bg-emerald-800 active:bg-emerald-900 shadow-xs",
    outline: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-800",
  };
  const s = {
    sm: "px-2.5 py-1 text-xs rounded-md gap-1.5 font-medium",
    md: "px-3.5 py-1.5 text-xs sm:text-sm rounded-md gap-2 font-medium",
    lg: "px-4.5 py-2 text-sm font-medium rounded-lg gap-2.5",
  };

  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
        v[variant],
        s[size],
        className
      )}
    >

      {icon}
      {children}
    </button>
  );
}
