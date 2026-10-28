import type { ComponentPropsWithoutRef } from "react";
import { LoaderCircle, type LucideIcon } from "lucide-react";

export const primaryButtonStyle = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
export const secondaryButtonStyle = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
export const removeButtonStyle = "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

type Props = ComponentPropsWithoutRef<"button"> & { variant?: "primary" | "secondary" | "remove"; icon?: LucideIcon; busy?: boolean };
export default function ActionButton({ variant = "primary", icon: Icon, busy = false, disabled, type = "button", className = "", children, ...props }: Props) {
  return <button {...props} title={props.title ?? props["aria-label"]} type={type} disabled={disabled || busy} aria-busy={busy || undefined}
    className={`${variant === "remove" ? removeButtonStyle : variant === "secondary" ? secondaryButtonStyle : primaryButtonStyle} ${className}`}>
    {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
    {children}
  </button>;
}
