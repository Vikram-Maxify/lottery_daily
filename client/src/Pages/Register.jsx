import {
  ArrowRight,
  Eye,
  EyeOff,
  Gift,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import banner from "../assets/dear-rgst.jpg";

import { register } from "../reducer/slice/authSlice";

// ⚠️ Apne bottom navbar ki height (px). Content isse peeche nahi chhupega.
// Agar is page par navbar nahi hai to 0 kar do.
const BOTTOM_NAV_HEIGHT = 64;

const inputWrap =
  "flex h-[52px] w-full items-center overflow-hidden rounded-xl border border-[#d6dfec] bg-[#eaf1ff] transition-all focus-within:border-[#ed1d43] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(237,29,67,0.12)]";

const inputBase =
  "h-full min-w-0 flex-1 border-none bg-transparent text-[14px] font-medium text-[#173e70] outline-none placeholder:text-[#8a97ab] focus:outline-none focus:ring-0 disabled:opacity-60";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const urlRef = searchParams.get("ref") || "";

  const [form, setForm] = useState({
    number: "",
    name: "",
    password: "",
    confirmPassword: "",
    referralBy: urlRef,
  });

  useEffect(() => {
    if (urlRef && !form.referralBy) {
      setForm((prev) => ({ ...prev, referralBy: urlRef }));
    }
  }, [urlRef]);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const { registerLoading, registerError } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "number") {
      const numericValue = value.replace(/\D/g, "");

      setForm((prev) => ({
        ...prev,
        [name]: numericValue,
      }));

      if (error) setError("");
      return;
    }

    if (name === "referralBy") {
      setForm((prev) => ({
        ...prev,
        [name]: value.toUpperCase(),
      }));
      if (error) setError("");
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.number || !form.name || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (form.number.length !== 10) {
      setError("Mobile number must be 10 digits");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const payload = {
      name: form.name.trim(),
      mobile: form.number,
      password: form.password,
    };

    if (form.referralBy && form.referralBy.trim()) {
      payload.referralBy = form.referralBy.trim().toUpperCase();
    }

    const result = await dispatch(register(payload));

    if (register.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div className="w-full overflow-x-hidden bg-[#EBF0F7]">
      <div
        className="mx-auto w-full max-w-[500px]"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 16 }}
      >
        {/* ================= BANNER (IMAGE) ================= */}
        <section className="relative overflow-hidden bg-[#06132d] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <img
            src={banner}
            alt="Dear Lottery"
            loading="lazy"
            className="block h-auto w-full select-none object-cover"
            draggable={false}
          />
        </section>

        {/* ================= REGISTER CARD ================= */}
        <div className="relative z-10 mx-3 mt-3 rounded-[20px] border border-[#e6c97c]/70 bg-[#fffaf4] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.18)]">
          <div className="mb-4 text-center">
            <h1 className="text-[23px] font-extrabold leading-[1.25] text-[#173e70]">
              Create Your <span className="text-[#d7193f]">Account</span>
            </h1>

            <p className="mt-1 text-[12px] text-[#4b5563]">
              Join now and start your winning journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            {/* MOBILE */}
            <div className={inputWrap}>
              <div className="flex w-[45px] shrink-0 justify-center">
                <Smartphone
                  size={20}
                  strokeWidth={2.3}
                  className="text-[#d7193f]"
                />
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
                disabled={registerLoading}
                className={inputBase}
              />
            </div>

            {/* NAME */}
            <div className={inputWrap}>
              <div className="flex w-[45px] shrink-0 justify-center">
                <User size={20} strokeWidth={2.3} className="text-[#d7193f]" />
              </div>

              <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                disabled={registerLoading}
                className={`${inputBase} px-3`}
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
                placeholder="Create a password"
                autoComplete="new-password"
                disabled={registerLoading}
                className={`${inputBase} px-3`}
              />

              <button
                type="button"
                onClick={() => setShowPass((prev) => !prev)}
                disabled={registerLoading}
                aria-label="Show or hide password"
                className="flex h-full w-[45px] shrink-0 items-center justify-center"
              >
                {showPass ? (
                  <EyeOff
                    size={19}
                    strokeWidth={2.3}
                    className="text-[#173e70]"
                  />
                ) : (
                  <Eye size={19} strokeWidth={2.3} className="text-[#173e70]" />
                )}
              </button>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className={inputWrap}>
              <div className="flex w-[45px] shrink-0 justify-center">
                <Lock size={20} strokeWidth={2.3} className="text-[#d7193f]" />
              </div>

              <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />

              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={registerLoading}
                className={`${inputBase} px-3`}
              />

              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                disabled={registerLoading}
                aria-label="Show or hide confirm password"
                className="flex h-full w-[45px] shrink-0 items-center justify-center"
              >
                {showConfirm ? (
                  <EyeOff
                    size={19}
                    strokeWidth={2.3}
                    className="text-[#173e70]"
                  />
                ) : (
                  <Eye size={19} strokeWidth={2.3} className="text-[#173e70]" />
                )}
              </button>
            </div>

            {/* REFERRAL CODE (OPTIONAL) */}
            <div className={inputWrap}>
              <div className="flex w-[45px] shrink-0 justify-center">
                <Gift size={20} strokeWidth={2.3} className="text-[#d7193f]" />
              </div>

              <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />

              <input
                type="text"
                name="referralBy"
                value={form.referralBy}
                onChange={handleChange}
                placeholder="Referral Code (Optional)"
                autoCapitalize="characters"
                disabled={registerLoading}
                className={`${inputBase} px-3 font-semibold uppercase tracking-wider`}
              />

              {form.referralBy && (
                <span className="mr-3 shrink-0 rounded-md bg-[#d7193f]/10 px-2 py-0.5 text-[10px] font-bold text-[#d7193f]">
                  APPLIED
                </span>
              )}
            </div>

            {(error || registerError) && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-center text-[11px] font-medium text-red-600">
                {error || registerError}
              </p>
            )}

            {/* REGISTER BUTTON */}
            <button
              type="submit"
              disabled={registerLoading}
              className="mt-0.5 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] text-[17px] font-extrabold text-white shadow-[0_8px_25px_rgba(255,20,67,0.4)] transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registerLoading ? (
                <>
                  <Loader2 size={19} strokeWidth={3} className="animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  Register Now
                  <ArrowRight size={21} strokeWidth={2.8} />
                </>
              )}
            </button>

            {/* DIVIDER */}
            <div className="my-1 flex items-center gap-2.5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d8c8ad]" />
              <span className="whitespace-nowrap text-[11px] text-[#6b7280]">
                Already have an account?
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d8c8ad]" />
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="button"
              onClick={() =>
                navigate(
                  form.referralBy
                    ? `/login?ref=${form.referralBy.trim().toUpperCase()}`
                    : "/login",
                )
              }
              disabled={registerLoading}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#173e70] to-[#0d2547] text-[15px] font-bold text-white shadow-lg transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Login
              <ArrowRight size={19} strokeWidth={2.8} />
            </button>
          </form>

          {/* FEATURES */}
          <div className="mt-5 grid grid-cols-3 border-t border-[#d8c8ad] pt-4">
            <Feature
              icon={<Zap size={20} fill="currentColor" strokeWidth={2.2} />}
              lines={["Fast", "Registration"]}
            />
            <Feature
              icon={<ShieldCheck size={21} strokeWidth={2.2} />}
              lines={["100%", "Secure"]}
            />
            <Feature
              icon={<Users size={21} strokeWidth={2.2} />}
              lines={["Thousands", "of Players"]}
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

export default Register;
