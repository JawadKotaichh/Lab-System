import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";

export type SaveState = {
  status: "idle" | "saving" | "saved" | "error";
  message?: string;
};

export default function SaveFeedback({
  state,
  onRetry,
}: {
  state: SaveState;
  onRetry?: () => void;
}) {
  if (!state.message) return null;
  const Icon = state.status === "saving"
    ? LoaderCircle
    : state.status === "saved" ? CheckCircle2 : AlertCircle;
  const color = state.status === "error" ? "text-red-700"
    : state.status === "saved" ? "text-emerald-700" : "text-gray-600";

  return (
    <span
      role={state.status === "error" ? "alert" : "status"}
      aria-live={state.status === "error" ? "assertive" : "polite"}
      className={`inline-flex items-center gap-2 text-sm ${color}`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${state.status === "saving" ? "animate-spin" : ""}`} aria-hidden="true" />
      <span>{state.message}</span>
      {state.status === "error" && onRetry && (
        <button type="button" onClick={onRetry} className="rounded underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer">
          Retry
        </button>
      )}
    </span>
  );
}
