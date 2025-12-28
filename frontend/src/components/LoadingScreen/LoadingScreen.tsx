import React, { useEffect, useState } from "react";
import { baseURLL } from "../../api";

type LoadingScreenProps = {
  tips?: string[];
  title: string;
  subtitle?: string;
};

export default function LoadingScreen({
  title,
  subtitle,
  tips = [
    "Always verify abnormal results before finalizing.",
    "Reference ranges may vary by age and gender.",
    "Panels combine multiple related lab tests for efficiency.",
    "Critical values are flagged automatically for review.",
    "Results are stored securely and linked to the visit record.",
  ],
}: LoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 1200);
    return () => window.clearInterval(id);
  }, [tips.length]);
  return (
    <div className="w-full max-w-md px-6">
      <div className="rounded-2xl border border-neutral-200 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold"></div>
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
        <div className="mt-4 flex gap-2">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
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
