import React from "react";
import { baseURLL } from "src/api";

type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
  progress?: number;
  tips?: string[];
  fullScreen?: boolean;
};

export default function LoadingScreen({
  title = "Loading…",
  subtitle = "Preparing your data",
  progress,
  tips = [
    "Fetching patient profile…",
    "Syncing lab results…",
    "Finalizing formatting…",
  ],
  fullScreen = true,
}: LoadingScreenProps) {
  const [tipIndex, setTipIndex] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 1200);
    return () => window.clearInterval(id);
  }, [tips.length]);

  const Container = fullScreen ? "min-h-screen" : "min-h-[260px]";

  return (
    <div
      className={`${Container} w-full flex items-center justify-center bg-white text-neutral-800`}
    >
      <div className="w-full max-w-md px-6">
        <div className="rounded-2xl border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold">
              {`${baseURLL}/branding/logo`}
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold">{title}</div>
              <div className="text-sm text-neutral-500">{subtitle}</div>
            </div>

            <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
          </div>
          <div className="mt-5 text-sm">
            <span className="text-neutral-500">Status: </span>
            <span className="font-medium">{tips[tipIndex]}</span>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-neutral-900 transition-all duration-500"
                style={{
                  width: `${Math.max(0, Math.min(100, progress ?? 35))}%`,
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-neutral-500">
              <span>Please wait</span>
              <span>{progress != null ? `${progress}%` : "…"}</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Dot delay="0ms" />
            <Dot delay="150ms" />
            <Dot delay="300ms" />
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-neutral-400">
          Lab System is securely loading your workspace.
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <div
      className="h-2 w-2 rounded-full bg-neutral-900 animate-pulse"
      style={{ animationDelay: delay }}
    />
  );
}
