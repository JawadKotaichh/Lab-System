import { baseURLL } from "../../api";

type LoadingScreenProps = {
  title: string;
  subtitle?: string;
};

export default function LoadingScreen({ title, subtitle }: LoadingScreenProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 gap-4">
      <div className="w-full max-w-sm shadow-sm p-6 text-center">
        <div className="w-full flex justify-center gap-4">
          <img
            src={`${baseURLL}/branding/logo`}
            className="w-40 max-w-full h-auto object-contain"
          />
        </div>
        <div className="flex-1 items-center">
          <div className="text-lg font-semibold text-center mt-5">{title}</div>
          <div className="text-sm text-neutral-500">{subtitle}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center">
        <div className="flex h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
        <div className="mt-4 text-center text-xs text-neutral-400">
          Lab System is securely loading your workspace.
        </div>
      </div>
    </div>
  );
}
