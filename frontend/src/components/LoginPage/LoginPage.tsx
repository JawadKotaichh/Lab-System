import { FormEvent, useState } from "react";
import { baseURLL } from "../../api";

type LoginInProps = {
  onSubmit?: (data: {
    username: string;
    password: string;
  }) => boolean | Promise<boolean>;
};
const LoginPage = ({ onSubmit }: LoginInProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    try {
      const ok = await onSubmit?.({ username, password });

      if (!ok) {
        alert("Invalid credentials");
        return;
      }
    } catch {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 justify-center">
            <img
              src={`${baseURLL}/branding/logo`}
              alt="logo"
              className="h-40 w-32 object-contain"
            />
          </div>
        </div>
        <h1 className="text-center text-2xl font-semibold text-gray-900">
          Sign in to your account
        </h1>

        <div className="w-full mt-6 rounded-xl border border-gray-200 justify-center bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="p-6">
            <label className="block text-sm font-medium text-gray-800">
              Username:
            </label>
            <input
              type="text"
              autoComplete="username"
              className="w-full mt-2 rounded-md border border-gray-300 bg-white focus:ring-indigo-200 px-3 py-2 text-sm text-gray-900 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={loading}
            />
            <label className="block text-sm font-medium text-gray-800">
              Password:
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className=" w-full mt-2 rounded-md border border-gray-300 bg-white focus:ring-indigo-200 px-3 py-2 text-sm text-gray-900 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-md text-white bg-indigo-600 px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
