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
  type = "button"
}: {
  children?: React.ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  type?: "button" | "submit";
}) {
  const v = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 dark:shadow-blue-900/20",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
    ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-green-600 text-white hover:bg-green-700",
    outline: "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60",
  };
  const s = {
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-4 py-2 text-sm rounded-xl gap-2",
    lg: "px-6 py-3 text-base rounded-2xl gap-2",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
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
