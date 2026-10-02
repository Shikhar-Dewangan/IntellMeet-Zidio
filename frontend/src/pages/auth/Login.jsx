import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, Video, ArrowRight } from "lucide-react";

import { loginUser, googleAuth } from "../../services/auth.service";
import { setCredentials, setLoading } from "../../store/slices/authSlice";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: "", password: "" } });

  /* ============ EMAIL/PASSWORD LOGIN ============ */
  const onSubmit = async (data) => {
    try {
      dispatch(setLoading(true));
      const res = await loginUser({
        email: data.email,
        password: data.password,
      });
      dispatch(setCredentials(res.user));
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Login failed. Please try again.";
      toast.error(msg);
    } finally {
      dispatch(setLoading(false));
    }
  };

  /* ============ GOOGLE LOGIN ============ */
  const handleGoogleSuccess = async (idToken) => {
    try {
      dispatch(setLoading(true));
      const res = await googleAuth(idToken);
      dispatch(setCredentials(res.user));
      toast.success("Signed in with Google!");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Google sign-in failed.";
      toast.error(msg);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGoogleError = (message) => {
    toast.error(message || "Google sign-in failed.");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/40 to-white flex items-start justify-center px-3 py-4 sm:p-6 lg:items-center lg:p-8">
      <div className="w-full max-w-6xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-900/5 border border-slate-200 overflow-hidden grid lg:grid-cols-2">
        {/* ============ LEFT — Branding + Mockup ============ */}
        <div className="hidden lg:flex flex-col p-10 xl:p-14 bg-linear-to-brrom-white via-blue-50/30 to-violet-50/30">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-12">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 leading-none">
                IntelliMeet
              </p>
              <p className="text-[10px] font-semibold tracking-wider text-slate-500 mt-1 uppercase">
                Next-Gen Meetings
              </p>
            </div>
          </Link>

          {/* Heading */}
          <div>
            <h2 className="text-3xl xl:text-4xl font-bold text-slate-900 leading-tight">
              Welcome back
            </h2>
            <p className="mt-3 text-slate-600 leading-relaxed flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 shrink-0" />
              Sign in to continue to your account
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="mt-8 space-y-3">
            {[
              "Real-time video meetings & screen sharing",
              "AI transcription, summaries and action items",
              "In-meeting chat and shared notes",
              "Turn discussions into tasks and projects",
            ].map((t) => (
              <li
                key={t}
                className="flex items-start gap-3 text-sm text-slate-700"
              >
                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-3 h-3 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                {t}
              </li>
            ))}
          </ul>

          {/* Mini product preview */}
          <div className="mt-10 rounded-2xl bg-slate-900 p-3 shadow-xl">
            <div className="rounded-xl bg-slate-950 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center">
                    <Video className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-[9px] font-semibold text-white">
                    IntelliMeet
                  </span>
                </div>
                <span className="text-[8px] text-slate-500">00:24:15</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-video rounded bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px] font-bold">
                      {["R", "P", "N"][i - 1]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 p-1.5 rounded bg-slate-900">
                <p className="text-[8px] text-blue-400 font-semibold mb-0.5">
                  AI Summary
                </p>
                <p className="text-[7px] text-slate-500 leading-relaxed">
                  Discussed roadmap, finalized Q3 features, assigned action
                  items.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ RIGHT — Form ============ */}
        <div className="p-5 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-center">
          {/* Mobile logo */}
          <Link
            to="/"
            className="lg:hidden flex items-center gap-2.5 mb-6 sm:mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">
              IntelliMeet
            </span>
          </Link>

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Sign in to continue to your account
            </p>
          </div>

          {/* Google Sign-In (official GIS button) */}
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            disabled={loading}
          />

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Enter a valid email",
                    },
                  })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:outline-none transition"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember" className="text-sm text-slate-600">
                Remember me
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-lg shadow-blue-600/25"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to register */}
          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Create one <ArrowRight className="w-3 h-3" />
            </Link>
          </p>

          {/* Terms */}
          <p className="mt-4 text-center text-xs text-slate-400 leading-relaxed">
            By continuing, you agree to our{" "}
            <a
              href="#"
              className="text-slate-600 hover:text-blue-600 underline-offset-2 hover:underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-slate-600 hover:text-blue-600 underline-offset-2 hover:underline"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
