import SaveButton from "../SaveButton";
import { useFormValidation, ValidationSummary, FieldError, required } from "../FormValidation";
import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { baseURLL, getApiErrorMessage } from "../../api";
import { fetchUser } from "../utils";

type LoginInProps = {
  onSubmit?: (data: { username: string; password: string }) => Promise<void>;
  title?: string;
  buttonText?: string;
  patient_id?: string;
};

const LoginPage = ({
  onSubmit,
  title = "Sign in to your account",
  buttonText = "Sign in",
  patient_id,
}: LoginInProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const validation = useFormValidation([
    { name: "username", label: "Username", error: required(username, "Username") },
    { name: "password", label: "Password", error: required(password, "Password") },
  ]);
  useEffect(() => {
    let cancelled = false;
    async function loadUsername() {
      if (!patient_id) return;
      try {
        const resp = await fetchUser(patient_id);
        if (!cancelled) setUsername(resp.username ?? "");
      } catch (err) {
        if (!cancelled) { setUsername(""); setError(getApiErrorMessage(err, "Could not load the account username")); }
      }
    }
    loadUsername();
    return () => {
      cancelled = true;
    };
  }, [patient_id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!onSubmit || loading) return;
    setError("");
    if (!validation.validate()) return;

    try {
      setLoading(true);
      setShowPassword(false);
      await onSubmit({ username, password });
    } catch (err) {
      setError(getApiErrorMessage(err, buttonText === "Sign in" ? "Could not sign in" : "Could not update your account"));
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-40 h-34 justify-center">
            <img
              src={`${baseURLL}/branding/logo`}
              alt="logo"
              className="w-40 h-34 object-contain"
            />
          </div>
        </div>
        <h1 className="text-center text-2xl font-semibold text-gray-900">
          {title}
        </h1>

        <div className="w-full mt-6 rounded-xl border border-gray-200 justify-center bg-white shadow-sm">
          <form noValidate onSubmit={handleSubmit} className="p-6">
            <ValidationSummary validation={validation} />
            {error && <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <label htmlFor={validation.id("username")} className="block text-sm font-medium text-gray-800">
              Username:
            </label>
            <input
              {...validation.field("username")}
              type="text"
              autoComplete="username"
              className="w-full mt-2 rounded-md border border-gray-300 bg-white focus:ring-indigo-200 px-3 py-2 text-sm text-gray-900 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={loading}
            />
            <FieldError validation={validation} name="username" />
            <label htmlFor={validation.id("password")} className="block text-sm font-medium text-gray-800">
              Password:
            </label>
            <div className="relative mt-2">
              <input
                {...validation.field("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="w-full rounded-md border border-gray-300 bg-white focus:ring-indigo-200 pl-3 pr-12 py-2 text-sm text-gray-900 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-controls={validation.id("password")}
                aria-pressed={showPassword}
                disabled={loading}
                className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-3 text-gray-500 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            <FieldError validation={validation} name="password" />
            {buttonText === "Sign in" ? (
              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full rounded-md text-white bg-indigo-600 px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Signing in…
                  </span>
                ) : buttonText}
              </button>
            ) : (
              <SaveButton type="submit" saving={loading} savingLabel="Updating…" className="mt-5 w-full">
                {buttonText}
              </SaveButton>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
