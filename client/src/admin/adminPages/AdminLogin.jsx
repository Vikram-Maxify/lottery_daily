import {
  AlertTriangle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import {
  adminLogin,
  clearAdminError,
} from "../../reducer/slice/adminAuthReducer";

const DEV_CREDENTIALS = {
  mobile: "1234567890",
  password: "123456",
};

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { admin, isAuthenticated, loading, error } = useSelector(
    (state) => state.adminAuth,
  );

  const [formData, setFormData] = useState({
    mobile: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [filledFeedback, setFilledFeedback] = useState(false);

  // Already logged in check
  if (isAuthenticated && admin) {
    const role = String(admin?.role || "").toLowerCase();
    if (role === "admin") {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) dispatch(clearAdminError());
  };

  // Login submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await dispatch(adminLogin(formData));

    if (adminLogin.fulfilled.match(result)) {
      const loggedAdmin = result.payload?.data;
      const role = String(loggedAdmin?.role || "").toLowerCase();

      if (role === "admin") {
        navigate("/dashboard", { replace: true });
      }
    }
  };

  // Auto-fill dev credentials on button click
  const handleUseDevCredentials = () => {
    setFormData({
      mobile: DEV_CREDENTIALS.mobile,
      password: DEV_CREDENTIALS.password,
    });
    if (error) dispatch(clearAdminError());

    setFilledFeedback(true);
    setTimeout(() => setFilledFeedback(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#070B19] text-white flex items-center justify-center px-4 py-10 overflow-hidden selection:bg-[#F59E0B] selection:text-black">
      {/* ==================================================
          BACKGROUND GLOWS & AMBIENCE
      ================================================== */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-[#F59E0B]/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-tl from-[#ED1D43]/20 via-[#4F46E5]/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#1E293B]/30 blur-[140px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-md z-10 space-y-4">
        {/* ==================================================
            MAIN LOGIN CARD
        ================================================== */}
        <div className="relative rounded-[28px] border border-white/10 bg-[#0E162E]/85 backdrop-blur-2xl p-7 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/5">
          {/* Top Brand Header */}
          <div className="text-center mb-7">
            {/* Crown / Shield Emblem */}
            <div className="relative mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] p-[1.5px] shadow-[0_0_35px_rgba(247,181,0,0.45)]">
              <div className="w-full h-full rounded-[14px] bg-[#0A1024] flex items-center justify-center">
                <ShieldCheck size={32} className="text-[#FFD83D]" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#10B981] border-2 border-[#0A1024] flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-extrabold uppercase tracking-widest text-[#FFD83D] mb-2">
              <Shield size={12} />
              <span>Admin Control Center</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Portal Authentication
            </h1>

            <p className="mt-1 text-xs text-[#94A3B8]">
              Sign in with your administrator credentials
            </p>
          </div>

          {/* ==================================================
              ERROR ALERT
          ================================================== */}
          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 flex items-start gap-3 text-xs text-red-200 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle
                size={18}
                className="text-red-400 flex-shrink-0 mt-0.5"
              />
              <div className="flex-1 font-semibold">{error}</div>
            </div>
          )}

          {/* ==================================================
              LOGIN FORM
          ================================================== */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                Admin Mobile Number
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <Phone size={17} />
                </div>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  autoComplete="username"
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-[#64748B] outline-none transition focus:border-[#F59E0B] focus:bg-white/[0.07] focus:ring-2 focus:ring-[#F59E0B]/20 font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#CBD5E1]">
                  Security Password
                </label>
              </div>

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <Lock size={17} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full h-12 pl-10 pr-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-[#64748B] outline-none transition focus:border-[#F59E0B] focus:bg-white/[0.07] focus:ring-2 focus:ring-[#F59E0B]/20 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Main Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-[#FFD83D] via-[#F7B500] to-[#E39A00] hover:brightness-110 active:scale-[0.99] text-[#1A1204] font-black text-sm transition shadow-[0_0_25px_rgba(247,181,0,0.35)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-[#1A1204]" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="pt-2 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-[#64748B] font-bold uppercase tracking-wider">
                Quick Action
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* USE DEV CREDENTIALS BUTTON (CLICK TO AUTO-FILL) */}
            <button
              type="button"
              onClick={handleUseDevCredentials}
              className={`w-full h-11 rounded-xl border transition active:scale-[0.98] text-xs font-bold flex items-center justify-center gap-2 ${
                filledFeedback
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                  : "border-white/10 hover:border-[#FFD83D]/40 bg-white/[0.03] hover:bg-white/[0.08] text-[#CBD5E1] hover:text-[#FFD83D]"
              }`}
            >
              {filledFeedback ? (
                <>
                  <Check size={15} className="text-emerald-400" />
                  <span>Dev Credentials Filled!</span>
                </>
              ) : (
                <>
                  <Zap size={15} className="text-[#FFD83D] fill-[#FFD83D]" />
                  <span>Use Dev Credentials</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ==================================================
            FOOTER LINKS & SECURITY
        ================================================== */}
        <div className="text-center pt-1 space-y-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xs text-[#64748B] hover:text-[#FFD83D] transition font-semibold"
          >
            ← Return to Lottery User Portal
          </button>

          <p className="text-[11px] text-[#475569] flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} className="text-[#10B981]" />
            <span>256-Bit SSL Encrypted Admin Session</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
