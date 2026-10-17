import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import banner from "../assets/dear-login.jpg";

import {
  login,
  resetForgotPasswordState,
  resetPasswordWithOtp,
  sendForgotPasswordOtp,
} from "../reducer/slice/authSlice";

const BOTTOM_NAV_HEIGHT = 64;

const inputWrap =
  "flex h-[54px] w-full items-center overflow-hidden rounded-xl border border-[#d6dfec] bg-[#eaf1ff] transition-all focus-within:border-[#ed1d43] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(237,29,67,0.12)]";

const inputBase =
  "h-full min-w-0 flex-1 border-none bg-transparent text-[14px] font-medium text-[#173e70] outline-none placeholder:text-[#8a97ab] focus:outline-none focus:ring-0 disabled:opacity-60";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const urlRef = searchParams.get("ref") || "";

  const [form, setForm] = useState({
    number: "",
    password: "",
    referralBy: urlRef,
  });

  // Forgot password flow
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = mobile, 2 = OTP+new password
  const [forgotForm, setForgotForm] = useState({
    mobile: "",
    otp: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmNewPass, setShowConfirmNewPass] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (urlRef && !form.referralBy) {
      setForm((prev) => ({ ...prev, referralBy: urlRef }));
    }
  }, [urlRef]);

  useEffect(() => {
    return () => {
      dispatch(resetForgotPasswordState());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dispatch]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    timerRef.current = setInterval(() => {
      setResendTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [resendTimer]);

  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  const {
    loginLoading,
    loginError,
    sendForgotOtpLoading,
    sendForgotOtpError,
    sendForgotOtpSuccess,
    resetPasswordLoading,
    resetPasswordError,
    resetPasswordSuccess,
  } = useSelector((state) => state.auth);

  const busy =
    loginLoading ||
    sendForgotOtpLoading ||
    resetPasswordLoading;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "number") {
      setForm((prev) => ({ ...prev, [name]: value.replace(/\D/g, "") }));
      if (error) setError("");
      return;
    }
    if (name === "referralBy") {
      setForm((prev) => ({ ...prev, [name]: value.toUpperCase() }));
      if (error) setError("");
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.number || !form.password) {
      setError("Please fill in all fields");
      return;
    }
    if (form.number.length !== 10) {
      setError("Mobile number must be 10 digits");
      return;
    }

    const payload = {
      mobile: form.number,
      password: form.password,
    };

    if (form.referralBy && form.referralBy.trim()) {
      payload.referralBy = form.referralBy.trim().toUpperCase();
    }

    const result = await dispatch(login(payload));

    if (login.fulfilled.match(result)) {
      navigate("/");
    }
  };

  // -------- FORGOT PASSWORD FLOW --------
  const openForgot = () => {
    setForgotOpen(true);
    setForgotStep(1);
    setForgotForm({
      mobile: form.number || "",
      otp: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setError("");
    dispatch(resetForgotPasswordState());
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotStep(1);
    setError("");
    dispatch(resetForgotPasswordState());
  };

  const handleForgotChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile" || name === "otp") {
      const v =
        name === "otp"
          ? value.replace(/\D/g, "").slice(0, 6)
          : value.replace(/\D/g, "").slice(0, 10);
      setForgotForm((p) => ({ ...p, [name]: v }));
    } else {
      setForgotForm((p) => ({ ...p, [name]: value }));
    }
    if (error) setError("");
  };

  const handleForgotSendOtp = async (e) => {
    e?.preventDefault();
    setError("");

    if (forgotForm.mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    const res = await dispatch(
      sendForgotPasswordOtp({ mobile: forgotForm.mobile })
    );

    if (sendForgotPasswordOtp.fulfilled.match(res)) {
      setForgotStep(2);
      setResendTimer(30);
    }
  };

  const handleForgotResend = async () => {
    if (resendTimer > 0 || busy) return;
    setError("");
    const res = await dispatch(
      sendForgotPasswordOtp({ mobile: forgotForm.mobile })
    );
    if (sendForgotPasswordOtp.fulfilled.match(res)) {
      setResendTimer(30);
      setForgotForm((p) => ({ ...p, otp: "" }));
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    setError("");

    if (forgotForm.otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    if (forgotForm.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (forgotForm.newPassword !== forgotForm.confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    const res = await dispatch(
      resetPasswordWithOtp({
        mobile: forgotForm.mobile,
        otp: forgotForm.otp,
        newPassword: forgotForm.newPassword,
      })
    );

    if (resetPasswordWithOtp.fulfilled.match(res)) {
      // auto-close after short delay
      setTimeout(() => {
        closeForgot();
        setForm((p) => ({ ...p, number: forgotForm.mobile, password: "" }));
      }, 900);
    }
  };

  return (
    <div className="w-full overflow-x-hidden bg-[#EBF0F7]">
      <div
        className="mx-auto w-full max-w-[500px]"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 16 }}
      >
        {/* BANNER */}
        <section className="relative overflow-hidden bg-[#06132d] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <img
            src={banner}
            alt="Dear Lottery"
            loading="lazy"
            className="block h-auto w-full select-none object-cover"
            draggable={false}
          />
        </section>

        {/* CARD */}
        <div className="relative z-10 mx-3 mt-3 rounded-[20px] border border-[#e6c97c]/70 bg-[#fffaf4] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.18)]">
          {!forgotOpen ? (
            <>
              <div className="mb-4 text-center">
                <h1 className="text-[23px] font-extrabold leading-[1.25] text-[#173e70]">
                  Login to your <span className="text-[#d7193f]">account</span>
                </h1>
                <p className="mt-1 text-[12px] text-[#4b5563]">
                  Start your lucky journey again
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                {/* MOBILE */}
                <div className={inputWrap}>
                  <div className="flex w-[45px] shrink-0 justify-center">
                    <Smartphone size={20} strokeWidth={2.3} className="text-[#d7193f]" />
                  </div>
                  <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />
                  <div className="flex h-full shrink-0 items-center px-2 text-[14px] font-semibold text-[#173e70]">
                    +91
                  </div>
                  <input
                    type="tel"
                    name="number"
                    maxLength={10}
                    value={form.number}
                    onChange={handleChange}
                    placeholder="Enter your mobile number"
                    autoComplete="tel"
                    disabled={loginLoading}
                    className={inputBase}
                  />
                </div>

                {/* PASSWORD */}
                <div className={inputWrap}>
                  <div className="flex w-[45px] shrink-0 justify-center">
                    <Lock size={20} strokeWidth={2.3} className="text-[#d7193f]" />
                  </div>
                  <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />
                  <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loginLoading}
                    className={`${inputBase} px-3`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    disabled={loginLoading}
                    className="flex h-full w-[45px] shrink-0 items-center justify-center"
                  >
                    {showPass ? (
                      <EyeOff size={19} strokeWidth={2.3} className="text-[#173e70]" />
                    ) : (
                      <Eye size={19} strokeWidth={2.3} className="text-[#173e70]" />
                    )}
                  </button>
                </div>

                {(error || loginError) && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-center text-[11px] font-medium text-red-600">
                    {error || loginError}
                  </p>
                )}

                {/* REMEMBER / FORGOT */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setRemember((p) => !p)}
                    className="flex items-center gap-2"
                  >
                    <span
                      className={`flex h-[22px] w-[22px] items-center justify-center rounded-md border transition ${
                        remember
                          ? "border-[#ed1d43] bg-[#ed1d43] text-white"
                          : "border-[#b8c3d4] bg-white"
                      }`}
                    >
                      {remember && <Check size={15} strokeWidth={3} />}
                    </span>
                    <span className="text-[12px] font-medium text-[#26354b]">
                      Remember me
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={openForgot}
                    className="text-[12px] font-semibold text-[#d7193f]"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="mt-0.5 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] text-[17px] font-extrabold text-white shadow-[0_8px_25px_rgba(255,20,67,0.4)] transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 size={19} strokeWidth={3} className="animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <ArrowRight size={21} strokeWidth={2.8} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 flex items-center gap-2.5">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d8c8ad]" />
                <span className="whitespace-nowrap text-[11px] text-[#6b7280]">
                  New here? Create an account now
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d8c8ad]" />
              </div>

              <Link
                to={
                  form.referralBy
                    ? `/register?ref=${form.referralBy.trim().toUpperCase()}`
                    : "/register"
                }
                className="mt-3 flex h-[48px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#173e70] to-[#0d2547] text-[15px] font-bold text-white shadow-lg transition active:scale-[0.99]"
              >
                Create New Account
              </Link>
            </>
          ) : (
            <>
              {/* ================= FORGOT PASSWORD FLOW ================= */}
              <div className="mb-4 text-center">
                <h1 className="text-[22px] font-extrabold leading-[1.25] text-[#173e70]">
                  {forgotStep === 1 ? (
                    <>
                      Reset your <span className="text-[#d7193f]">password</span>
                    </>
                  ) : (
                    <>
                      Verify OTP & <span className="text-[#d7193f]">set new password</span>
                    </>
                  )}
                </h1>
                <p className="mt-1 text-[12px] text-[#4b5563]">
                  {forgotStep === 1
                    ? "Enter your registered mobile number"
                    : `OTP sent to +91 ${forgotForm.mobile}`}
                </p>
              </div>

              {forgotStep === 1 ? (
                <form
                  onSubmit={handleForgotSendOtp}
                  className="flex flex-col gap-3"
                >
                  <div className={inputWrap}>
                    <div className="flex w-[45px] shrink-0 justify-center">
                      <Smartphone size={20} strokeWidth={2.3} className="text-[#d7193f]" />
                    </div>
                    <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />
                    <div className="flex h-full shrink-0 items-center px-2 text-[14px] font-semibold text-[#173e70]">
                      +91
                    </div>
                    <input
                      type="tel"
                      name="mobile"
                      maxLength={10}
                      value={forgotForm.mobile}
                      onChange={handleForgotChange}
                      placeholder="Registered mobile number"
                      disabled={busy}
                      className={inputBase}
                    />
                  </div>

                  {(error || sendForgotOtpError) && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-center text-[11px] font-medium text-red-600">
                      {error || sendForgotOtpError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] text-[16px] font-extrabold text-white shadow-lg transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendForgotOtpLoading ? (
                      <>
                        <Loader2 size={18} strokeWidth={3} className="animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send OTP
                        <ArrowRight size={20} strokeWidth={2.8} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={closeForgot}
                    disabled={busy}
                    className="text-center text-[12px] font-medium text-[#173e70] underline-offset-2 hover:underline"
                  >
                    ← Back to login
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleForgotReset}
                  className="flex flex-col gap-2.5"
                >
                  {sendForgotOtpSuccess && (
                    <p className="flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-center text-[11px] font-medium text-green-700">
                      <CheckCircle2 size={14} /> {sendForgotOtpSuccess}
                    </p>
                  )}

                  {/* OTP */}
                  <div className={inputWrap}>
                    <div className="flex w-[45px] shrink-0 justify-center">
                      <KeyRound size={20} strokeWidth={2.3} className="text-[#d7193f]" />
                    </div>
                    <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />
                    <input
                      type="text"
                      inputMode="numeric"
                      name="otp"
                      maxLength={6}
                      value={forgotForm.otp}
                      onChange={handleForgotChange}
                      placeholder="6-digit OTP"
                      disabled={busy}
                      className={`${inputBase} px-3 tracking-[0.5em] font-bold`}
                    />
                  </div>

                  {/* NEW PASSWORD */}
                  <div className={inputWrap}>
                    <div className="flex w-[45px] shrink-0 justify-center">
                      <Lock size={20} strokeWidth={2.3} className="text-[#d7193f]" />
                    </div>
                    <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />
                    <input
                      type={showNewPass ? "text" : "password"}
                      name="newPassword"
                      value={forgotForm.newPassword}
                      onChange={handleForgotChange}
                      placeholder="New password"
                      autoComplete="new-password"
                      disabled={busy}
                      className={`${inputBase} px-3`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass((p) => !p)}
                      disabled={busy}
                      className="flex h-full w-[45px] shrink-0 items-center justify-center"
                    >
                      {showNewPass ? (
                        <EyeOff size={19} strokeWidth={2.3} className="text-[#173e70]" />
                      ) : (
                        <Eye size={19} strokeWidth={2.3} className="text-[#173e70]" />
                      )}
                    </button>
                  </div>

                  {/* CONFIRM NEW PASSWORD */}
                  <div className={inputWrap}>
                    <div className="flex w-[45px] shrink-0 justify-center">
                      <Lock size={20} strokeWidth={2.3} className="text-[#d7193f]" />
                    </div>
                    <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />
                    <input
                      type={showConfirmNewPass ? "text" : "password"}
                      name="confirmNewPassword"
                      value={forgotForm.confirmNewPassword}
                      onChange={handleForgotChange}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      disabled={busy}
                      className={`${inputBase} px-3`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPass((p) => !p)}
                      disabled={busy}
                      className="flex h-full w-[45px] shrink-0 items-center justify-center"
                    >
                      {showConfirmNewPass ? (
                        <EyeOff size={19} strokeWidth={2.3} className="text-[#173e70]" />
                      ) : (
                        <Eye size={19} strokeWidth={2.3} className="text-[#173e70]" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[12px]">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep(1);
                        setError("");
                        dispatch(resetForgotPasswordState());
                      }}
                      disabled={busy}
                      className="font-medium text-[#173e70] underline-offset-2 hover:underline"
                    >
                      ← Change number
                    </button>
                    <button
                      type="button"
                      onClick={handleForgotResend}
                      disabled={busy || resendTimer > 0}
                      className="font-semibold text-[#d7193f] disabled:opacity-50"
                    >
                      {resendTimer > 0
                        ? `Resend in ${resendTimer}s`
                        : "Resend OTP"}
                    </button>
                  </div>

                  {(error || resetPasswordError) && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-center text-[11px] font-medium text-red-600">
                      {error || resetPasswordError}
                    </p>
                  )}

                  {resetPasswordSuccess && (
                    <p className="flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-center text-[11px] font-medium text-green-700">
                      <CheckCircle2 size={14} /> {resetPasswordSuccess}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={busy || forgotForm.otp.length !== 6}
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] text-[16px] font-extrabold text-white shadow-lg transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resetPasswordLoading ? (
                      <>
                        <Loader2 size={18} strokeWidth={3} className="animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <ArrowRight size={20} strokeWidth={2.8} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* FEATURES */}
          <div className="mt-5 grid grid-cols-3 border-t border-[#d8c8ad] pt-4">
            <Feature
              icon={<Zap size={20} fill="currentColor" strokeWidth={2.2} />}
              lines={["Fast", "& Easy"]}
            />
            <Feature
              icon={<ShieldCheck size={21} strokeWidth={2.2} />}
              lines={["100%", "Secure"]}
            />
            <Feature
              icon={<Users size={21} strokeWidth={2.2} />}
              lines={["Trusted by", "Thousands"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ icon, lines }) => (
  <div className="flex flex-col items-center px-1 text-center">
    <div className="mb-1.5 flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#d8c8ad] bg-[#f7f0e4] text-[#173e70]">
      {icon}
    </div>
    <p className="text-[10px] font-medium leading-[1.3] text-[#344054]">
      {lines[0]}
      <br />
      {lines[1]}
    </p>
  </div>
);

export default Login;