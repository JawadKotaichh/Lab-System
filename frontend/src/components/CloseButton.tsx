import type { ComponentPropsWithoutRef } from "react";
import { X } from "lucide-react";

type Props = Omit<ComponentPropsWithoutRef<"button">, "children"> & { label: string };

export default function CloseButton({ label, className = "", type = "button", ...props }: Props) {
  return <button {...props} type={type} aria-label={label} title={label}
    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${className}`}>
    <X className="h-5 w-5" aria-hidden="true" />
  </button>;
}
