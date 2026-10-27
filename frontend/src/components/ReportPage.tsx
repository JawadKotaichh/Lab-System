import { Component, Suspense, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import LoadingPage from "./LoadingPage/LoadingPage";

export class ReportLoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (this.state.failed) return (
      <div role="alert" className="m-6 rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
        <p>The report could not be loaded. Please try again.</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-3 rounded-lg border px-4 py-2 cursor-pointer">
          Reload page
        </button>
      </div>
    );
    return this.props.children;
  }
}

export default function ReportPage({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <ReportLoadBoundary key={location.pathname}>
      <Suspense fallback={<LoadingPage title="Loading report…" />}>
        {children}
      </Suspense>
    </ReportLoadBoundary>
  );
}
