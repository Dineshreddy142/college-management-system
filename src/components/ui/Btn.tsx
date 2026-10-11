import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...args: any[]) => twMerge(clsx(...args));

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
    secondary: "bg-slate-100 text-[#0F172A] hover:bg-slate-200 border border-[#E2E8F0] dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700",
    ghost: "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800",
    danger: "bg-[#B91C1C] text-white hover:bg-red-800 active:bg-red-900 shadow-xs",
    success: "bg-[#15803D] text-white hover:bg-emerald-800 active:bg-emerald-900 shadow-xs",
    outline: "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  };
  const s = {
    sm: "px-2.5 py-1 text-xs rounded-md gap-1.5",
    md: "px-3.5 py-2 text-sm rounded-lg gap-2",
    lg: "px-5 py-2.5 text-sm font-semibold rounded-lg gap-2.5",
  };

  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
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
