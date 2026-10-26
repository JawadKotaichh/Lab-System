import type { ComponentPropsWithoutRef } from "react";
import { LoaderCircle, Save } from "lucide-react";

type Props = ComponentPropsWithoutRef<"button"> & {
  saving?: boolean;
  savingLabel?: string;
};

export default function SaveButton({ saving = false, savingLabel = "Saving…", children = "Save", className = "", disabled, type = "button", ...props }: Props) {
  return <button {...props} type={type} disabled={disabled || saving} aria-busy={saving || undefined}
    className={`inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2 font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${className}`}>
    {saving ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4 shrink-0" aria-hidden="true" />}
    {saving ? savingLabel : children}
  </button>;
}
