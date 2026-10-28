import type { ComponentPropsWithoutRef } from "react";
import { Save } from "lucide-react";
import ActionButton from "./ActionButton";

type Props = ComponentPropsWithoutRef<"button"> & {
  saving?: boolean;
  savingLabel?: string;
};

export default function SaveButton({ saving = false, savingLabel = "Saving…", children = "Save", className = "", disabled, type = "button", ...props }: Props) {
  return <ActionButton {...props} type={type} disabled={disabled} busy={saving} icon={Save} className={className}>
    {saving ? savingLabel : children}
  </ActionButton>;
}
